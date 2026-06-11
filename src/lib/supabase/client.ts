/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Supabase 브라우저 클라이언트.
 *
 * React 클라이언트 컴포넌트에서 현재 사용자 세션과 Supabase API에 접근할 때 사용한다.
 */

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./env";

export function createClient() {
  const { url, anonKey } = getSupabaseConfig();

  // E2E 테스트 혹은 더미 Supabase 환경인 경우 클라이언트 측 API 호출을 전부 모킹하여
  // example-project.supabase.co 주소로 실요청이 날아가서 uncaught exception으로 크래시가 나는 것을 방지한다.
  const isMockEnv =
    url === "https://example-project.supabase.co" || url.includes("example");

  if (typeof window !== "undefined" && isMockEnv) {
    const cookies = document.cookie.split("; ");
    const mockUid = cookies
      .find((row) => row.startsWith("e2e_mock_uid="))
      ?.split("=")[1];
    const mockEmail = cookies
      .find((row) => row.startsWith("e2e_mock_email="))
      ?.split("=")[1];
    const mockNickname = cookies
      .find((row) => row.startsWith("e2e_mock_nickname="))
      ?.split("=")[1];

    const authMock = {
      getUser: async () => {
        if (!mockUid || !mockEmail) {
          return { data: { user: null }, error: null };
        }
        return {
          data: {
            user: {
              id: mockUid,
              email: mockEmail,
              user_metadata: { nickname: mockNickname || "e2e_user" },
            },
          },
          error: null,
        };
      },
      signUp: async ({ email, options }: any) => {
        const uid = mockUid || `e2e_uid_${Date.now()}`;
        return {
          data: {
            user: {
              id: uid,
              email,
              user_metadata: options?.data || {},
            },
          },
          error: null,
        };
      },
      signInWithPassword: async ({ email }: any) => {
        const uid = mockUid || `e2e_uid_${Date.now()}`;
        return {
          data: {
            user: {
              id: uid,
              email,
              user_metadata: { nickname: mockNickname || "e2e_user" },
            },
            session: { access_token: "mock_jwt_token" },
          },
          error: null,
        };
      },
      signOut: async () => {
        return { error: null };
      },
      getSession: async () => {
        if (!mockUid || !mockEmail) {
          return { data: { session: null }, error: null };
        }
        return {
          data: {
            session: { access_token: "mock_jwt_token" },
          },
          error: null,
        };
      },
    };

    const fromMock = (table: string) => {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (table === "profiles" && mockUid) {
                return {
                  data: {
                    nickname: mockNickname || "e2e_user",
                  },
                  error: null,
                };
              }
              return { data: null, error: null };
            },
            single: async () => {
              if (table === "profiles" && mockUid) {
                return {
                  data: {
                    nickname: mockNickname || "e2e_user",
                  },
                  error: null,
                };
              }
              return { data: null, error: null };
            },
          }),
        }),
      };
    };

    return {
      auth: authMock,
      from: fromMock,
    } as any;
  }

  return createBrowserClient(url, anonKey);
}
