// @vitest-environment node
import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  getNaverAuthUrl,
  getNaverToken,
  getNaverUser,
  extractNaverUserInfo,
  type NaverUser,
} from "../naver";

// ──────────────────────────────────────────────
// getNaverAuthUrl
// ──────────────────────────────────────────────
describe("getNaverAuthUrl", () => {
  beforeEach(() => {
    process.env.NAVER_CLIENT_ID = "test_client_id";
    process.env.NAVER_REDIRECT_URI =
      "http://localhost:3000/api/auth/naver/callback";
  });

  test("올바른 네이버 인가 URL을 반환한다", () => {
    const state = "random_state_value";
    const url = getNaverAuthUrl(state);

    expect(url).toContain("https://nid.naver.com/oauth2.0/authorize");
    expect(url).toContain("response_type=code");
    expect(url).toContain("client_id=test_client_id");
    expect(url).toContain(
      encodeURIComponent("http://localhost:3000/api/auth/naver/callback"),
    );
    expect(url).toContain(`state=${state}`);
  });

  test("NAVER_CLIENT_ID가 없으면 에러를 던진다", () => {
    delete process.env.NAVER_CLIENT_ID;
    expect(() => getNaverAuthUrl("state")).toThrow(
      "NAVER_CLIENT_ID 또는 NAVER_REDIRECT_URI 환경변수가 설정되지 않았습니다.",
    );
  });

  test("NAVER_REDIRECT_URI가 없으면 에러를 던진다", () => {
    delete process.env.NAVER_REDIRECT_URI;
    expect(() => getNaverAuthUrl("state")).toThrow(
      "NAVER_CLIENT_ID 또는 NAVER_REDIRECT_URI 환경변수가 설정되지 않았습니다.",
    );
  });

  test("state 값이 URL에 그대로 포함된다", () => {
    const state = "csrf_token_abc123";
    const url = getNaverAuthUrl(state);
    expect(url).toContain(`state=${state}`);
  });
});

// ──────────────────────────────────────────────
// getNaverToken
// ──────────────────────────────────────────────
describe("getNaverToken", () => {
  beforeEach(() => {
    process.env.NAVER_CLIENT_ID = "test_client_id";
    process.env.NAVER_CLIENT_SECRET = "test_client_secret";
    process.env.NAVER_REDIRECT_URI =
      "http://localhost:3000/api/auth/naver/callback";
    vi.restoreAllMocks();
  });

  test("토큰 발급에 성공하면 access_token을 반환한다", async () => {
    const mockResponse = {
      access_token: "naver_access_token_mock",
      token_type: "bearer",
      expires_in: "3600",
      refresh_token: "naver_refresh_token_mock",
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await getNaverToken("auth_code", "state_value");
    expect(result.access_token).toBe("naver_access_token_mock");
  });

  test("fetch가 ok:false이면 에러를 던진다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    await expect(getNaverToken("bad_code", "state")).rejects.toThrow(
      "네이버 토큰 발급 실패",
    );
  });

  test("응답에 error 필드가 있으면 에러를 던진다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          error: "invalid_request",
          error_description: "인가 코드가 유효하지 않습니다.",
        }),
    } as Response);

    await expect(getNaverToken("invalid_code", "state")).rejects.toThrow(
      "네이버 토큰 발급 오류",
    );
  });

  test("환경변수가 없으면 에러를 던진다", async () => {
    delete process.env.NAVER_CLIENT_ID;
    await expect(getNaverToken("code", "state")).rejects.toThrow(
      "네이버 환경변수가 설정되지 않았습니다.",
    );
  });
});

// ──────────────────────────────────────────────
// getNaverUser
// ──────────────────────────────────────────────
describe("getNaverUser", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("사용자 정보를 정상 반환한다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          resultcode: "00",
          message: "success",
          response: {
            id: "naver_user_id_123",
            email: "user@naver.com",
            nickname: "네이버유저",
            name: "홍길동",
          },
        }),
    } as Response);

    const user = await getNaverUser("access_token");
    expect(user.id).toBe("naver_user_id_123");
    expect(user.email).toBe("user@naver.com");
    expect(user.nickname).toBe("네이버유저");
  });

  test("fetch가 ok:false이면 에러를 던진다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    await expect(getNaverUser("invalid_token")).rejects.toThrow(
      "네이버 사용자 정보 조회 실패",
    );
  });

  test("resultcode가 '00'이 아니면 에러를 던진다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          resultcode: "024",
          message: "Authentication failed",
          response: {},
        }),
    } as Response);

    await expect(getNaverUser("access_token")).rejects.toThrow(
      "네이버 사용자 정보 조회 오류",
    );
  });

  test("resultcode가 '00'이지만 response.id가 없으면 에러를 던진다", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          resultcode: "00",
          message: "success",
          response: { email: "user@naver.com", nickname: "닉네임" }, // id 누락
        }),
    } as Response);

    await expect(getNaverUser("access_token")).rejects.toThrow(
      "네이버 사용자 정보 조회 오류: id 누락",
    );
  });
});

// ──────────────────────────────────────────────
// extractNaverUserInfo
// ──────────────────────────────────────────────
describe("extractNaverUserInfo", () => {
  test("nickname이 있으면 그대로 사용한다", () => {
    const user: NaverUser = {
      id: "123",
      email: "test@naver.com",
      nickname: "내닉네임",
    };
    const { naverId, email, nickname } = extractNaverUserInfo(user);
    expect(naverId).toBe("123");
    expect(email).toBe("test@naver.com");
    expect(nickname).toBe("내닉네임");
  });

  test("nickname이 없으면 name을 사용한다", () => {
    const user: NaverUser = { id: "456", name: "홍길동" };
    const { nickname } = extractNaverUserInfo(user);
    expect(nickname).toBe("홍길동");
  });

  test("nickname과 name 모두 없으면 naver_{id}를 사용한다", () => {
    const user: NaverUser = { id: "789" };
    const { nickname } = extractNaverUserInfo(user);
    expect(nickname).toBe("naver_789");
  });

  test("email이 없으면 undefined를 반환한다", () => {
    const user: NaverUser = { id: "abc", nickname: "닉네임" };
    const { email } = extractNaverUserInfo(user);
    expect(email).toBeUndefined();
  });
});
