const FETCH_TIMEOUT_MS = 5000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`요청 시간 초과: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

interface NaverTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: string;
  refresh_token: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface NaverUserProfile {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email?: string;
    nickname?: string;
    name?: string;
    profile_image?: string;
  };
}

export interface NaverUser {
  id: string;
  email?: string;
  nickname?: string;
  name?: string;
}

export function getNaverAuthUrl(state: string): string {
  const clientId = process.env.NAVER_CLIENT_ID;
  const redirectUri = process.env.NAVER_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error(
      "NAVER_CLIENT_ID 또는 NAVER_REDIRECT_URI 환경변수가 설정되지 않았습니다.",
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });
  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
}

export async function getNaverToken(
  code: string,
  state: string,
): Promise<NaverTokenResponse> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const redirectUri = process.env.NAVER_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("네이버 환경변수가 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
    state,
  });

  const res = await fetchWithTimeout("https://nid.naver.com/oauth2.0/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`네이버 토큰 발급 실패 (status: ${res.status})`);
  }

  const data = (await res.json()) as NaverTokenResponse;

  if (data.error) {
    throw new Error(
      `네이버 토큰 발급 오류: ${data.error} - ${data.error_description ?? ""}`,
    );
  }

  return data;
}

export async function getNaverUser(
  naverAccessToken: string,
): Promise<NaverUser> {
  const res = await fetchWithTimeout("https://openapi.naver.com/v1/nid/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${naverAccessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`네이버 사용자 정보 조회 실패 (status: ${res.status})`);
  }

  const data = (await res.json()) as NaverUserProfile;

  if (data.resultcode !== "00") {
    throw new Error(`네이버 사용자 정보 조회 오류: ${data.message}`);
  }

  if (!data.response?.id) {
    throw new Error("네이버 사용자 정보 조회 오류: id 누락");
  }

  return {
    id: data.response.id,
    email: data.response.email,
    nickname: data.response.nickname,
    name: data.response.name,
  };
}

export function extractNaverUserInfo(naverUser: NaverUser): {
  naverId: string;
  email?: string;
  nickname: string;
} {
  const naverId = naverUser.id;
  const email = naverUser.email;
  const nickname = naverUser.nickname ?? naverUser.name ?? `naver_${naverId}`;

  return { naverId, email, nickname };
}
