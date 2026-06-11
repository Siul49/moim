import { describe, test, expect, beforeAll } from "vitest";
import {
  encrypt,
  decrypt,
  serializeEncrypted,
  deserializeEncrypted,
  maskEmail,
} from "../crypto";

// 테스트용 64자리 hex 키 설정
beforeAll(() => {
  process.env.ENCRYPTION_SECRET =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("encrypt / decrypt 라운드트립", () => {
  test("암호화 후 복호화하면 원본과 동일하다", () => {
    const plaintext = "my-secret-app-password";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  test("빈 문자열도 라운드트립이 가능하다", () => {
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  test("한글 문자열도 라운드트립이 가능하다", () => {
    const plaintext = "앱 전용 비밀번호 테스트";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  test("같은 평문이라도 매번 다른 암호문이 생성된다 (랜덤 IV)", () => {
    const plaintext = "same-password";
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);

    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  test("authTag가 변조되면 복호화에 실패한다", () => {
    const encrypted = encrypt("test");
    encrypted.authTag = Buffer.from("0000000000000000").toString("base64");

    expect(() => decrypt(encrypted)).toThrow();
  });
});

describe("serializeEncrypted / deserializeEncrypted", () => {
  test("직렬화 후 역직렬화하면 원본 데이터가 복원된다", () => {
    const original = encrypt("roundtrip-test");
    const serialized = serializeEncrypted(original);
    const restored = deserializeEncrypted(serialized, original.iv);

    expect(restored.ciphertext).toBe(original.ciphertext);
    expect(restored.authTag).toBe(original.authTag);
    expect(restored.iv).toBe(original.iv);
  });

  test("직렬화 형식은 'ciphertext:authTag'이다", () => {
    const data = encrypt("test");
    const serialized = serializeEncrypted(data);

    expect(serialized).toBe(`${data.ciphertext}:${data.authTag}`);
  });

  test("직렬화→역직렬화 후 복호화가 가능하다", () => {
    const plaintext = "full-cycle-test";
    const encrypted = encrypt(plaintext);
    const serialized = serializeEncrypted(encrypted);
    const restored = deserializeEncrypted(serialized, encrypted.iv);

    expect(decrypt(restored)).toBe(plaintext);
  });
});

describe("maskEmail", () => {
  test("이메일의 첫 글자만 남기고 마스킹한다", () => {
    expect(maskEmail("user@icloud.com")).toBe("u***@icloud.com");
  });

  test("짧은 로컬 파트도 처리한다", () => {
    expect(maskEmail("a@example.com")).toBe("a***@example.com");
  });

  test("@가 없는 문자열은 ***를 반환한다", () => {
    expect(maskEmail("invalid")).toBe("***");
  });

  test("빈 문자열은 ***를 반환한다", () => {
    expect(maskEmail("")).toBe("***");
  });
});

describe("ENCRYPTION_SECRET 검증", () => {
  test("키가 없으면 에러를 던진다", () => {
    const original = process.env.ENCRYPTION_SECRET;
    delete process.env.ENCRYPTION_SECRET;

    expect(() => encrypt("test")).toThrow("ENCRYPTION_SECRET");

    process.env.ENCRYPTION_SECRET = original;
  });

  test("키 길이가 64자가 아니면 에러를 던진다", () => {
    const original = process.env.ENCRYPTION_SECRET;
    process.env.ENCRYPTION_SECRET = "tooshort";

    expect(() => encrypt("test")).toThrow("ENCRYPTION_SECRET");

    process.env.ENCRYPTION_SECRET = original;
  });
});
