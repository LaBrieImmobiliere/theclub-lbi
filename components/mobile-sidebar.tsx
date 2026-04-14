"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemedLogo } from "@/components/themed-logo";

type SidebarContextType = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  // Close sidebar on route change (resize)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function MobileHeader({ variant = "admin" }: { variant?: "admin" | "portal" }) {
  const { toggle } = useSidebar();
  const isAdmin = variant === "admin";

  return (
    <header
      className={`lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 ${
        isAdmin ? "bg-brand-deep" : "bg-white border-b border-gray-200"
      }`}
    >
      <button
        onClick={toggle}
        className={`p-2 rounded-lg transition-colors ${
          isAdmin ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-700"
        }`}
        aria-label="Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-2">
        {isAdmin ? (
          <Image src="/logo-white.png" alt="La Brie Immobilière" width={114} height={38} style={{ height: 38, width: "auto", objectFit: "contain" }} />
        ) : (
          <ThemedLogo height={38} />
        )}
        <div>
          <p className={`text-[10px] font-medium tracking-widest uppercase ${isAdmin ? "text-brand-gold" : "text-brand-gold"}`}>
            The Club
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationsBell />
      </div>
    </header>
  );
}

export function MobileOverlay() {
  const { isOpen, close } = useSidebar();

  if (!isOpen) return null;

  return (
    <div
      className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
      onClick={close}
    />
  );
}

export function SidebarDrawer({
  children,
  variant = "admin",
}: {
  children: React.ReactNode;
  variant?: "admin" | "portal";
}) {
  const { isOpen, close } = useSidebar();
  const isAdmin = variant === "admin";

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className={`hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col z-40 ${
        isAdmin ? "bg-brand-deep text-white" : "bg-white border-r border-gray-200"
      }`}>
        {children}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isAdmin ? "bg-brand-deep text-white" : "bg-white border-r border-gray-200"}`}
      >
        {/* Close button */}
        <button
          onClick={close}
          className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${
            isAdmin ? "hover:bg-white/10 text-white/70" : "hover:bg-gray-100 text-gray-400"
          }`}
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </aside>
    </>
  );
}
