import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NegociateurSidebar } from "@/components/negociateur/sidebar";
import { MobileSidebarProvider } from "@/components/mobile-sidebar";
import { PushPrompt } from "@/components/push-prompt";
import { OnboardingTour } from "@/components/onboarding-tour";
import { BottomNav } from "@/components/bottom-nav";

export default async function NegociateurLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/auth/connexion");
  const role = (session.user as { role?: string }).role;
  if (role !== "NEGOTIATOR") redirect(role === "ADMIN" ? "/admin/dashboard" : "/portail/tableau-de-bord");
  return (
    <MobileSidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <NegociateurSidebar />
        <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0 pb-20 lg:pb-0">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          <PushPrompt />
          <OnboardingTour role="NEGOTIATOR" />
        </main>
        <BottomNav role="NEGOTIATOR" />
      </div>
    </MobileSidebarProvider>
  );
}
