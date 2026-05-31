import { z } from "zod";
import { normalizePhoneNumber } from "./signup.schema";

export const socialProfileSchema = z
  .object({
    phoneNumber: z.string().refine((value) => {
      try {
        normalizePhoneNumber(value);
        return true;
      } catch {
        return false;
      }
    }, "전화번호는 010-0000-0000 또는 01000000000 형식이어야 합니다."),
    isAgeOver14: z.boolean(),
    termsAgreed: z.boolean(),
    privacyAgreed: z.boolean(),
    marketingAgreed: z.boolean().default(false),
    eventSmsAgreed: z.boolean().default(false),
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

export type SocialProfileInput = z.infer<typeof socialProfileSchema>;
