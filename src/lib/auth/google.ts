import { fetchWithTimeout } from "./fetch-with-timeout";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

export interface GoogleUser {
  id: string;
  email?: string;
  name?: string;
  given_name?: string;
  picture?: string;
  verified_email?: boolean;
}

export function getGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_LOGIN_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_LOGIN_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error(
      "GOOGLE_LOGIN_CLIENT_ID 또는 GOOGLE_LOGIN_REDIRECT_URI 환경변수가 설정되지 않았습니다.",
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid email profile",
    state,
    access_type: "online",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function getGoogleToken(
  code: string,
): Promise<GoogleTokenResponse> {
  if (!code.trim()) {
    throw new Error("인가 코드가 비어 있습니다.");
  }

  const clientId = process.env.GOOGLE_LOGIN_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_LOGIN_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_LOGIN_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("구글 환경변수가 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`구글 토큰 발급 실패 (status: ${res.status})`);
  }

  const data = (await res.json()) as Partial<GoogleTokenResponse>;
  if (!data.access_token) {
    throw new Error("구글 토큰 응답 오류: access_token 누락");
  }

  return data as GoogleTokenResponse;
}

export async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
  if (!accessToken.trim()) {
    throw new Error("accessToken이 비어 있습니다.");
  }

  const res = await fetchWithTimeout(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`구글 사용자 정보 조회 실패 (status: ${res.status})`);
  }

  const data = (await res.json()) as GoogleUser;

  if (!data.id) {
    throw new Error("구글 사용자 정보 조회 오류: id 누락");
  }

  return data;
}

export function extractGoogleUserInfo(googleUser: GoogleUser): {
  googleId: string;
  email?: string;
  nickname: string;
} {
  const googleId = googleUser.id;
  const email = googleUser.email;
  const nickname =
    googleUser.name ?? googleUser.given_name ?? `google_${googleId}`;

  return { googleId, email, nickname };
}
