import { describe, test, expect, vi, beforeEach } from "vitest";

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

import {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserProfile,
  saveOAuthStateToCookie,
  validateAndClearOAuthState,
} from "../auth";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  mockCookieStore.get.mockReset();
  mockCookieStore.set.mockReset();
  mockCookieStore.delete.mockReset();
  process.env.NAVER_CLIENT_ID = "naver-client-id";
  process.env.NAVER_CLIENT_SECRET = "naver-client-secret";
  process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
  delete process.env.NAVER_REDIRECT_URI;
});

describe("buildAuthUrl", () => {
  test("Naver OAuth URL을 올바르게 생성한다", () => {
    const url = buildAuthUrl("state-123");

    expect(url).toContain("https://nid.naver.com/oauth2.0/authorize");
    expect(url).toContain("response_type=code");
    expect(url).toContain("client_id=naver-client-id");
    expect(url).toContain(
      "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fnaver%2Fcallback",
    );
    expect(url).toContain("state=state-123");
  });

  test("NAVER_REDIRECT_URI가 있으면 우선 사용한다", () => {
    process.env.NAVER_REDIRECT_URI = "https://example.com/naver/callback";

    const url = buildAuthUrl("state");

    expect(url).toContain(
      "redirect_uri=https%3A%2F%2Fexample.com%2Fnaver%2Fcallback",
    );
  });
});

describe("oauth state cookie", () => {
  test("state를 쿠키에 저장한다", async () => {
    await saveOAuthStateToCookie("abc");

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "naver_oauth_state",
      "abc",
      expect.objectContaining({ httpOnly: true, maxAge: 600 }),
    );
  });

  test("state가 일치하면 true를 반환하고 쿠키를 제거한다", async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: "abc" });

    await expect(validateAndClearOAuthState("abc")).resolves.toBe(true);
    expect(mockCookieStore.delete).toHaveBeenCalledWith("naver_oauth_state");
  });

  test("state가 다르면 false를 반환한다", async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: "abc" });

    await expect(validateAndClearOAuthState("wrong")).resolves.toBe(false);
  });
});

describe("exchangeCodeForTokens", () => {
  test("authorization code로 토큰을 교환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "access-123",
          refresh_token: "refresh-456",
          token_type: "bearer",
          expires_in: "3600",
        }),
    });

    const tokens = await exchangeCodeForTokens("code-789", "state-abc");

    expect(tokens.accessToken).toBe("access-123");
    expect(tokens.refreshToken).toBe("refresh-456");
    expect(tokens.tokenType).toBe("bearer");
    expect(tokens.expiresAt).toBeGreaterThan(Date.now());

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://nid.naver.com/oauth2.0/token");
    expect(options.method).toBe("POST");
    expect(options.body.toString()).toContain("grant_type=authorization_code");
    expect(options.body.toString()).toContain("code=code-789");
    expect(options.body.toString()).toContain("state=state-abc");
  });

  test("실패 시 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("invalid_request"),
    });

    await expect(exchangeCodeForTokens("bad", "state")).rejects.toThrow(
      "토큰 교환 실패",
    );
  });
});

describe("refreshAccessToken", () => {
  test("refresh token으로 새 access token을 발급받는다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "new-access-token",
          token_type: "bearer",
          expires_in: 3600,
        }),
    });

    const result = await refreshAccessToken("refresh-token");

    expect(result.accessToken).toBe("new-access-token");
    expect(result.tokenType).toBe("bearer");
    expect(result.expiresAt).toBeGreaterThan(Date.now());

    const body = mockFetch.mock.calls[0][1].body.toString();
    expect(body).toContain("grant_type=refresh_token");
    expect(body).toContain("refresh_token=refresh-token");
  });

  test("실패 시 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve("revoked"),
    });

    await expect(refreshAccessToken("bad")).rejects.toThrow("토큰 갱신 실패");
  });
});

describe("getUserProfile", () => {
  test("네이버 사용자 프로필을 조회한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          resultcode: "00",
          message: "success",
          response: {
            id: "naver-user-id",
            email: "user@naver.com",
            nickname: "moim",
          },
        }),
    });

    const profile = await getUserProfile("access-token");

    expect(profile).toMatchObject({
      id: "naver-user-id",
      email: "user@naver.com",
      nickname: "moim",
    });
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer access-token",
    );
  });

  test("사용자 ID가 없으면 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ response: {} }),
    });

    await expect(getUserProfile("token")).rejects.toThrow("사용자 ID");
  });
});

