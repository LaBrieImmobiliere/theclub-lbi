import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalSidebar } from "@/components/portal/sidebar";
import { MobileSidebarProvider } from "@/components/mobile-sidebar";
import { OnboardingWrapper } from "@/components/portal/onboarding-wrapper";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/auth/connexion");
  const role = (session.user as { role?: string }).role;
  if (role === "ADMIN") redirect("/admin/dashboard");
  if (role === "NEGOTIATOR") redirect("/negociateur/tableau-de-bord");

  return (
    <MobileSidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <PortalSidebar role={role ?? "AMBASSADOR"} />
        <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0">
          <OnboardingWrapper>
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </OnboardingWrapper>
        </main>
      </div>
    </MobileSidebarProvider>
  );
}
