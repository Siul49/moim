import { describe, test, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { getNaverAuthUrl, getNaverToken } from "../naver";

beforeEach(() => {
  mockFetch.mockReset();
  process.env.NAVER_CLIENT_ID = "test-naver-client-id";
  process.env.NAVER_CLIENT_SECRET = "test-naver-client-secret";
  delete process.env.NAVER_REDIRECT_URI;
  delete process.env.NEXT_PUBLIC_BASE_URL;
});

describe("getNaverAuthUrl", () => {
  test("기본 설정 시 localhost:4000 포트 콜백으로 생성한다", () => {
    const url = getNaverAuthUrl("state-123");

    expect(url).toContain("https://nid.naver.com/oauth2.0/authorize");
    expect(url).toContain("client_id=test-naver-client-id");
    expect(url).toContain(
      "redirect_uri=http%3A%2F%2Flocalhost%3A4000%2Fapi%2Fauth%2Fnaver%2Fcallback",
    );
    expect(url).toContain("state=state-123");
  });

  test("NEXT_PUBLIC_BASE_URL 환경변수가 설정되면 이를 기준으로 콜백을 생성한다", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://moim-app-eosin.vercel.app";
    const url = getNaverAuthUrl("state-123");

    expect(url).toContain(
      "redirect_uri=https%3A%2F%2Fmoim-app-eosin.vercel.app%2Fapi%2Fauth%2Fnaver%2Fcallback",
    );
  });

  test("동적 origin 매개변수가 제공되면 이를 기준으로 콜백을 생성한다", () => {
    const url = getNaverAuthUrl("state-123", "https://dynamic-origin.com");

    expect(url).toContain(
      "redirect_uri=https%3A%2F%2Fdynamic-origin.com%2Fapi%2Fauth%2Fnaver%2Fcallback",
    );
  });

  test("NAVER_REDIRECT_URI 환경변수가 명시되면 이를 최우선으로 적용한다", () => {
    process.env.NAVER_REDIRECT_URI =
      "https://custom-callback-url.com/naver/callback";
    const url = getNaverAuthUrl("state-123", "https://dynamic-origin.com");

    expect(url).toContain(
      "redirect_uri=https%3A%2F%2Fcustom-callback-url.com%2Fnaver%2Fcallback",
    );
  });
});

describe("getNaverToken", () => {
  test("토큰 교환 요청 시 올바른 redirect_uri를 포함하여 요청한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "access-token-123",
          token_type: "bearer",
          expires_in: "3600",
          refresh_token: "refresh-token-456",
        }),
    });

    const tokenData = await getNaverToken(
      "auth-code-111",
      "state-222",
      "https://dynamic-origin.com",
    );

    expect(tokenData.access_token).toBe("access-token-123");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://nid.naver.com/oauth2.0/token");
    expect(options.method).toBe("POST");
    expect(options.body).toContain(
      "redirect_uri=https%3A%2F%2Fdynamic-origin.com%2Fapi%2Fauth%2Fnaver%2Fcallback",
    );
  });
});
