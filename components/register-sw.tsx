"use client";

import { useEffect } from "react";

// Version tag côté client. Bumper pour forcer un reset propre du SW chez
// tous les utilisateurs ayant la version précédente.
const SW_VERSION_TAG = "v8-clean";

/**
 * Enregistre le service worker et guérit les installations corrompues.
 *
 * Les anciens SW (<= v7) cachaient leur propre fichier /sw.js via le pattern
 * `.js$`, ce qui empêchait le navigateur de les mettre à jour : chaque check
 * retournait la vieille version depuis le cache, bloquant l'app dans un état
 * cassé après chaque déploiement Vercel.
 *
 * Solution :
 *   1. Au premier chargement avec cette version, on désinscrit TOUS les SW
 *      existants et on vide TOUS les caches.
 *   2. Un flag localStorage garantit que ce cleanup ne s'exécute qu'une fois.
 *   3. Puis on enregistre le SW v8 (pass-through minimal, sans self-caching).
 *   4. On écoute les mises à jour futures et on recharge auto.
 */
export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const alreadyCleaned = localStorage.getItem("sw_version") === SW_VERSION_TAG;

    const register = () => {
      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });

      navigator.serviceWorker.register("/sw.js").then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
        setInterval(() => reg.update().catch(() => {}), 60_000);
      }).catch(() => { /* ignore */ });
    };

    if (alreadyCleaned) {
      register();
      return;
    }

    // Premier passage avec v8 : on nettoie tout l'existant avant de continuer.
    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        localStorage.setItem("sw_version", SW_VERSION_TAG);
        // Un seul reload suffit : au prochain chargement le SW v8 s'enregistre.
        window.location.reload();
      } catch {
        // Si le cleanup échoue, on tente quand même l'enregistrement
        localStorage.setItem("sw_version", SW_VERSION_TAG);
        register();
      }
    })();
  }, []);

  return null;
}
