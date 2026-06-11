import { z } from "zod";

const PHONE_RAW = /^010\d{8}$/;
const PHONE_DASH = /^010-\d{4}-\d{4}$/;

export const signupSchema = z
  .object({
    email: z.string().email("올바른 이메일 형식이 아닙니다."),
    phoneNumber: z
      .string()
      .refine(
        (v) => PHONE_RAW.test(v) || PHONE_DASH.test(v),
        "전화번호는 010-0000-0000 또는 01000000000 형식이어야 합니다.",
      ),
    nickname: z
      .string()
      .min(2, "닉네임은 2자 이상이어야 합니다.")
      .max(12, "닉네임은 12자 이하여야 합니다."),
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상이어야 합니다.")
      .regex(/[a-zA-Z]/, "비밀번호에 영문자를 포함해야 합니다.")
      .regex(/[0-9]/, "비밀번호에 숫자를 포함해야 합니다."),
    passwordConfirm: z.string(),
    isAgeOver14: z.boolean(),
    termsAgreed: z.boolean(),
    privacyAgreed: z.boolean(),
    marketingAgreed: z.boolean().default(false),
    eventSmsAgreed: z.boolean().default(false),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  })
  .refine((data) => data.isAgeOver14, {
    message: "만 14세 이상이어야 가입할 수 있습니다.",
    path: ["isAgeOver14"],
  })
  .refine((data) => data.termsAgreed, {
    message: "이용약관에 동의해야 합니다.",
    path: ["termsAgreed"],
  })
  .refine((data) => data.privacyAgreed, {
    message: "개인정보 수집 및 이용에 동의해야 합니다.",
    path: ["privacyAgreed"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!/^010\d{8}$/.test(digits)) {
    throw new Error(`유효하지 않은 전화번호입니다: ${phone}`);
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
