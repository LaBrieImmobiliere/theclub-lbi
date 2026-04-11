"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

export function PushSubscribeButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      // Check existing subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = async () => {
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
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      setSubscribed(true);
    } catch (err) {
      console.error("Push subscription failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!supported) return null;

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors w-full ${
        subscribed
          ? "border border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
      } disabled:opacity-50`}
    >
      {subscribed ? (
        <>
          <Bell className="w-4 h-4 text-green-500" />
          Notifications activ&eacute;es
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4" />
          {loading ? "Activation..." : "Activer les notifications"}
        </>
      )}
    </button>
  );
}
