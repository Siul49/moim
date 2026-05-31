import { SignJWT, jwtVerify } from "jose";

export interface JwtPayload {
  userId: string;
  email?: string;
  nickname: string;
  provider?: "local" | "kakao" | "apple" | "google" | "naver";
}

const ACCESS_TOKEN_TTL = "7d";
export const COOKIE_NAME = "accessToken";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const VALID_PROVIDERS = new Set(["local", "kakao", "apple", "google", "naver"]);

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
  }
  return new TextEncoder().encode(secret);
}

function isJwtPayload(payload: unknown): payload is JwtPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.userId !== "string" || !candidate.userId) {
    return false;
  }
  if (typeof candidate.nickname !== "string" || !candidate.nickname) {
    return false;
  }
  if (candidate.email !== undefined && typeof candidate.email !== "string") {
    return false;
  }
  if (
    candidate.provider !== undefined &&
    (typeof candidate.provider !== "string" ||
      !VALID_PROVIDERS.has(candidate.provider))
  ) {
    return false;
  }

  return true;
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<JwtPayload | null> {
  const secret = getSecret();

  try {
    const { payload } = await jwtVerify(token, secret);
    if (!isJwtPayload(payload)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
