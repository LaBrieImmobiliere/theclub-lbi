"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

export function PushPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed, not supported, or already subscribed
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const dismissed = localStorage.getItem("push-prompt-dismissed");
    if (dismissed) return;

    // Wait a bit before showing (let the app load first)
    const timer = setTimeout(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
          // Check if permission is not denied
          if (Notification.permission !== "denied") {
            setShow(true);
          }
        }
      } catch {
        // silently fail
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleActivate = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const json = sub.toJSON();
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      setShow(false);
      localStorage.setItem("push-prompt-dismissed", "activated");
    } catch {
      // User denied or error — dismiss
      setShow(false);
      localStorage.setItem("push-prompt-dismissed", "denied");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("push-prompt-dismissed", "later");
    // Will re-ask in 7 days
    localStorage.setItem("push-prompt-dismissed-at", Date.now().toString());
  };

  // Re-show after 7 days if dismissed with "later"
  useEffect(() => {
    const dismissed = localStorage.getItem("push-prompt-dismissed");
    const dismissedAt = localStorage.getItem("push-prompt-dismissed-at");
    if (dismissed === "later" && dismissedAt) {
      const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) {
        localStorage.removeItem("push-prompt-dismissed");
        localStorage.removeItem("push-prompt-dismissed-at");
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[9999] p-4">
      <div className="bg-white w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="bg-[#030A24] px-6 py-5 text-center relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-[#D1B280]/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7 text-[#D1B280]" />
          </div>
          <h3 className="text-white font-bold text-lg">Restez inform&eacute; !</h3>
          <p className="text-white/50 text-xs mt-1">The Club — La Brie Immobili&egrave;re</p>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Activez les notifications pour &ecirc;tre alert&eacute; imm&eacute;diatement d&egrave;s qu&apos;un <strong>nouveau message</strong> ou une <strong>nouvelle recommandation</strong> arrive.
          </p>

          <div className="mt-5 space-y-2">
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full py-3 bg-[#030A24] text-white text-sm font-semibold hover:bg-[#0f1e40] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              {loading ? "Activation..." : "Activer les notifications"}
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
