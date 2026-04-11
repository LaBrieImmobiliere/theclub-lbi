"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PlusCircle, ClipboardList, MessageSquare, UserCircle,
  Users, Link2, FileText,
} from "lucide-react";

const AMBASSADOR_NAV = [
  { href: "/portail/tableau-de-bord", label: "Accueil", icon: LayoutDashboard },
  { href: "/portail/recommander", label: "Recommander", icon: PlusCircle },
  { href: "/portail/mes-recommandations", label: "Recos", icon: ClipboardList },
  { href: "/portail/messagerie", label: "Messages", icon: MessageSquare },
  { href: "/portail/profil", label: "Profil", icon: UserCircle },
];

const NEGOTIATOR_NAV = [
  { href: "/negociateur/tableau-de-bord", label: "Accueil", icon: LayoutDashboard },
  { href: "/negociateur/mes-recommandations", label: "Recos", icon: ClipboardList },
  { href: "/negociateur/parrainage", label: "Recruter", icon: Link2 },
  { href: "/negociateur/messagerie", label: "Messages", icon: MessageSquare },
  { href: "/negociateur/profil", label: "Profil", icon: UserCircle },
];

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/admin/ambassadeurs", label: "Ambass.", icon: Users },
  { href: "/admin/recommandations", label: "Recos", icon: ClipboardList },
  { href: "/admin/contrats", label: "Contrats", icon: FileText },
  { href: "/admin/messagerie", label: "Messages", icon: MessageSquare },
];

export function BottomNav({ role }: { role: "AMBASSADOR" | "NEGOTIATOR" | "ADMIN" }) {
  const pathname = usePathname();
  const nav = role === "ADMIN" ? ADMIN_NAV : role === "NEGOTIATOR" ? NEGOTIATOR_NAV : AMBASSADOR_NAV;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
                active ? "text-[#D1B280]" : "text-gray-400"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-[#D1B280]" : "text-gray-400"}`} />
              <span className={`text-[10px] font-medium ${active ? "text-[#D1B280]" : "text-gray-400"}`}>
                {label}
              </span>
              {active && (
                <div className="w-1 h-1 rounded-full bg-[#D1B280] -mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
