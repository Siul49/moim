// ============================================================
// Naver 연동 전용 에러 타입
// 메시지 문자열 매칭 대신 에러 타입으로 분기하기 위해 사용한다.
// ============================================================

/** Naver API 인증 실패(401) */
export class NaverAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NaverAuthError";
  }
}

/** Naver API 권한 부족(403) */
export class NaverPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NaverPermissionError";
  }
}
