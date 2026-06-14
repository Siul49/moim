/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createApiHandler } from "../api-handler";
import { NextRequest } from "next/server";

// Next.js의 redirect, notFound 에러 유틸 모킹
vi.mock("next/navigation", () => {
  return {
    isRedirectError: (err: any) =>
      err &&
      err.digest &&
      typeof err.digest === "string" &&
      err.digest.startsWith("NEXT_REDIRECT"),
    isNotFoundError: (err: any) => err && err.digest === "NEXT_NOT_FOUND",
  };
});

describe("apiErrorHandler inside createApiHandler", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    if (originalEnv) vi.stubEnv("NODE_ENV", originalEnv);
    // 환경변수 기본값 설정
    process.env.DATABASE_URL = "mock-db-url";
    process.env.JWT_SECRET = "mock-jwt-secret";
    process.env.GOOGLE_CALENDAR_CLIENT_ID = "mock-google-client-id";
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET = "mock-google-client-secret";
    process.env.NAVER_CLIENT_ID = "mock-naver-client-id";
    process.env.NAVER_CLIENT_SECRET = "mock-naver-client-secret";
    process.env.GEMINI_API_KEY = "mock-gemini-key";
  });

  afterEach(() => {
    if (originalEnv) vi.stubEnv("NODE_ENV", originalEnv);
    else vi.unstubAllEnvs();
  });

  test("isRedirectError 에러가 발생하면 삼키지 않고 그대로 throw한다", async () => {
    const handler = createApiHandler({}, async () => {
      const redirectErr = new Error("Redirecting...");
      (redirectErr as any).digest = "NEXT_REDIRECT;307;/login;default";
      throw redirectErr;
    });

    const req = new NextRequest("http://localhost/api/test");
    await expect(handler(req)).rejects.toThrow("Redirecting...");
  });

  test("isNotFoundError 에러가 발생하면 삼키지 않고 그대로 throw한다", async () => {
    const handler = createApiHandler({}, async () => {
      const notFoundErr = new Error("Not Found");
      (notFoundErr as any).digest = "NEXT_NOT_FOUND";
      throw notFoundErr;
    });

    const req = new NextRequest("http://localhost/api/test");
    await expect(handler(req)).rejects.toThrow("Not Found");
  });

  test("개발 환경(development)에서 환경변수 누락 오류 발생 시 devHint와 envStatus를 응답에 포함한다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    // 필수 환경변수 중 하나 누락
    delete process.env.NAVER_CLIENT_ID;

    const handler = createApiHandler({}, async () => {
      throw new Error("NAVER_CLIENT_ID가 누락되었습니다.");
    });

    const req = new NextRequest("http://localhost/api/test");
    const res = await handler(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.isEnvError).toBe(true);
    expect(body.devHint).toContain(
      "누락된 필수 환경변수가 감지되었습니다: NAVER_CLIENT_ID",
    );
    expect(body.envStatus).toBeDefined();
    expect(body.envStatus.NAVER_CLIENT_ID).toBe(false);
    expect(body.envStatus.DATABASE_URL).toBe(true);
  });

  test("개발 환경(development)에서 일반 에러 발생 시 에러명과 디버깅 힌트를 포함한다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const handler = createApiHandler({}, async () => {
      throw new TypeError("일반적인 타입 에러");
    });

    const req = new NextRequest("http://localhost/api/test");
    const res = await handler(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.errorType).toBe("TypeError");
    expect(body.isEnvError).toBe(false);
    expect(body.devHint).toBe(
      "발생한 오류의 예외 클래스 타입과 스택 트레이스를 확인하여 디버깅하십시오.",
    );
  });

  test("프로덕션 환경(production)에서는 환경변수 유무나 디버깅 힌트 정보를 숨긴다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NAVER_CLIENT_ID;

    const handler = createApiHandler({}, async () => {
      throw new Error("NAVER_CLIENT_ID 누락 에러");
    });

    const req = new NextRequest("http://localhost/api/test");
    const res = await handler(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.message).toBe("서버 내부 오류가 발생했습니다.");
    expect(body.isEnvError).toBeUndefined();
    expect(body.devHint).toBeUndefined();
    expect(body.envStatus).toBeUndefined();
    expect(body.errorType).toBeUndefined();
  });
});
