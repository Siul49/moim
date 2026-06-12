import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("올바른 이메일 주소를 입력해 주세요."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
