import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL = `http://localhost:${e2ePort}`;

/**
 * Playwright E2E 설정
 *
 * E2E(End-to-End) 테스트는 실제 브라우저를 띄워서 사용자 시나리오를 검증한다.
 * Python의 Selenium + pytest 조합과 동일한 역할.
 *
 * 지금은 환경만 세팅하고, 실제 테스트는 UI 페이지가 만들어진 후 작성한다.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // CI에서는 .only() 사용 금지
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: "html",

  use: {
    baseURL,
    trace: "on-first-retry", // 실패 시 트레이스 기록 (디버깅용)
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
    },
  ],

  // Next.js 개발 서버를 자동으로 띄워서 테스트
  webServer: {
    command: `npm run dev -- --port ${e2ePort}`,
    url: baseURL,
    env: {
      PATH: process.env.PATH,
      Path: process.env.Path,
      SYSTEMROOT: process.env.SYSTEMROOT,
      SystemRoot: process.env.SystemRoot,
      ComSpec: process.env.ComSpec,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
      JWT_SECRET:
        process.env.JWT_SECRET ??
        "test_jwt_secret_that_is_long_enough_for_hs256_signing",
      NEXT_PUBLIC_BASE_URL: baseURL,
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ??
        "https://example-project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "test-anon-key",
    },
    reuseExistingServer: !process.env.CI,
  },
});
