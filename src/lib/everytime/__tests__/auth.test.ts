import { afterEach, describe, expect, it, vi } from "vitest";
import { EverytimeAuthError, parseLoginResponse } from "../auth";

describe("parseLoginResponse", () => {
  it("정상 응답 JSON에서 token과 userIdx를 반환한다", () => {
    const data = { status: "ok", token: "abc123", idx: 99999 };
    const session = parseLoginResponse(data);
    expect(session.token).toBe("abc123");
    expect(session.userIdx).toBe("99999");
  });

  it("status가 ok가 아니면 EverytimeAuthError를 throw한다", () => {
    const data = { status: "not_exists_user" };
    expect(() => parseLoginResponse(data)).toThrow(EverytimeAuthError);
  });

  it("token이 없으면 EverytimeAuthError를 throw한다", () => {
    const data = { status: "ok", idx: 99999 };
    expect(() => parseLoginResponse(data)).toThrow(EverytimeAuthError);
  });

  it("idx가 없으면 EverytimeAuthError를 throw한다", () => {
    const data = { status: "ok", token: "abc123" };
    expect(() => parseLoginResponse(data)).toThrow(EverytimeAuthError);
  });

  it("token이 빈 문자열이면 EverytimeAuthError를 throw한다", () => {
    const data = { status: "ok", token: "", idx: 99999 };
    expect(() => parseLoginResponse(data)).toThrow(EverytimeAuthError);
  });

  it("idx가 number 타입일 때 string으로 변환된다", () => {
    const data = { status: "ok", token: "abc123", idx: 12345 };
    const session = parseLoginResponse(data);
    expect(session.userIdx).toBe("12345");
    expect(typeof session.userIdx).toBe("string");
  });

  it("null을 전달하면 EverytimeAuthError를 throw한다", () => {
    expect(() => parseLoginResponse(null)).toThrow(EverytimeAuthError);
  });

  it("undefined를 전달하면 EverytimeAuthError를 throw한다", () => {
    expect(() => parseLoginResponse(undefined)).toThrow(EverytimeAuthError);
  });

  it("문자열을 전달하면 EverytimeAuthError를 throw한다", () => {
    expect(() => parseLoginResponse("string")).toThrow(EverytimeAuthError);
  });

  it("숫자를 전달하면 EverytimeAuthError를 throw한다", () => {
    expect(() => parseLoginResponse(123)).toThrow(EverytimeAuthError);
  });

  it("배열을 전달하면 EverytimeAuthError를 throw한다", () => {
    expect(() => parseLoginResponse([])).toThrow(EverytimeAuthError);
  });
});

describe("loginToEverytime (HTTP)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("세션 쿠키 획득 후 로그인 성공 시 세션을 반환한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        // 1번째 호출: 로그인 페이지 GET (쿠키 획득)
        .mockResolvedValueOnce({
          headers: {
            getSetCookie: () => [
              "etsid=session123; Path=/",
              "x-et-device=device456; Path=/",
            ],
            get: () => null,
          },
          redirect: "follow",
        })
        // 2번째 호출: 로그인 POST
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ status: "ok", token: "tok-xyz", idx: 12345 }),
        }),
    );

    const { loginToEverytime } = await import("../auth");
    const session = await loginToEverytime({ id: "user1", password: "pass1" });

    expect(session.token).toBe("tok-xyz");
    expect(session.userIdx).toBe("12345");
  });

  it("서버 오류(5xx)이면 EverytimeAuthError를 throw한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          headers: { getSetCookie: () => [], get: () => null },
        })
        .mockResolvedValueOnce({ ok: false, status: 500 }),
    );

    const { loginToEverytime, EverytimeAuthError: AuthErr } =
      await import("../auth");
    await expect(
      loginToEverytime({ id: "user1", password: "pass1" }),
    ).rejects.toThrow(AuthErr);
  });

  it("잘못된 자격증명이면 EverytimeAuthError를 throw한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          headers: { getSetCookie: () => [], get: () => null },
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: "not_exists_user" }),
        }),
    );

    const { loginToEverytime, EverytimeAuthError: AuthErr } =
      await import("../auth");
    await expect(
      loginToEverytime({ id: "wrong", password: "wrong" }),
    ).rejects.toThrow(AuthErr);
  });

  it("세션 쿠키 요청이 네트워크 오류로 실패하면 에러를 throw한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const { loginToEverytime } = await import("../auth");
    await expect(
      loginToEverytime({ id: "user1", password: "pass1" }),
    ).rejects.toThrow();
  });
});
