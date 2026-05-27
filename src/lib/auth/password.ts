import bcryptjs from "bcryptjs";

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcryptjs.compare(plain, hash);
}
