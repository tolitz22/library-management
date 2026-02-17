import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { appendRow, getUserRowByEmail } from "@/lib/sheets";

type UserRow = {
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const user = await getUserRowByEmail<UserRow>(email);
  return user ?? null;
}

export async function createUser({ name, email, password }: { name: string; email: string; password: string }) {
  const passwordHash = await hashPassword(password);
  const row: UserRow = {
    userId: nanoid(),
    email: email.toLowerCase(),
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await appendRow("users", row);
  return row;
}
