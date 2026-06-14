import { describe, it, expect } from "vitest";
import {
  MoimError,
  UnauthorizedError,
  ForbiddenError,
  ExternalServiceError,
  CalDAVError,
  EverytimeError,
  EverytimeAuthError,
  EverytimeFetchError,
  EverytimeScrapeError,
} from "../errors";
import { UnauthorizedError as SessionUnauthorizedError } from "../auth/session";
import { CalDAVError as CaldavClientError } from "../caldav/client";
import { EverytimeAuthError as EverytimeAuthModuleError } from "../everytime/auth";
import { EverytimeFetchError as EverytimeTimetableError } from "../everytime/timetable";
import { EverytimeScrapeError as EverytimeScraperError } from "../everytime/url-scraper";

describe("MoimError 계층 구조 검증", () => {
  it("기존 공개 진입점이 동일한 에러 클래스를 계속 재-export한다", () => {
    expect(SessionUnauthorizedError).toBe(UnauthorizedError);
    expect(CaldavClientError).toBe(CalDAVError);
    expect(EverytimeAuthModuleError).toBe(EverytimeAuthError);
    expect(EverytimeTimetableError).toBe(EverytimeFetchError);
    expect(EverytimeScraperError).toBe(EverytimeScrapeError);
  });

  it("MoimError는 기본 예외 필드를 정상적으로 초기화한다", () => {
    const error = new MoimError(
      "Internal crash",
      "DB_ERROR",
      500,
      "서버 오류",
      { traceId: "123" },
    );
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MoimError);
    expect(error.message).toBe("Internal crash");
    expect(error.code).toBe("DB_ERROR");
    expect(error.statusCode).toBe(500);
    expect(error.clientMessage).toBe("서버 오류");
    expect(error.details).toEqual({ traceId: "123" });
  });

  it("UnauthorizedError는 401 상태코드와 UNAUTHORIZED 코드를 설정한다", () => {
    const error = new UnauthorizedError();
    expect(error).toBeInstanceOf(MoimError);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.clientMessage).toBe("인증이 필요합니다.");
  });

  it("ForbiddenError는 403 상태코드와 FORBIDDEN 코드를 설정한다", () => {
    const error = new ForbiddenError();
    expect(error).toBeInstanceOf(MoimError);
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.clientMessage).toBe("접근 권한이 없습니다.");
  });

  it("ExternalServiceError는 서비스 이름에 따른 코드를 자동으로 생성한다", () => {
    const error = new ExternalServiceError("Fetch failed", "Slack", 502);
    expect(error).toBeInstanceOf(MoimError);
    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.code).toBe("SLACK_ERROR");
    expect(error.statusCode).toBe(502);
    expect(error.clientMessage).toBe("Slack 연동 중 오류가 발생했습니다.");
  });

  it("CalDAVError는 iCloud 연동 전용 정보와 401/500 등의 상태코드를 갖는다", () => {
    const error = new CalDAVError(
      "Auth fail",
      401,
      "https://caldav.icloud.com",
    );
    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error).toBeInstanceOf(CalDAVError);
    expect(error.code).toBe("ICLOUD_ERROR");
    expect(error.statusCode).toBe(401);
    expect(error.details).toEqual({ url: "https://caldav.icloud.com" });
  });

  it("EverytimeError 및 그 하위 에러들은 세부 타입과 상태코드를 올바르게 매핑한다", () => {
    const authError = new EverytimeAuthError("Invalid ID");
    expect(authError).toBeInstanceOf(EverytimeError);
    expect(authError).toBeInstanceOf(EverytimeAuthError);
    expect(authError.statusCode).toBe(401);
    expect(authError.code).toBe("EVERYTIME_ERROR");
    expect(authError.details).toEqual({ type: "AUTH" });

    const fetchError = new EverytimeFetchError("Network block");
    expect(fetchError).toBeInstanceOf(EverytimeFetchError);
    expect(fetchError.statusCode).toBe(500);
    expect(fetchError.details).toEqual({ type: "FETCH" });

    const scrapeError = new EverytimeScrapeError("Invalid share URL");
    expect(scrapeError).toBeInstanceOf(EverytimeScrapeError);
    expect(scrapeError.statusCode).toBe(400);
    expect(scrapeError.details).toEqual({ type: "SCRAPE" });
  });
});
