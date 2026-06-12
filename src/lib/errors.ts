export class MoimError extends Error {
  constructor(
    message: string,
    public readonly code: string = "INTERNAL_ERROR",
    public readonly statusCode: number = 500,
    public readonly clientMessage: string = "서버 내부 오류가 발생했습니다.",
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends MoimError {
  constructor(
    message = "인증이 필요합니다.",
    clientMessage = "인증이 필요합니다.",
  ) {
    super(message, "UNAUTHORIZED", 401, clientMessage);
  }
}

export class ForbiddenError extends MoimError {
  constructor(
    message = "접근 권한이 없습니다.",
    clientMessage = "접근 권한이 없습니다.",
  ) {
    super(message, "FORBIDDEN", 403, clientMessage);
  }
}

export class ExternalServiceError extends MoimError {
  constructor(
    message: string,
    public readonly serviceName: string,
    statusCode = 500,
    clientMessage = `${serviceName} 연동 중 오류가 발생했습니다.`,
    details?: Record<string, unknown>,
  ) {
    super(
      message,
      `${serviceName.toUpperCase()}_ERROR`,
      statusCode,
      clientMessage,
      details,
    );
  }
}

export class CalDAVError extends ExternalServiceError {
  constructor(
    message: string,
    statusCode: number,
    public readonly url: string,
  ) {
    super(
      message,
      "iCloud",
      statusCode,
      "iCloud 연동 중 오류가 발생했습니다.",
      { url },
    );
  }
}

export class EverytimeError extends ExternalServiceError {
  constructor(
    message: string,
    public readonly type: "AUTH" | "FETCH" | "SCRAPE",
    statusCode = 500,
    details?: Record<string, unknown>,
  ) {
    super(
      message,
      "Everytime",
      statusCode,
      "에브리타임 연동 중 오류가 발생했습니다.",
      { ...details, type },
    );
  }
}

export class EverytimeAuthError extends EverytimeError {
  constructor(message: string) {
    super(message, "AUTH", 401);
  }
}

export class EverytimeFetchError extends EverytimeError {
  constructor(message: string) {
    super(message, "FETCH", 500);
  }
}

export class EverytimeScrapeError extends EverytimeError {
  constructor(message: string) {
    super(message, "SCRAPE", 400);
  }
}
