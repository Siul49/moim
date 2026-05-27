interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface KakaoUser {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
    };
  };
  properties?: {
    nickname?: string;
  };
}

export function getKakaoAuthUrl(state: string): string {
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;
  if (!restApiKey || !redirectUri) {
    throw new Error(
      "KAKAO_REST_API_KEY 또는 KAKAO_REDIRECT_URI 환경변수가 설정되지 않았습니다.",
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: restApiKey,
    redirect_uri: redirectUri,
    state,
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

export async function getKakaoToken(code: string): Promise<KakaoTokenResponse> {
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;
  if (!restApiKey || !redirectUri) {
    throw new Error("카카오 환경변수가 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: restApiKey,
    redirect_uri: redirectUri,
    code,
  });

  if (process.env.KAKAO_CLIENT_SECRET) {
    params.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
  }

  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`카카오 토큰 발급 실패 (status: ${res.status})`);
  }

  return res.json() as Promise<KakaoTokenResponse>;
}

export async function getKakaoUser(
  kakaoAccessToken: string,
): Promise<KakaoUser> {
  const res = await fetch("https://kapi.kakao.com/v2/user/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${kakaoAccessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  if (!res.ok) {
    throw new Error(`카카오 사용자 정보 조회 실패 (status: ${res.status})`);
  }

  return res.json() as Promise<KakaoUser>;
}

export function extractKakaoUserInfo(kakaoUser: KakaoUser): {
  kakaoId: string;
  email?: string;
  nickname: string;
} {
  const kakaoId = String(kakaoUser.id);
  const email = kakaoUser.kakao_account?.email;
  const nickname =
    kakaoUser.kakao_account?.profile?.nickname ??
    kakaoUser.properties?.nickname ??
    `kakao_${kakaoId}`;

  return { kakaoId, email, nickname };
}
