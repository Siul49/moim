/**
 * 사용자/인증 관련 타입 정의
 *
 * PRD 3.1의 소셜 로그인(카카오/구글) 결과 사용자 정보.
 */

/** 소셜 로그인 제공자 */
export type AuthProvider = "kakao" | "google";

/** 사용자 프로필 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: AuthProvider;
  createdAt: string;
}
