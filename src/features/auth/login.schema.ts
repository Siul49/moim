import { z } from "zod";

export const loginSchema = z.object({
  loginId: z.string().min(1, "아이디와 비밀번호를 입력해주세요."),
  password: z.string().min(1, "아이디와 비밀번호를 입력해주세요."),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}
