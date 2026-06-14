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
  loadSession?: boolean;
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
      const shouldLoadSession = options.requireAuth || options.loadSession;
      const session = shouldLoadSession ? await getSession() : null;
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

import { MoimError } from "@/lib/errors";

/**
 * API 처리 도중 발생한 예외를 일관된 형식으로 로깅하고 응답으로 포맷팅합니다.
 */
function apiErrorHandler(err: unknown): NextResponse {
  // 1. Next.js 내장 특수 에러(Redirect, NotFound)는 프레임워크가 직접 처리하도록 throw
  if (isRedirectError(err) || isNotFoundError(err)) {
    throw err;
  }

  console.error("[API handler error]:", err);

  const isDev = process.env.NODE_ENV === "development";
  const errInstance = err instanceof Error ? err : null;
  const errName = errInstance
    ? errInstance.name
    : err && typeof err === "object"
      ? err.constructor?.name
      : typeof err;

  // 환경변수 관련 키워드 검출
  let isEnvError = false;
  if (errInstance) {
    const lowerMessage = errInstance.message.toLowerCase();
    const lowerStack = (errInstance.stack || "").toLowerCase();
    const envKeywords = [
      "env",
      "environment",
      "client_id",
      "client_secret",
      "jwt_secret",
      "gemini_api_key",
      "database_url",
      "key_id",
      "team_id",
      "private_key",
    ];
    isEnvError = envKeywords.some(
      (keyword) =>
        lowerMessage.includes(keyword) || lowerStack.includes(keyword),
    );
  }

  // 필수 환경변수 존재 여부 검사
  const requiredEnvKeys = [
    "DATABASE_URL",
    "JWT_SECRET",
    "GOOGLE_CALENDAR_CLIENT_ID",
    "GOOGLE_CALENDAR_CLIENT_SECRET",
    "NAVER_CLIENT_ID",
    "NAVER_CLIENT_SECRET",
  ];

  const missingEnvKeys = requiredEnvKeys.filter((key) => !process.env[key]);
  if (missingEnvKeys.length > 0) {
    isEnvError = true;
  }

  const envStatus = isDev
    ? {
        DATABASE_URL: !!process.env.DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        GOOGLE_CALENDAR_CLIENT_ID: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
        GOOGLE_CALENDAR_CLIENT_SECRET:
          !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
        NAVER_CLIENT_ID: !!process.env.NAVER_CLIENT_ID,
        NAVER_CLIENT_SECRET: !!process.env.NAVER_CLIENT_SECRET,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      }
    : undefined;

  let devHint = undefined;
  if (isDev) {
    if (isEnvError) {
      if (missingEnvKeys.length > 0) {
        devHint = `누락된 필수 환경변수가 감지되었습니다: ${missingEnvKeys.join(", ")}. .env 파일을 확인해 주세요.`;
      } else {
        devHint =
          "환경변수(Env)와 관련된 오류가 의심됩니다. API 키 설정 혹은 .env 구성을 점검해 주세요.";
      }
    } else {
      devHint =
        "발생한 오류의 예외 클래스 타입과 스택 트레이스를 확인하여 디버깅하십시오.";
    }
  }

  if (err instanceof MoimError) {
    return NextResponse.json(
      {
        success: false,
        message: err.clientMessage,
        code: err.code,
        details: err.details,
        errorType: isDev ? errName : undefined,
        isEnvError: isDev ? isEnvError : undefined,
        devHint: isDev ? devHint : undefined,
        envStatus: isDev ? envStatus : undefined,
        stack: isDev ? err.stack : undefined,
      },
      { status: err.statusCode },
    );
  }

  return NextResponse.json(
    {
      success: false,
      message:
        isDev && errInstance
          ? errInstance.message
          : "서버 내부 오류가 발생했습니다.",
      errorType: isDev ? errName : undefined,
      isEnvError: isDev ? isEnvError : undefined,
      devHint: isDev ? devHint : undefined,
      envStatus: isDev ? envStatus : undefined,
      stack: isDev && errInstance ? errInstance.stack : undefined,
    },
    { status: 500 },
  );
}

/**
 * Next.js가 throw하는 리디렉션 전용 특수 에러인지 판별합니다.
 */
function isRedirectError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const digest = (err as Record<string, unknown>).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/**
 * Next.js가 throw하는 NotFound 전용 특수 에러인지 판별합니다.
 */
function isNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  return (err as Record<string, unknown>).digest === "NEXT_NOT_FOUND";
}
