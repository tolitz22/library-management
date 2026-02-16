import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;
  return userId;
}
