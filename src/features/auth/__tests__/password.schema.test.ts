import { describe, it, expect } from "vitest";
import { validatePassword, passwordSchema } from "../password.schema";

describe("Password Validation Schema", () => {
  describe("validatePassword helper", () => {
    it("should return true for valid passwords", () => {
      expect(validatePassword("ValidPass123!")).toBe(true);
      expect(validatePassword("a1@b2#c3$")).toBe(true);
    });

    it("should return false for passwords shorter than 8 characters", () => {
      expect(validatePassword("Sh1t!")).toBe(false);
    });

    it("should return false if letters are missing", () => {
      expect(validatePassword("12345678!")).toBe(false);
    });

    it("should return false if digits are missing", () => {
      expect(validatePassword("abcdefgh!")).toBe(false);
    });

    it("should return false if special characters are missing", () => {
      expect(validatePassword("abcdefg1")).toBe(false);
    });
  });

  describe("passwordSchema (Zod)", () => {
    it("should successfully parse a valid password", () => {
      const result = passwordSchema.safeParse("ValidPass123!");
      expect(result.success).toBe(true);
    });

    it("should fail validation for weak passwords", () => {
      const short = passwordSchema.safeParse("Sh1t!");
      expect(short.success).toBe(false);

      const noLetter = passwordSchema.safeParse("12345678!");
      expect(noLetter.success).toBe(false);

      const noDigit = passwordSchema.safeParse("abcdefgh!");
      expect(noDigit.success).toBe(false);

      const noSpecial = passwordSchema.safeParse("abcdefg1");
      expect(noSpecial.success).toBe(false);
    });
  });
});
