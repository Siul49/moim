import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, Session } from "@/lib/auth/session";

export interface ApiContext<TBody = unknown, TParams = unknown> {
  req: NextRequest;
  session: Session | null;
  body: TBody;
  params: TParams;
}

export interface ApiHandlerOptions<
  TBodySchema extends z.ZodTypeAny = z.ZodTypeAny,
> {
  requireAuth?: boolean;
  bodySchema?: TBodySchema;
}

/**
 * Next.js API 엔드포인트 공통 로직(세션 확인, 바디 파싱, 유효성 검사, 동적 params 바인딩, 예외 처리)을 추상화하는 래퍼입니다.
 */
export function createApiHandler<
  TBodySchema extends z.ZodTypeAny = z.ZodTypeAny,
  TParams = unknown,
>(
  options: ApiHandlerOptions<TBodySchema>,
  handler: (
    context: ApiContext<z.infer<TBodySchema>, TParams>,
  ) => Promise<NextResponse | Response>,
) {
  return async function (
    req: NextRequest,
    routeContext?: { params: Promise<TParams> } | unknown,
  ): Promise<NextResponse | Response> {
    try {
      // 1. Next.js 동적 라우트 params 비동기 추출
      let params: TParams = {} as TParams;
      if (
        routeContext &&
        typeof routeContext === "object" &&
        "params" in routeContext
      ) {
        const context = routeContext as { params: Promise<TParams> };
        params = await context.params;
      }

      // 2. 세션 확인 및 검증
      const session = await getSession();
      if (options.requireAuth && !session) {
        return NextResponse.json(
          { success: false, message: "인증이 필요합니다." },
          { status: 401 },
        );
      }

      // 3. 요청 바디 및 Zod 스키마 검증
      let body: z.infer<TBodySchema> | null = null;
      if (options.bodySchema) {
        const rawBody = await parseRequestBody(req);
        if (rawBody instanceof NextResponse) {
          return rawBody; // 400 에러 즉각 반환
        }

        const parseResult = options.bodySchema.safeParse(rawBody);
        if (!parseResult.success) {
          const firstError = parseResult.error.issues[0];
          return NextResponse.json(
            {
              success: false,
              message: firstError.message,
              field: firstError.path[0] ?? null,
            },
            { status: 422 },
          );
        }
        body = parseResult.data;
      }

      return await handler({
        req,
        session,
        body: body as z.infer<TBodySchema>,
        params,
      });
    } catch (err) {
      return apiErrorHandler(err);
    }
  };
}

/**
 * Request Body를 안전하게 파싱합니다.
 * 파싱 실패 시 400 에러 Response를 반환합니다.
 */
async function parseRequestBody(
  req: NextRequest,
): Promise<unknown | NextResponse> {
  try {
    return await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }
}

/**
 * API 처리 도중 발생한 예외를 일관된 형식으로 로깅하고 500 응답으로 포맷팅합니다.
 */
function apiErrorHandler(err: unknown): NextResponse {
  console.error("[API handler error]:", err);
  return NextResponse.json(
    { success: false, message: "서버 내부 오류가 발생했습니다." },
    { status: 500 },
  );
}
