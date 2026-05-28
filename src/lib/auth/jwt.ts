import { SignJWT, jwtVerify } from "jose";

export interface JwtPayload {
  userId: string;
  email?: string;
  nickname: string;
  provider?: "local" | "kakao" | "apple";
}

const ACCESS_TOKEN_TTL = "7d";
export const COOKIE_NAME = "accessToken";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
