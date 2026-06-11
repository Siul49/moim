import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// AES-256-GCM: 키 32바이트, IV 12바이트, authTag 16바이트
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

export interface EncryptedData {
  /** base64 인코딩된 AES-GCM 암호문 */
  ciphertext: string;
  /** base64 인코딩된 12-byte IV */
  iv: string;
  /** base64 인코딩된 16-byte authTag */
  authTag: string;
}

/**
 * 환경변수 ENCRYPTION_SECRET에서 32-byte 키를 로드한다.
 * .env.local에 ENCRYPTION_SECRET=<64자리 hex> 형태로 설정 필요.
 * 생성: openssl rand -hex 32
 */
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error(
      "ENCRYPTION_SECRET 환경변수가 없거나 올바르지 않습니다. (64자리 hex 필요)",
    );
  }
  return Buffer.from(secret, "hex");
}

/** 평문 문자열을 AES-256-GCM으로 암호화한다. */
export function encrypt(plaintext: string): EncryptedData {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

/** AES-256-GCM 암호문을 복호화해 평문 문자열을 반환한다. */
export function decrypt(data: EncryptedData): string {
  const key = getKey();
  const iv = Buffer.from(data.iv, "base64");
  const authTag = Buffer.from(data.authTag, "base64");
  const ciphertext = Buffer.from(data.ciphertext, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * DB 저장 형식으로 직렬화한다: "ciphertext:authTag"
 * IV는 별도 컬럼에 저장하므로 여기엔 포함하지 않는다.
 */
export function serializeEncrypted(data: EncryptedData): string {
  return `${data.ciphertext}:${data.authTag}`;
}

/** DB에서 읽어온 "ciphertext:authTag" 문자열과 IV로 EncryptedData를 복원한다. */
export function deserializeEncrypted(
  serialized: string,
  iv: string,
): EncryptedData {
  const colonIdx = serialized.lastIndexOf(":");
  return {
    ciphertext: serialized.slice(0, colonIdx),
    authTag: serialized.slice(colonIdx + 1),
    iv,
  };
}

/** 로그 마스킹: "user@icloud.com" → "u***@icloud.com" */
export function maskEmail(email: string): string {
  const atIdx = email.indexOf("@");
  if (atIdx <= 0) return "***";
  return `${email[0]}***${email.slice(atIdx)}`;
}
