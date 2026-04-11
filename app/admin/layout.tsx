import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { MobileSidebarProvider } from "@/components/mobile-sidebar";
import { PushPrompt } from "@/components/push-prompt";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/auth/connexion");
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/portail/tableau-de-bord");

  return (
    <MobileSidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          <PushPrompt />
        </main>
      </div>
    </MobileSidebarProvider>
  );
}
