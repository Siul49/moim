import { describe, expect, test } from "vitest";
import { socialProfileSchema } from "../social-profile.schema";

const validInput = {
  phoneNumber: "010-1234-5678",
  isAgeOver14: true,
  termsAgreed: true,
  privacyAgreed: true,
  marketingAgreed: false,
  eventSmsAgreed: false,
};

describe("socialProfileSchema", () => {
  test("소셜 로그인 추가 정보를 검증한다", () => {
    const result = socialProfileSchema.safeParse(validInput);

    expect(result.success).toBe(true);
  });

  test("필수 약관 동의가 없으면 실패한다", () => {
    const result = socialProfileSchema.safeParse({
      ...validInput,
      termsAgreed: false,
    });

    expect(result.success).toBe(false);
  });

  test("전화번호 형식이 맞지 않으면 실패한다", () => {
    const result = socialProfileSchema.safeParse({
      ...validInput,
      phoneNumber: "02-123-4567",
    });

    expect(result.success).toBe(false);
  });
});
