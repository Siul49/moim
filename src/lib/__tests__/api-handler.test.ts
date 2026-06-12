import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { createApiHandler } from "../api-handler";
import { getSession } from "../auth/session";
import { z } from "zod";

vi.mock("../auth/session", () => ({
  getSession: vi.fn(),
}));

describe("createApiHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when auth is required but session is missing", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const handler = createApiHandler({ requireAuth: true }, async () =>
      NextResponse.json({ ok: true }),
    );

    const req = new NextRequest("http://localhost/api/test");
    const res = await handler(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("인증이 필요합니다.");
  });

  it("should return 400 when body parsing fails", async () => {
    const handler = createApiHandler(
      { bodySchema: z.object({ value: z.string() }) },
      async () => NextResponse.json({ ok: true }),
    );

    // Invalid JSON body
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: "invalid-json",
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("요청 형식이 올바르지 않습니다.");
  });

  it("should return 422 when schema validation fails", async () => {
    const schema = z.object({
      email: z.string().email("올바른 이메일 형식이 아닙니다."),
    });

    const handler = createApiHandler({ bodySchema: schema }, async () =>
      NextResponse.json({ ok: true }),
    );

    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("올바른 이메일 형식이 아닙니다.");
    expect(body.field).toBe("email");
  });

  it("should return 500 and log when handler throws an error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const handler = createApiHandler({}, async () => {
      throw new Error("unexpected db error");
    });

    const req = new NextRequest("http://localhost/api/test");
    const res = await handler(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe("서버 내부 오류가 발생했습니다.");
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should successfully pass session and body to handler and return successful response", async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: "user-123",
      email: "test@example.com",
    });

    const schema = z.object({
      name: z.string(),
    });

    const handler = createApiHandler(
      { requireAuth: true, bodySchema: schema },
      async ({ session, body }) => {
        return NextResponse.json({
          ok: true,
          userId: session?.userId,
          name: body.name,
        });
      },
    );

    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "Alice" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.ok).toBe(true);
    expect(resBody.userId).toBe("user-123");
    expect(resBody.name).toBe("Alice");
  });

  it("should parse and pass route parameters to handler", async () => {
    const handler = createApiHandler<z.ZodTypeAny, { id: string }>(
      {},
      async ({ params }) => {
        return NextResponse.json({ id: params.id });
      },
    );

    const req = new NextRequest("http://localhost/api/test");
    const routeContext = { params: Promise.resolve({ id: "schedule-abc" }) };
    const res = await handler(req, routeContext);
    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.id).toBe("schedule-abc");
  });

  it("should pass null session when auth is optional and session is missing", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const handler = createApiHandler({}, async ({ session }) => {
      return NextResponse.json({ hasSession: session !== null });
    });

    const req = new NextRequest("http://localhost/api/test");
    const res = await handler(req);
    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.hasSession).toBe(false);
  });
});
