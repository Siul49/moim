import { z } from "zod";

// 비밀번호 검증용 정규식: 영문, 숫자, 특수문자를 포함하여 8자 이상
export const PASSWORD_REGEX =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",./<>?]).{8,}$/;

export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .regex(/[a-zA-Z]/, "비밀번호에 영문자를 포함해야 합니다.")
  .regex(/[0-9]/, "비밀번호에 숫자를 포함해야 합니다.")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':",./<>?]/,
    "비밀번호에 특수문자를 포함해야 합니다.",
  );

/**
 * 비밀번호 강도 규격을 만족하는지 검증합니다.
 * - 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.
 */
export function validatePassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}
