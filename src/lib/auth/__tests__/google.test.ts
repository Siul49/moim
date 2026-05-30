// @vitest-environment node
import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  getGoogleAuthUrl,
  getGoogleToken,
  getGoogleUser,
  extractGoogleUserInfo,
  type GoogleUser,
} from "../google";

// ──────────────────────────────────────────────
// getGoogleAuthUrl
// ──────────────────────────────────────────────
describe("getGoogleAuthUrl", () => {
  beforeEach(() => {
    process.env.GOOGLE_LOGIN_CLIENT_ID = "test_client_id";
    process.env.GOOGLE_LOGIN_REDIRECT_URI =
      "http://localhost:3000/api/auth/google/callback";
  });

  test("올바른 구글 인가 URL을 반환한다", () => {
    const state = "random_state_value";
    const url = getGoogleAuthUrl(state);

    expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url).toContain("response_type=code");
    expect(url).toContain("client_id=test_client_id");
    expect(url).toContain(
      encodeURIComponent("http://localhost:3000/api/auth/google/callback"),
    );
    expect(url).toContain(`state=${state}`);
    expect(url).toContain("scope=");
  });

  test("GOOGLE_LOGIN_CLIENT_ID가 없으면 에러를 던진다", () => {
    delete process.env.GOOGLE_LOGIN_CLIENT_ID;
    expect(() => getGoogleAuthUrl("state")).toThrow(
      "GOOGLE_LOGIN_CLIENT_ID 또는 GOOGLE_LOGIN_REDIRECT_URI 환경변수가 설정되지 않았습니다.",
    );
  });

  test("GOOGLE_LOGIN_REDIRECT_URI가 없으면 에러를 던진다", () => {
    delete process.env.GOOGLE_LOGIN_REDIRECT_URI;
    expect(() => getGoogleAuthUrl("state")).toThrow(
      "GOOGLE_LOGIN_CLIENT_ID 또는 GOOGLE_LOGIN_REDIRECT_URI 환경변수가 설정되지 않았습니다.",
    );
  });

  test("state 값이 URL에 그대로 포함된다", () => {
    const state = "csrf_token_abc123";
    const url = getGoogleAuthUrl(state);
    expect(url).toContain(`state=${state}`);
  });
});

// ──────────────────────────────────────────────
// getGoogleToken
// ──────────────────────────────────────────────
describe("getGoogleToken", () => {
  beforeEach(() => {
    process.env.GOOGLE_LOGIN_CLIENT_ID = "test_client_id";
    process.env.GOOGLE_LOGIN_CLIENT_SECRET = "test_client_secret";
    process.env.GOOGLE_LOGIN_REDIRECT_URI =
      "http://localhost:3000/api/auth/google/callback";
    vi.restoreAllMocks();
  });

  test("토큰 발급에 성공하면 access_token을 반환한다", async () => {
    const mockResponse = {
      access_token: "google_access_token_mock",
      expires_in: 3599,
      token_type: "Bearer",
      scope: "openid email profile",
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await getGoogleToken("auth_code");
    expect(result.access_token).toBe("google_access_token_mock");
  });

  test("fetch가 ok:false이면 에러를 던진다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as Response);

    await expect(getGoogleToken("bad_code")).rejects.toThrow(
      "구글 토큰 발급 실패",
    );
  });

  test("환경변수가 없으면 에러를 던진다", async () => {
    delete process.env.GOOGLE_LOGIN_CLIENT_ID;
    await expect(getGoogleToken("code")).rejects.toThrow(
      "구글 환경변수가 설정되지 않았습니다.",
    );
  });
});

// ──────────────────────────────────────────────
// getGoogleUser
// ──────────────────────────────────────────────
describe("getGoogleUser", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("사용자 정보를 정상 반환한다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "google_user_id_123",
          email: "user@gmail.com",
          name: "홍길동",
          verified_email: true,
        }),
    } as Response);

    const user = await getGoogleUser("access_token");
    expect(user.id).toBe("google_user_id_123");
    expect(user.email).toBe("user@gmail.com");
    expect(user.name).toBe("홍길동");
  });

  test("fetch가 ok:false이면 에러를 던진다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    await expect(getGoogleUser("invalid_token")).rejects.toThrow(
      "구글 사용자 정보 조회 실패",
    );
  });

  test("응답에 id가 없으면 에러를 던진다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          email: "user@gmail.com",
          name: "홍길동",
          // id 누락
        }),
    } as Response);

    await expect(getGoogleUser("access_token")).rejects.toThrow(
      "구글 사용자 정보 조회 오류: id 누락",
    );
  });
});

// ──────────────────────────────────────────────
// extractGoogleUserInfo
// ──────────────────────────────────────────────
describe("extractGoogleUserInfo", () => {
  test("name이 있으면 그대로 사용한다", () => {
    const user: GoogleUser = {
      id: "123",
      email: "test@gmail.com",
      name: "홍길동",
    };
    const { googleId, email, nickname } = extractGoogleUserInfo(user);
    expect(googleId).toBe("123");
    expect(email).toBe("test@gmail.com");
    expect(nickname).toBe("홍길동");
  });

  test("name이 없으면 given_name을 사용한다", () => {
    const user: GoogleUser = { id: "456", given_name: "길동" };
    const { nickname } = extractGoogleUserInfo(user);
    expect(nickname).toBe("길동");
  });

  test("name과 given_name 모두 없으면 google_{id}를 사용한다", () => {
    const user: GoogleUser = { id: "789" };
    const { nickname } = extractGoogleUserInfo(user);
    expect(nickname).toBe("google_789");
  });

  test("email이 없으면 undefined를 반환한다", () => {
    const user: GoogleUser = { id: "abc", name: "이름" };
    const { email } = extractGoogleUserInfo(user);
    expect(email).toBeUndefined();
  });
});
