import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateCode(prefix = "AMB") {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

export function generateContractNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `CAA-${year}-${random}`;
}

export function generateAcknowledgmentNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `RH-${year}-${random}`;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export const TVA_RATE = 0.20;

/** TVA s'applique uniquement aux sociétés assujetties */
export function isAssujettTVA(legalStatus?: string | null) {
  return legalStatus === "SOCIETE";
}

export function commissionTTC(ht: number, legalStatus?: string | null) {
  if (!isAssujettTVA(legalStatus)) return ht; // Particulier/Association = pas de TVA
  return ht * (1 + TVA_RATE);
}

export function commissionTVA(ht: number, legalStatus?: string | null) {
  if (!isAssujettTVA(legalStatus)) return 0;
  return ht * TVA_RATE;
}

export const LEGAL_STATUS_LABELS: Record<string, string> = {
  PARTICULIER: "Particulier",
  SOCIETE: "Société",
  ASSOCIATION: "Association",
};

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  PRIS_EN_CHARGE: "Pris en charge",
  CONTACTE: "Contacté",
  RDV_PLANIFIE: "RDV planifié",
  EN_NEGOCIATION: "En négociation",
  MANDAT_SIGNE: "Mandat signé",
  SOUS_OFFRE: "Sous offre",
  COMPROMIS_SIGNE: "Compromis signé",
  ACTE_SIGNE: "Acte signé",
  RECONNAISSANCE_HONORAIRES: "Reconnaissance d'honoraires",
  COMMISSION_VERSEE: "Commission versée",
  CLOTURE: "Clôturé",
  EN_PAUSE: "En pause",
  PERDU: "Perdu",
  // Legacy compatibility
  EN_COURS: "En cours",
  SIGNE: "Signé",
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NOUVEAU: "bg-blue-100 text-blue-800",
  PRIS_EN_CHARGE: "bg-indigo-100 text-indigo-800",
  CONTACTE: "bg-yellow-100 text-yellow-800",
  RDV_PLANIFIE: "bg-cyan-100 text-cyan-800",
  EN_NEGOCIATION: "bg-orange-100 text-orange-800",
  MANDAT_SIGNE: "bg-violet-100 text-violet-800",
  SOUS_OFFRE: "bg-pink-100 text-pink-800",
  COMPROMIS_SIGNE: "bg-emerald-100 text-emerald-800",
  ACTE_SIGNE: "bg-green-100 text-green-800",
  RECONNAISSANCE_HONORAIRES: "bg-amber-100 text-amber-800",
  COMMISSION_VERSEE: "bg-green-200 text-green-900",
  CLOTURE: "bg-slate-200 text-slate-800",
  EN_PAUSE: "bg-gray-100 text-gray-600",
  PERDU: "bg-red-100 text-red-800",
  // Legacy
  EN_COURS: "bg-orange-100 text-orange-800",
  SIGNE: "bg-green-100 text-green-800",
};

// Ordered steps for timeline display
export const LEAD_STATUS_STEPS = [
  "NOUVEAU",
  "PRIS_EN_CHARGE",
  "CONTACTE",
  "RDV_PLANIFIE",
  "EN_NEGOCIATION",
  "MANDAT_SIGNE",
  "SOUS_OFFRE",
  "COMPROMIS_SIGNE",
  "ACTE_SIGNE",
  "RECONNAISSANCE_HONORAIRES",
  "COMMISSION_VERSEE",
  "CLOTURE",
];

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  SIGNE: "Signé",
  PAYE: "Commission versée",
  ANNULE: "Annulé",
};

export const CONTRACT_STATUS_COLORS: Record<string, string> = {
  BROUILLON: "bg-gray-100 text-gray-800",
  ENVOYE: "bg-blue-100 text-blue-800",
  SIGNE: "bg-green-100 text-green-800",
  PAYE: "bg-emerald-100 text-emerald-800",
  ANNULE: "bg-red-100 text-red-800",
};

export const HONORAIRE_STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente de signature",
  SIGNEE_AMBASSADEUR: "Signée par l'ambassadeur",
  CONTRESIGNEE: "Contresignée",
  VALIDEE: "Validée",
  PAYEE: "Payée",
};

export const HONORAIRE_STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-800",
  SIGNEE_AMBASSADEUR: "bg-blue-100 text-blue-800",
  CONTRESIGNEE: "bg-emerald-100 text-emerald-800",
  VALIDEE: "bg-green-100 text-green-800",
  PAYEE: "bg-green-200 text-green-900",
};

export const LEAD_TYPE_LABELS: Record<string, string> = {
  ACHAT: "Achat",
  VENTE: "Vente",
  LOCATION: "Location",
};
