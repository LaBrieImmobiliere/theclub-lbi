// Conseillers La Brie Immobilière, tels qu'ils apparaissent dans Modelo InTouch.
// Sert aux liens des emails Modelo, qui ne connaissent que {{user.email}} :
// photo de la signature (numéro de négociateur Netty) et lien d'avis Google
// de l'agence du conseiller.

export type AgenceLBI = "villecresnes" | "brie-comte-robert";

export const CONSEILLERS_MODELO: Record<string, { netty: string; agence: AgenceLBI }> = {
  "alexandre.brites@labrieimmobiliere.fr": { netty: "001", agence: "brie-comte-robert" },
  "luis.brites@labrieimmobiliere.fr": { netty: "108", agence: "villecresnes" },
  "maria.brites@labrieimmobiliere.fr": { netty: "112", agence: "villecresnes" },
  "theo.indrigo@labrieimmobiliere.fr": { netty: "140", agence: "brie-comte-robert" },
  "maeva.brouard@labrieimmobiliere.fr": { netty: "152", agence: "villecresnes" },
  "matteo.kpakpo@labrieimmobiliere.fr": { netty: "154", agence: "brie-comte-robert" },
  "baptiste.diponio@labrieimmobiliere.fr": { netty: "156", agence: "villecresnes" },
  "elisa.savart@labrieimmobiliere.fr": { netty: "158", agence: "villecresnes" },
  "lea.gaucher@labrieimmobiliere.fr": { netty: "159", agence: "brie-comte-robert" },
};

// Fiches Google Business Profile (place_id) de chaque agence
export const AVIS_GOOGLE: Record<AgenceLBI, string> = {
  // 41 av. du Maréchal de Lattre de Tassigny, Villecresnes
  villecresnes: "ChIJacT35SsK5kcRGK7290f7dz8",
  // 19 rue du Général Leclerc, Brie-Comte-Robert
  "brie-comte-robert": "ChIJO_YbBSwJ5kcR_qd5WcU9bFo",
};

export function conseillerModelo(email: string | null | undefined) {
  return CONSEILLERS_MODELO[(email ?? "").trim().toLowerCase()];
}
