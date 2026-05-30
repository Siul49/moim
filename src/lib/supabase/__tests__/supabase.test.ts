import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient as createBrowserClient } from "../client";
import { createClient as createServerClient } from "../server";

// Next.js cookies API 모킹
vi.mock("next/headers", () => ({
  cookies: () => ({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));

describe("Supabase 클라이언트 인스턴스 생성 검증", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example-project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("createBrowserClient가 정상적으로 Supabase 브라우저 클라이언트를 반환하는지 테스트", () => {
    const client = createBrowserClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it("createServerClient가 정상적으로 Supabase 서버 클라이언트를 반환하는지 테스트", async () => {
    const client = await createServerClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it("Supabase URL 환경변수가 없으면 명확한 에러를 던진다", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    expect(() => createBrowserClient()).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("Supabase URL 환경변수가 공백이면 명확한 에러를 던진다", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "   ";

    expect(() => createBrowserClient()).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("Supabase anon key 환경변수가 없으면 명확한 에러를 던진다", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => createBrowserClient()).toThrow(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });

  it("Supabase anon key 환경변수가 공백이면 명확한 에러를 던진다", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "   ";

    expect(() => createBrowserClient()).toThrow(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });

  it("createServerClient도 Supabase URL 누락을 같은 계약으로 검증한다", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    await expect(createServerClient()).rejects.toThrow(
      "NEXT_PUBLIC_SUPABASE_URL",
    );
  });

  it("createServerClient도 Supabase anon key 누락을 같은 계약으로 검증한다", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    await expect(createServerClient()).rejects.toThrow(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });

  it("createServerClient도 Supabase anon key 공백을 같은 계약으로 검증한다", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "   ";

    await expect(createServerClient()).rejects.toThrow(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });
});
