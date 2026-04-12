import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");
  const role = (session.user as { role?: string }).role;
  if (role === "ADMIN") redirect("/admin/dashboard");
  if (role === "NEGOTIATOR") redirect("/negociateur/tableau-de-bord");
  redirect("/portail/tableau-de-bord");
}
