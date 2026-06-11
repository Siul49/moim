import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom: 실제 브라우저 없이 DOM을 시뮬레이션하는 환경
    // pytest에서 mock 객체를 쓰듯이, jsdom이 가상 브라우저 역할을 한다
    environment: "jsdom",

    // globals: true로 하면 describe, test, expect를 import 없이 사용 가능
    // pytest처럼 함수명만으로 바로 사용하는 것과 같은 편의성
    globals: true,

    // 모든 테스트 파일 실행 전에 먼저 로드되는 설정 파일
    setupFiles: "./src/test-setup.ts",

    // src 폴더 내의 .test.ts, .test.tsx 파일만 테스트 대상으로 인식
    include: ["src/**/*.test.{ts,tsx}"],

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      // tsconfig.json의 paths와 동기화 — @/로 시작하는 경로를 src/로 매핑
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
