import { beforeEach, describe, expect, test } from "vitest";
import {
  buildAppleNickname,
  extractAppleIdentity,
  getAppleAuthUrl,
  getAppleRedirectUri,
  normalizeApplePrivateKey,
  parseAppleUserPayload,
} from "../apple";

beforeEach(() => {
  process.env.APPLE_CLIENT_ID = "com.example.moim.web";
  delete process.env.APPLE_REDIRECT_URI;
  delete process.env.NEXT_PUBLIC_BASE_URL;
});

describe("getAppleAuthUrl", () => {
  test("Sign in with Apple 승인 URL을 만든다", () => {
    const url = new URL(getAppleAuthUrl("state-123", "http://localhost:3100"));

    expect(`${url.origin}${url.pathname}`).toBe(
      "https://appleid.apple.com/auth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("com.example.moim.web");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3100/api/auth/apple/callback",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("response_mode")).toBe("form_post");
    expect(url.searchParams.get("scope")).toBe("name email");
    expect(url.searchParams.get("state")).toBe("state-123");
  });

  test("명시된 Apple redirect URI가 있으면 그 값을 우선한다", () => {
    process.env.APPLE_REDIRECT_URI =
      "https://moim.example.com/api/auth/apple/callback";

    expect(getAppleRedirectUri("http://localhost:3100")).toBe(
      "https://moim.example.com/api/auth/apple/callback",
    );
  });
});

describe("Apple payload helpers", () => {
  test("환경변수에 들어간 escaped newline private key를 PEM 형태로 복원한다", () => {
    expect(normalizeApplePrivateKey("line1\\nline2")).toBe("line1\nline2");
  });

  test("Apple 최초 로그인 user payload를 읽는다", () => {
    const payload = parseAppleUserPayload(
      JSON.stringify({
        email: "user@example.com",
        name: { firstName: "철수", lastName: "김" },
      }),
    );

    expect(payload?.email).toBe("user@example.com");
    expect(payload?.name?.firstName).toBe("철수");
  });

  test("Apple id_token과 user payload에서 계정 식별자를 추출한다", () => {
    const idToken = createUnsignedJwt({
      sub: "apple-user-1",
      email: "token@example.com",
      email_verified: "true",
    });

    const identity = extractAppleIdentity(
      idToken,
      JSON.stringify({ name: { firstName: "철수", lastName: "김" } }),
    );

    expect(identity).toEqual({
      subject: "apple-user-1",
      email: "token@example.com",
      emailVerified: true,
      firstName: "철수",
      lastName: "김",
    });
  });

  test("이름, 이메일, subject 순으로 닉네임 후보를 만든다", () => {
    expect(
      buildAppleNickname({
        subject: "subject-1",
        emailVerified: true,
        firstName: "철수",
        lastName: "김",
      }),
    ).toBe("김철수");

    expect(
      buildAppleNickname({
        subject: "subject-1",
        email: "icloud.user@example.com",
        emailVerified: true,
      }),
    ).toBe("iclouduser");

    expect(
      buildAppleNickname({
        subject: "abcdef1234567890",
        emailVerified: false,
      }),
    ).toBe("apple_abcdef12");
  });
});

function createUnsignedJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.`;
}
