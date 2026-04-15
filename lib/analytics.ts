/**
 * Wrapper léger autour de Vercel Analytics (custom events).
 *
 * Utilisation :
 *   import { trackEvent } from "@/lib/analytics";
 *   trackEvent("lead_created", { type: "ACHAT", hasDescription: true });
 *
 * Les events apparaissent dans Vercel Dashboard > Analytics > Custom Events
 * et permettent de mesurer les conversions clés du business.
 */

import { track } from "@vercel/analytics";

type EventName =
  | "lead_created"               // ambassadeur soumet une recommandation
  | "lead_converted"             // statut passe à VALIDE côté négociateur
  | "contract_signed"            // ambassadeur signe le contrat d'apporteur
  | "acknowledgment_signed"      // ambassadeur signe une reconnaissance d'honoraires
  | "commission_paid"            // paiement commission confirmé côté admin
  | "user_onboarded"             // ambassadeur termine l'onboarding
  | "pwa_installed"              // installation PWA détectée
  | "share_link_used";           // partage du lien de parrainage

type EventProperties = Record<string, string | number | boolean | null>;

export function trackEvent(name: EventName, properties?: EventProperties): void {
  if (typeof window === "undefined") return;
  try {
    track(name, properties);
  } catch {
    // silently ignore — analytics ne doit jamais casser l'UX
  }
}
