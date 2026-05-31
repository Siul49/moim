import { SignJWT, createRemoteJWKSet, importPKCS8, jwtVerify } from "jose";
import type { JWTVerifyGetKey } from "jose";
import { fetchWithTimeout } from "./fetch-with-timeout";

const APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
const APPLE_AUDIENCE = "https://appleid.apple.com";
const APPLE_SCOPES = "name email";
const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

export const APPLE_STATE_COOKIE = "apple_oauth_state";
export const APPLE_STATE_MAX_AGE = 60 * 10;

interface AppleTokenResponse {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  refresh_token?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface AppleUserPayload {
  email?: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

interface AppleIdTokenClaims {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
}

export interface AppleIdentity {
  subject: string;
  email?: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function normalizeApplePrivateKey(rawKey: string): string {
  return rawKey.replace(/\\n/g, "\n");
}

export function getAppleRedirectUri(origin?: string): string {
  const configured = process.env.APPLE_REDIRECT_URI?.trim();
  if (configured) return configured;

  const baseUrl = origin ?? process.env.NEXT_PUBLIC_BASE_URL?.trim();
  return `${baseUrl ?? "http://localhost:3000"}/api/auth/apple/callback`;
}

export function getAppleAuthUrl(state: string, origin?: string): string {
  const params = new URLSearchParams({
    client_id: readRequiredEnv("APPLE_CLIENT_ID"),
    redirect_uri: getAppleRedirectUri(origin),
    response_type: "code",
    response_mode: "form_post",
    scope: APPLE_SCOPES,
    state,
  });

  return `${APPLE_AUTH_URL}?${params.toString()}`;
}

export async function createAppleClientSecret(): Promise<string> {
  const clientId = readRequiredEnv("APPLE_CLIENT_ID");
  const privateKey = await importPKCS8(
    normalizeApplePrivateKey(readRequiredEnv("APPLE_PRIVATE_KEY")),
    "ES256",
  );

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: readRequiredEnv("APPLE_KEY_ID") })
    .setIssuer(readRequiredEnv("APPLE_TEAM_ID"))
    .setSubject(clientId)
    .setAudience(APPLE_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(privateKey);
}

export async function exchangeAppleCodeForToken(
  code: string,
  origin?: string,
): Promise<AppleTokenResponse> {
  const response = await fetchWithTimeout(APPLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: readRequiredEnv("APPLE_CLIENT_ID"),
      client_secret: await createAppleClientSecret(),
      code,
      grant_type: "authorization_code",
      redirect_uri: getAppleRedirectUri(origin),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as AppleTokenResponse;

  if (!response.ok || data.error) {
    const detail = data.error_description ?? data.error ?? response.status;
    throw new Error(`Apple token exchange failed: ${detail}`);
  }

  if (!data.id_token) {
    throw new Error("Apple token response did not include id_token.");
  }

  return data;
}

export function parseAppleUserPayload(
  rawUser?: string | null,
): AppleUserPayload | null {
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AppleUserPayload;
  } catch {
    return null;
  }
}

export async function extractAppleIdentity(
  idToken: string,
  rawUser?: string | null,
  key: Parameters<typeof jwtVerify>[1] | JWTVerifyGetKey = APPLE_JWKS,
): Promise<AppleIdentity> {
  const { payload: claims } = await jwtVerify<AppleIdTokenClaims>(
    idToken,
    key,
    {
      issuer: APPLE_AUDIENCE,
      audience: readRequiredEnv("APPLE_CLIENT_ID"),
    },
  );
  const subject = typeof claims.sub === "string" ? claims.sub : "";
  if (!subject) throw new Error("Apple id_token does not include sub.");

  const userPayload = parseAppleUserPayload(rawUser);
  const email =
    typeof claims.email === "string" ? claims.email : userPayload?.email;
  const verified = claims.email_verified;

  return {
    subject,
    ...(email ? { email } : {}),
    emailVerified: verified === true || verified === "true",
    ...(userPayload?.name?.firstName
      ? { firstName: userPayload.name.firstName }
      : {}),
    ...(userPayload?.name?.lastName
      ? { lastName: userPayload.name.lastName }
      : {}),
  };
}

export function buildAppleNickname(identity: AppleIdentity): string {
  const displayName = `${identity.lastName ?? ""}${identity.firstName ?? ""}`
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "")
    .slice(0, 12);
  if (displayName.length >= 2) return displayName;

  const emailName = identity.email
    ?.split("@")[0]
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "")
    .slice(0, 12);
  if (emailName && emailName.length >= 2) return emailName;

  return `apple_${identity.subject.slice(0, 8)}`;
}
