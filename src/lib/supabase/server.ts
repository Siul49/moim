/**
 * Supabase 서버 클라이언트.
 *
 * Server Components와 API Routes에서 쿠키 기반 사용자 세션을 유지하며 Supabase에
 * 접근할 때 사용한다.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseConfig();

  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });

  if (
    process.env.E2E_TEST === "true" ||
    process.env.NODE_ENV === "development"
  ) {
    const mockUid = cookieStore.get("e2e_mock_uid")?.value;
    const mockEmail = cookieStore.get("e2e_mock_email")?.value;
    const mockNickname =
      cookieStore.get("e2e_mock_nickname")?.value || "e2e_user";

    if (process.env.E2E_TEST === "true" || (mockUid && mockEmail)) {
      const authMock = {
        getUser: async () => {
          if (!mockEmail || !mockUid) {
            return {
              data: { user: null },
              error: new Error("No E2E mock session"),
            };
          }
          return {
            data: {
              user: {
                id: mockUid,
                email: mockEmail,
                user_metadata: { nickname: mockNickname },
              },
            },
            error: null,
          };
        },
        signUp: async ({
          email,
          options,
        }: {
          email: string;
          options?: { data?: Record<string, unknown> };
        }) => {
          const uid = `e2e_uid_${Date.now()}`;
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
        signInWithPassword: async ({ email }: { email: string }) => {
          return {
            data: {
              user: {
                id: mockUid,
                email,
                user_metadata: { nickname: mockNickname },
              },
              session: { access_token: "mock_jwt_token" },
            },
            error: null,
          };
        },
        signOut: async () => {
          return { error: null };
        },
      };

      return new Proxy(client, {
        get(target, prop, receiver) {
          if (prop === "auth") {
            return authMock;
          }
          return Reflect.get(target, prop, receiver);
        },
      });
    }
  }

  return client;
}
