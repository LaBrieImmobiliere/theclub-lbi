"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  FileText,
  LogOut,
  FolderOpen,
  Link2,
  MessageSquare,
  Megaphone,
  UserCircle,
  Users,
  Coins,
  HelpCircle,
  Star,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { NotificationsBell } from "@/components/notifications-bell";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemedLogo } from "@/components/themed-logo";
import { LanguageToggle } from "@/components/language-toggle";
import { SidebarDrawer, MobileOverlay, MobileHeader, useSidebar } from "@/components/mobile-sidebar";

const ambassadorNav = [
  { href: "/portail/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/portail/recommander", label: "Recommander", icon: PlusCircle },
  { href: "/portail/mes-recommandations", label: "Mes recommandations", icon: ClipboardList },
  { href: "/portail/mes-contrats", label: "Mes contrats", icon: FileText },
  { href: "/portail/commissions", label: "Mes commissions", icon: Coins },
  { href: "/portail/documents", label: "Mes documents", icon: FolderOpen },
  { href: "/portail/parrainage", label: "La Brie Immobilière", icon: Link2 },
  { href: "/portail/actualites", label: "Actualités", icon: Megaphone },
  { href: "/portail/profil", label: "Mon profil", icon: UserCircle },
  { href: "/portail/messagerie", label: "Messagerie", icon: MessageSquare },
  { href: "/portail/avis", label: "Donner mon avis", icon: Star },
  { href: "/portail/aide", label: "Aide & FAQ", icon: HelpCircle },
];

const negotiatorNav = [
  { href: "/portail/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/portail/mes-recommandations", label: "Recommandations", icon: ClipboardList },
  { href: "/portail/mes-ambassadeurs", label: "Mes ambassadeurs", icon: Users },
  { href: "/portail/mes-contrats", label: "Contrats", icon: FileText },
  { href: "/portail/actualites", label: "Actualités", icon: Megaphone },
  { href: "/portail/profil", label: "Mon profil", icon: UserCircle },
  { href: "/portail/messagerie", label: "Messagerie", icon: MessageSquare },
];

function SidebarContent({ role }: { role: string }) {
  const pathname = usePathname();
  const { close } = useSidebar();
  const isNegotiator = role === "NEGOTIATOR";
  const nav = isNegotiator ? negotiatorNav : ambassadorNav;

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <ThemedLogo height={60} />
        <div className="flex-1" />
        <LanguageToggle />
        <ThemeToggle />
        <div className="hidden lg:block">
          <NotificationsBell />
        </div>
      </div>

      {/* Role label */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-[10px] text-gray-400 tracking-widest uppercase">
          {isNegotiator ? "Espace N\u00e9gociateur" : "Espace Ambassadeur"}
        </p>
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
                  ? "bg-brand-cream text-brand-deep border-l-2 border-brand-gold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-brand-deep"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", active ? "text-brand-gold" : "text-gray-400")} />
              <span suppressHydrationWarning>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* PWA Install */}
      <PwaInstallButton variant="sidebar-light" />

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/connexion" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-brand-deep transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          D&eacute;connexion
        </button>
      </div>
    </>
  );
}

export function PortalSidebar({ role }: { role: string }) {
  return (
    <>
      <MobileHeader variant="portal" />
      <MobileOverlay />
      <SidebarDrawer variant="portal">
        <SidebarContent role={role} />
      </SidebarDrawer>
    </>
  );
}
