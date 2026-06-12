/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
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
  const { url, anonKey } = getSupabaseConfig({ isServer: true });

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
        verifyOtp: async ({
          token_hash,
          type,
        }: {
          token_hash: string;
          type: string;
        }) => {
          return {
            data: {
              user: {
                id: mockUid || `e2e_naver_uid_${Date.now()}`,
                email: mockEmail || "naver_user@example.com",
                user_metadata: { nickname: mockNickname },
              },
              session: { access_token: "mock_jwt_token" },
            },
            error: null,
          };
        },
        updateUser: async ({ data }: { data: any }) => {
          return {
            data: {
              user: {
                id: mockUid,
                email: mockEmail,
                user_metadata: { ...data, nickname: mockNickname },
              },
            },
            error: null,
          };
        },
        setSession: async () => {
          return {
            data: {
              session: { access_token: "mock_jwt_token" },
            },
            error: null,
          };
        },
      };

      return new Proxy(client, {
        get(target, prop, receiver) {
          if (prop === "auth") {
            return authMock;
          }
          if (prop === "from") {
            return (table: string) => {
              return new MockSupabaseQueryBuilder(table);
            };
          }
          return Reflect.get(target, prop, receiver);
        },
      });
    }
  }

  return client;
}

class MockSupabaseQueryBuilder {
  private table: string;
  private selectFields: string = "*";
  private eqFilters: Record<string, any> = {};
  private updateData: Record<string, any> | null = null;
  private isUpsert = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string) {
    this.selectFields = fields;
    return this;
  }

  eq(column: string, value: any) {
    this.eqFilters[column] = value;
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  upsert(data: any) {
    this.updateData = data;
    this.isUpsert = true;
    return this;
  }

  async execute() {
    if (this.table === "profiles") {
      const { prisma } = await import("@/lib/prisma");
      const id = this.eqFilters.id;
      const email = this.eqFilters.email;
      const nickname = this.eqFilters.nickname;
      const naverId = this.eqFilters.naver_id;

      if (this.updateData) {
        const data: any = {};
        if (this.updateData.nickname !== undefined)
          data.nickname = this.updateData.nickname;
        if (this.updateData.phone_number !== undefined)
          data.phoneNumber = this.updateData.phone_number;
        if (this.updateData.terms_agreed_at !== undefined)
          data.termsAgreedAt = this.updateData.terms_agreed_at
            ? new Date(this.updateData.terms_agreed_at)
            : null;
        if (this.updateData.privacy_agreed_at !== undefined)
          data.privacyAgreedAt = this.updateData.privacy_agreed_at
            ? new Date(this.updateData.privacy_agreed_at)
            : null;
        if (this.updateData.marketing_agreed !== undefined)
          data.marketingAgreed = this.updateData.marketing_agreed;
        if (this.updateData.event_sms_agreed !== undefined)
          data.eventSmsAgreed = this.updateData.event_sms_agreed;

        let user;
        if (this.isUpsert) {
          const naverIdVal = this.updateData.naver_id;
          const lookupId =
            this.updateData.id ||
            id ||
            (naverIdVal ? `naver_${naverIdVal}` : `user_${Date.now()}`);

          user = await prisma.user.upsert({
            where: { id: lookupId },
            create: {
              id: lookupId,
              email:
                this.updateData.email ||
                email ||
                (naverIdVal
                  ? `naver_${naverIdVal}@naver.invalid`
                  : `user_${Date.now()}@example.com`),
              nickname:
                this.updateData.nickname || nickname || `user_${Date.now()}`,
              ...data,
            },
            update: data,
          });
        } else {
          let where: any = {};
          if (id) {
            where.id = id;
          } else if (email) {
            where.email = email;
          } else if (nickname) {
            where.nickname = nickname;
          } else if (naverId) {
            const targetUser = await prisma.user.findFirst({
              where: {
                OR: [
                  { id: naverId },
                  { email: `naver_${naverId}@naver.invalid` },
                ],
              },
            });
            where.id = targetUser ? targetUser.id : "non-existent-id";
          }

          user = await prisma.user.update({
            where,
            data,
          });
        }

        let responseNaverId = null;
        if (user.id.startsWith("naver_")) {
          responseNaverId = user.id.replace("naver_", "");
        } else if (
          user.email?.startsWith("naver_") &&
          user.email.endsWith("@naver.invalid")
        ) {
          responseNaverId = user.email.substring(
            6,
            user.email.indexOf("@naver.invalid"),
          );
        }

        return {
          data: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            phone_number: user.phoneNumber,
            terms_agreed_at: user.termsAgreedAt,
            privacy_agreed_at: user.privacyAgreedAt,
            marketing_agreed: user.marketingAgreed,
            event_sms_agreed: user.eventSmsAgreed,
            naver_id: responseNaverId,
          },
          error: null,
        };
      } else {
        let user = null;
        if (id) {
          user = await prisma.user.findUnique({ where: { id } });
        } else if (email) {
          user = await prisma.user.findUnique({ where: { email } });
        } else if (nickname) {
          user = await prisma.user.findUnique({ where: { nickname } });
        } else if (naverId) {
          user = await prisma.user.findFirst({
            where: {
              OR: [
                { id: naverId },
                { email: `naver_${naverId}@naver.invalid` },
              ],
            },
          });
        }

        if (!user) {
          return { data: null, error: null };
        }

        let responseNaverId = null;
        if (user.id.startsWith("naver_")) {
          responseNaverId = user.id.replace("naver_", "");
        } else if (
          user.email?.startsWith("naver_") &&
          user.email.endsWith("@naver.invalid")
        ) {
          responseNaverId = user.email.substring(
            6,
            user.email.indexOf("@naver.invalid"),
          );
        }

        return {
          data: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            phone_number: user.phoneNumber,
            terms_agreed_at: user.termsAgreedAt,
            privacy_agreed_at: user.privacyAgreedAt,
            marketing_agreed: user.marketingAgreed,
            event_sms_agreed: user.eventSmsAgreed,
            naver_id: responseNaverId,
          },
          error: null,
        };
      }
    }
    return {
      data: null,
      error: new Error(`MockTable ${this.table} not implemented`),
    };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  maybeSingle() {
    return this;
  }

  single() {
    return this;
  }
}
