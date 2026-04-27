import { describe, test, expect, vi, beforeEach } from "vitest";

// next/headers의 cookies를 모킹
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
} from "../auth";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  mockCookieStore.get.mockReset();
  mockCookieStore.set.mockReset();
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
  process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
});

describe("buildAuthUrl", () => {
  test("Google OAuth URL을 올바르게 생성한다", () => {
    const url = buildAuthUrl();

    expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url).toContain("client_id=test-client-id");
    expect(url).toContain(
      "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fgoogle%2Fcallback",
    );
    expect(url).toContain("response_type=code");
    expect(url).toContain("access_type=offline");
    expect(url).toContain("prompt=consent");
  });

  test("calendar 스코프가 포함된다", () => {
    const url = buildAuthUrl();

    expect(url).toContain("calendar");
    expect(url).toContain("userinfo.email");
  });

  test("state 파라미터를 전달할 수 있다", () => {
    const url = buildAuthUrl("my-state-value");

    expect(url).toContain("state=my-state-value");
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
          expires_in: 3600,
        }),
    });

    const tokens = await exchangeCodeForTokens("auth-code-789");

    expect(tokens.accessToken).toBe("access-123");
    expect(tokens.refreshToken).toBe("refresh-456");
    expect(tokens.expiresAt).toBeGreaterThan(Date.now());

    // POST 요청 검증
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    expect(options.method).toBe("POST");
    expect(options.body.toString()).toContain("code=auth-code-789");
    expect(options.body.toString()).toContain("grant_type=authorization_code");
  });

  test("실패 시 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve("invalid_grant"),
    });

    await expect(exchangeCodeForTokens("bad-code")).rejects.toThrow(
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
          expires_in: 3600,
        }),
    });

    const result = await refreshAccessToken("my-refresh-token");

    expect(result.accessToken).toBe("new-access-token");
    expect(result.expiresAt).toBeGreaterThan(Date.now());

    const body = mockFetch.mock.calls[0][1].body.toString();
    expect(body).toContain("refresh_token=my-refresh-token");
    expect(body).toContain("grant_type=refresh_token");
  });

  test("실패 시 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve("token_revoked"),
    });

    await expect(refreshAccessToken("revoked-token")).rejects.toThrow(
      "토큰 갱신 실패",
    );
  });
});
