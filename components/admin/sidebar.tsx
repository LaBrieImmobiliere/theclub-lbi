"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  ClipboardList,
  LogOut,
  BarChart2,
  Building2,
  Megaphone,
  MessageSquare,
  Trophy,
  Shield,
  Star,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { NotificationsBell } from "@/components/notifications-bell";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { GlobalSearch } from "@/components/global-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarDrawer, MobileOverlay, MobileHeader, useSidebar } from "@/components/mobile-sidebar";

const nav = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/ambassadeurs", label: "Ambassadeurs", icon: Users },
  { href: "/admin/negociateurs", label: "Négociateurs", icon: UserCog },
  { href: "/admin/recommandations", label: "Recommandations", icon: ClipboardList },
  { href: "/admin/contrats", label: "Contrats", icon: FileText },
  { href: "/admin/agences", label: "Agences", icon: Building2 },
  { href: "/admin/leaderboard", label: "Classement", icon: Trophy },
  { href: "/admin/agences-stats", label: "Comparatif agences", icon: BarChart2 },
  { href: "/admin/actualites", label: "Fil d'actualité", icon: Megaphone },
  { href: "/admin/messagerie", label: "Messagerie", icon: MessageSquare },
  { href: "/admin/avis", label: "Avis", icon: Star },
  { href: "/admin/stats", label: "Statistiques", icon: BarChart2 },
  { href: "/admin/audit-log", label: "Journal d'audit", icon: Shield },
];

function SidebarContent() {
  const pathname = usePathname();
  const { close } = useSidebar();

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <Image src="/logo-white.png" alt="La Brie Immobilière" width={210} height={70} style={{ height: 70, width: "auto", objectFit: "contain" }} />
        <div className="flex-1" />
        <ThemeToggle />
        <div className="hidden lg:block">
          <NotificationsBell />
        </div>
      </div>

      {/* Search + label */}
      <div className="px-4 py-3 border-b border-white/10 space-y-2">
        <GlobalSearch basePath="/admin" />
        <p className="text-[10px] text-white/50 tracking-widest uppercase">Administration</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              suppressHydrationWarning
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium transition-colors",
                active
                  ? "bg-brand-gold text-brand-deep"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span suppressHydrationWarning>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* PWA Install */}
      <PwaInstallButton variant="sidebar-dark" />

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/connexion" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </>
  );
}

export function AdminSidebar() {
  return (
    <>
      <MobileHeader variant="admin" />
      <MobileOverlay />
      <SidebarDrawer variant="admin">
        <SidebarContent />
      </SidebarDrawer>
    </>
  );
}
