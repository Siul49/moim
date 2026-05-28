// @vitest-environment node
import { describe, test, expect, beforeEach } from "vitest";
import {
  signAccessToken,
  verifyAccessToken,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "../jwt";

const TEST_SECRET = "test_jwt_secret_that_is_long_enough_for_hs256_signing";

beforeEach(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

describe("signAccessToken / verifyAccessToken 라운드트립", () => {
  test("서명 후 검증하면 원본 페이로드를 반환한다", async () => {
    const payload = {
      userId: "user_01",
      nickname: "테스터",
      provider: "naver" as const,
    };
    const token = await signAccessToken(payload);
    const result = await verifyAccessToken(token);

    expect(result?.userId).toBe("user_01");
    expect(result?.nickname).toBe("테스터");
    expect(result?.provider).toBe("naver");
  });

  test("email이 있는 페이로드도 정상 처리한다", async () => {
    const payload = {
      userId: "user_02",
      email: "test@naver.com",
      nickname: "이메일유저",
      provider: "naver" as const,
    };
    const token = await signAccessToken(payload);
    const result = await verifyAccessToken(token);

    expect(result?.email).toBe("test@naver.com");
  });

  test("provider가 local인 경우도 정상 처리한다", async () => {
    const payload = {
      userId: "user_03",
      nickname: "로컬유저",
      provider: "local" as const,
    };
    const token = await signAccessToken(payload);
    const result = await verifyAccessToken(token);

    expect(result?.provider).toBe("local");
  });

  test("잘못된 토큰은 null을 반환한다", async () => {
    const result = await verifyAccessToken("invalid.token.value");
    expect(result).toBeNull();
  });

  test("다른 시크릿으로 검증하면 null을 반환한다", async () => {
    const token = await signAccessToken({ userId: "u", nickname: "n" });
    process.env.JWT_SECRET = "completely_different_secret_value_for_testing";
    const result = await verifyAccessToken(token);
    expect(result).toBeNull();
  });

  test("빈 토큰 문자열은 null을 반환한다", async () => {
    const result = await verifyAccessToken("");
    expect(result).toBeNull();
  });
});

describe("JWT_SECRET 검증", () => {
  test("JWT_SECRET이 없으면 signAccessToken이 에러를 던진다", async () => {
    delete process.env.JWT_SECRET;
    await expect(
      signAccessToken({ userId: "u", nickname: "n" }),
    ).rejects.toThrow("JWT_SECRET 환경변수가 설정되지 않았습니다.");
  });
});

describe("상수 값 검증", () => {
  test("COOKIE_NAME은 accessToken이다", () => {
    expect(COOKIE_NAME).toBe("accessToken");
  });

  test("COOKIE_MAX_AGE는 7일(초)이다", () => {
    expect(COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 7);
  });
});
