import { cookies } from "next/headers";
import {
  encrypt,
  decrypt,
  serializeEncrypted,
  deserializeEncrypted,
} from "@/lib/crypto";

// ============================================================
// iCloud 연결 정보 쿠키 저장소
//
// Google/Naver 캘린더(`google/auth.ts`)와 동일하게, 연동 정보를 HttpOnly
// 쿠키에 저장한다. 앱의 실제 인증은 커스텀 JWT 쿠키(`accessToken`)를 쓰므로
// Supabase Auth 세션/RLS에 의존하지 않는다.
//
// 앱 전용 암호는 장기 유효한 민감 정보라 AES-256-GCM(`crypto.ts`)으로 암호화해
// 보관한다. 따라서 ENCRYPTION_SECRET 환경변수가 필요하다.
// ============================================================

const CONNECTION_COOKIE_NAME = "icloud_connection";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30일

/** API 응답/상태 표시에 쓰는 공개 연결 정보 (앱 암호 미포함) */
export interface ICloudConnection {
  appleId: string;
  principalUrl: string;
  calendarHomeUrl: string;
}

/** CalDAV 요청에 쓰는 인증 정보 (복호화된 앱 암호 포함) — 서버 전용 */
export interface ICloudConnectionAuth extends ICloudConnection {
  password: string;
}

/** 쿠키에 직렬화되어 저장되는 형태 (암호화된 앱 암호 포함) */
interface StoredConnection extends ICloudConnection {
  /** "base64(ciphertext):base64(authTag)" */
  encryptedPassword: string;
  /** base64(12-byte IV) */
  encryptionIv: string;
}

/**
 * 연결 정보를 HttpOnly 쿠키에 저장한다.
 * 앱 전용 암호는 AES-GCM으로 암호화해 보관한다.
 */
export async function saveConnection(params: {
  appleId: string;
  appPassword: string;
  principalUrl: string;
  calendarHomeUrl: string;
}): Promise<void> {
  const enc = encrypt(params.appPassword);
  const stored: StoredConnection = {
    appleId: params.appleId,
    principalUrl: params.principalUrl,
    calendarHomeUrl: params.calendarHomeUrl,
    encryptedPassword: serializeEncrypted(enc),
    encryptionIv: enc.iv,
  };

  const cookieStore = await cookies();
  cookieStore.set(CONNECTION_COOKIE_NAME, JSON.stringify(stored), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/** 쿠키에서 공개 연결 정보를 읽는다. 앱 암호는 포함하지 않는다. */
export async function getConnection(): Promise<ICloudConnection | null> {
  const stored = await readStored();
  if (!stored) return null;
  return {
    appleId: stored.appleId,
    principalUrl: stored.principalUrl,
    calendarHomeUrl: stored.calendarHomeUrl,
  };
}

/**
 * CalDAV 요청용 인증 정보(복호화된 앱 암호 포함)를 읽는다.
 * 서버 라우트 핸들러에서만 사용해야 한다.
 */
export async function getConnectionAuth(): Promise<ICloudConnectionAuth | null> {
  const stored = await readStored();
  if (!stored) return null;
  const password = decrypt(
    deserializeEncrypted(stored.encryptedPassword, stored.encryptionIv),
  );
  return {
    appleId: stored.appleId,
    principalUrl: stored.principalUrl,
    calendarHomeUrl: stored.calendarHomeUrl,
    password,
  };
}

/** 연결 쿠키를 삭제한다. */
export async function clearConnection(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CONNECTION_COOKIE_NAME);
}

async function readStored(): Promise<StoredConnection | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CONNECTION_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredConnection;
  } catch {
    return null;
  }
}
