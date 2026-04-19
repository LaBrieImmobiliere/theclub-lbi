"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker et gère les mises à jour automatiques.
 *
 * Quand un nouveau SW est détecté :
 *   1. On attend qu'il soit `installed` (téléchargé et prêt).
 *   2. On lui envoie `SKIP_WAITING` pour qu'il prenne le contrôle
 *      sans attendre que toutes les pages ferment.
 *   3. Dès qu'il devient contrôleur (événement `controllerchange`),
 *      on recharge la page pour qu'elle utilise le nouveau SW.
 *
 * Ça élimine le scénario "SW corrompu coincé après un déploiement".
 */
export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Si un worker est déjà en attente au démarrage → on l'active
      if (reg.waiting && navigator.serviceWorker.controller) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // Nouveau SW prêt + ancien SW encore actif → on bascule
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      // Check périodique (toutes les 60s) pour détecter les mises à jour
      // sans attendre la visite suivante de l'utilisateur.
      setInterval(() => reg.update().catch(() => {}), 60_000);
    }).catch(() => { /* ignore */ });
  }, []);

  return null;
}
