"use client";

import { useState, useEffect, useCallback } from "react";
import { Smartphone, Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Icône Partager iOS (SVG)
const ShareIcon = ({ size = 28, color = "#D1B280" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <polyline points="16 5 12 1 8 5" />
    <line x1="12" y1="1" x2="12" y2="15" />
  </svg>
);

function detectIosBrowser(): "safari" | "chrome" | "firefox" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (ua.includes("CriOS")) return "chrome";
  if (ua.includes("FxiOS")) return "firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
  return "other";
}

// iOS: bannière fixe en bas d'écran pointant vers le bouton Partager
function IosBanner({ onDismiss }: { onDismiss: () => void }) {
  const browser = detectIosBrowser();

  const hint =
    browser === "chrome"
      ? { location: "en haut à droite", arrow: "up" }
      : browser === "firefox"
      ? { location: "en bas au centre", arrow: "down" }
      : { location: "en bas de l\u2019écran", arrow: "down" }; // Safari + autres

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[9999] flex flex-col items-center"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Flèche vers le haut pour Chrome (bouton en haut à droite) */}
      {hint.arrow === "up" && (
        <div className="self-end mr-6 mb-0">
          <svg width="20" height="12" viewBox="0 0 20 12">
            <polygon points="0,12 20,12 10,0" fill="#030A24" />
          </svg>
        </div>
      )}

      {/* Bulle */}
      <div className="mx-4 mb-1 w-full max-w-sm bg-brand-deep rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-4">
        <div className="flex-shrink-0">
          <ShareIcon />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">
            Installer l&apos;application
          </p>
          <p className="text-white/60 text-xs mt-0.5 leading-snug">
            Appuyez sur <ShareIcon size={12} color="#D1B280" />{" "}
            <span className="text-white/40">{hint.location}</span>{" "}
            puis{" "}
            <strong className="text-white">&laquo;&nbsp;Sur l&apos;écran d&apos;accueil&nbsp;&raquo;</strong>
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-white/40 hover:text-white/70 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Flèche vers le bas pour Safari/Firefox (bouton en bas) */}
      {hint.arrow === "down" && (
        <div className="mb-2">
          <svg width="20" height="12" viewBox="0 0 20 12">
            <polygon points="0,0 20,0 10,12" fill="#030A24" />
          </svg>
        </div>
      )}
    </div>
  );
}

interface Props {
  variant?: "sidebar-light" | "sidebar-dark" | "login";
}

export function PwaInstallButton({ variant = "sidebar-light" }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("pwa-dismissed") === "1") return;

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !("MSStream" in window);
    setIsIos(ios);

    if (ios) {
      setIsVisible(true);
    } else {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setIsVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem("pwa-dismissed", "1");
  }, []);

  const install = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsVisible(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  if (!isVisible) return null;

  // iOS → bannière globale en bas d'écran (indépendante du variant)
  if (isIos) {
    return <IosBanner onDismiss={dismiss} />;
  }

  // Android / Desktop — bouton dans la sidebar ou login
  if (variant === "login") {
    return (
      <div className="mt-4 border border-white/10 bg-white/5 p-4 text-center">
        <Smartphone className="w-5 h-5 text-brand-gold mx-auto mb-2" />
        <p className="text-white text-sm font-medium mb-0.5">Installer l&apos;application</p>
        <p className="text-white/50 text-xs mb-3">
          Accès rapide depuis votre écran d&apos;accueil
        </p>
        <button
          onClick={install}
          className="w-full py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-white text-xs font-medium tracking-widest uppercase flex items-center justify-center gap-2 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Installer
        </button>
        <button
          onClick={dismiss}
          className="mt-2 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          Plus tard
        </button>
      </div>
    );
  }

  if (variant === "sidebar-dark") {
    return (
      <div className="mx-3 mb-2 border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-brand-gold" />
            <span className="text-[11px] font-medium text-white/70">Installer l&apos;appli</span>
          </div>
          <button onClick={dismiss} className="text-white/30 hover:text-white/60">
            <X className="w-3 h-3" />
          </button>
        </div>
        <button
          onClick={install}
          className="w-full py-1.5 bg-brand-gold text-white text-[10px] font-medium tracking-wider uppercase flex items-center justify-center gap-1.5"
        >
          <Download className="w-3 h-3" />
          Installer
        </button>
      </div>
    );
  }

  // sidebar-light (default)
  return (
    <div className="mx-3 mb-2 border border-brand-gold/20 bg-brand-cream/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-brand-gold" />
          <span className="text-[11px] font-medium text-brand-deep">Installer l&apos;appli</span>
        </div>
        <button onClick={dismiss} className="text-gray-300 hover:text-gray-500">
          <X className="w-3 h-3" />
        </button>
      </div>
      <button
        onClick={install}
        className="w-full py-1.5 bg-brand-gold text-white text-[10px] font-medium tracking-wider uppercase flex items-center justify-center gap-1.5"
      >
        <Download className="w-3 h-3" />
        Installer
      </button>
    </div>
  );
}
