import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v3 + shadcn/ui 설정
 *
 * shadcn/ui는 CSS 변수를 통해 테마 색상을 관리한다.
 * globals.css에서 --background, --foreground 등을 HSL 값으로 정의하고,
 * 여기서 hsl(var(--변수명)) 형태로 참조한다.
 *
 * 왜 이렇게 하나?
 * - Tailwind의 opacity modifier(bg-primary/50)가 동작하려면
 *   색상을 hsl() 함수로 감싸야 함
 * - oklch는 Tailwind v3의 opacity modifier와 호환 안 됨
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          purple: {
            DEFAULT: "hsl(var(--brand-purple))",
            dark: "hsl(var(--brand-purple-dark))",
            light: "hsl(var(--brand-purple-light))",
            bg: "hsl(var(--brand-purple-bg))",
            hover: "hsl(var(--brand-purple-hover))",
            accent: "hsl(var(--brand-purple-accent))",
            ring: "hsl(var(--brand-purple-ring))",
          },
          border: {
            muted: "hsl(var(--brand-border-muted))",
            gray: "hsl(var(--brand-border-gray))",
          },
          bg: {
            light: "hsl(var(--brand-bg-light))",
            muted: "hsl(var(--brand-bg-muted))",
          },
          text: {
            primary: "hsl(var(--brand-text-primary))",
            secondary: "hsl(var(--brand-text-secondary))",
            muted: "hsl(var(--brand-text-muted))",
            light: "hsl(var(--brand-text-light))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "var(--font-pretendard)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        bounceOnce: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-out forwards",
        scaleIn: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        bounceOnce: "bounceOnce 0.4s ease-out 1",
      },
    },
  },
  plugins: [],
};
export default config;
