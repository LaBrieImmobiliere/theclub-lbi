"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  LogOut,
  MessageSquare,
  Megaphone,
  UserCircle,
  Users,
  Link2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { NotificationsBell } from "@/components/notifications-bell";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarDrawer, MobileOverlay, MobileHeader, useSidebar } from "@/components/mobile-sidebar";

const negociateurNav = [
  { href: "/negociateur/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/negociateur/mes-recommandations", label: "Recommandations", icon: ClipboardList },
  { href: "/negociateur/mes-ambassadeurs", label: "Mes ambassadeurs", icon: Users },
  { href: "/negociateur/parrainage", label: "Recrutement", icon: Link2 },
  { href: "/negociateur/mes-contrats", label: "Contrats", icon: FileText },
  { href: "/negociateur/actualites", label: "Actualités", icon: Megaphone },
  { href: "/negociateur/profil", label: "Mon profil", icon: UserCircle },
  { href: "/negociateur/messagerie", label: "Messagerie", icon: MessageSquare },
];

function SidebarContent() {
  const pathname = usePathname();
  const { close } = useSidebar();

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="La Brie Immobilière" style={{ height: 60, width: "auto", objectFit: "contain" }} />
        <div className="flex-1" />
        <ThemeToggle />
        <div className="hidden lg:block">
          <NotificationsBell />
        </div>
      </div>

      {/* Role label */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-[10px] text-gray-400 tracking-widest uppercase">
          Espace N&eacute;gociateur
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {negociateurNav.map(({ href, label, icon: Icon }) => {
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

export function NegociateurSidebar() {
  return (
    <>
      <MobileHeader variant="portal" />
      <MobileOverlay />
      <SidebarDrawer variant="portal">
        <SidebarContent />
      </SidebarDrawer>
    </>
  );
}
