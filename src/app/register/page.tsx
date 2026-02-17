import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/library");
  }

  return (
    <div className="px-2 py-3 sm:px-4 sm:py-4">
      <RegisterForm />
    </div>
  );
}
