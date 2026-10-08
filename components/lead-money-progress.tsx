"use client";

/**
 * Barre de progression "où en est mon argent" — version ambassadeur ultra-simplifiée.
 * Agrège les 12 statuts internes en 5 jalons grand public :
 * 1. Contact reçu  2. Rendez-vous  3. Mandat signé  4. Vente signée  5. Vous êtes payé
 */

import { Check, Mail, Phone, PenLine, Home, Euro, XCircle, Pause } from "lucide-react";

const MILESTONES = [
  { key: "RECEIVED", label: "Contact reçu", short: "Contact", icon: Mail },
  { key: "APPOINTED", label: "Rendez-vous pris", short: "RDV", icon: Phone },
  { key: "MANDATE", label: "Mandat signé", short: "Mandat", icon: PenLine },
  { key: "SOLD", label: "Vente signée", short: "Vente", icon: Home },
  { key: "PAID", label: "Vous êtes payé", short: "Payé", icon: Euro },
] as const;

// Mapping des statuts internes vers les 5 jalons grand public
function statusToMilestoneIndex(status: string): number {
  switch (status) {
    case "NOUVEAU":
    case "PRIS_EN_CHARGE":
      return 0; // Contact reçu
    case "CONTACTE":
    case "RDV_PLANIFIE":
    case "EN_NEGOCIATION":
      return 1; // RDV
    case "MANDAT_SIGNE":
    case "SOUS_OFFRE":
      return 2; // Mandat
    case "COMPROMIS_SIGNE":
    case "ACTE_SIGNE":
    case "SIGNE":
      return 3; // Vente
    case "RECONNAISSANCE_HONORAIRES":
      return 3; // Vente conclue, en attente paiement
    case "COMMISSION_VERSEE":
    case "PAYE":
    case "CLOTURE":
      return 4; // Payé
    default:
      return 0;
  }
}

interface Props {
  status: string;
  /** Si true: version mini pour les cartes récap (sans libellés) */
  compact?: boolean;
}

export function LeadMoneyProgress({ status, compact = false }: Props) {
  if (status === "PERDU") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded">
        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <span className="text-xs font-medium text-red-700">Perdu</span>
      </div>
    );
  }
  if (status === "EN_PAUSE") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded">
        <Pause className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="text-xs font-medium text-gray-700">En pause</span>
      </div>
    );
  }

  const currentIdx = statusToMilestoneIndex(status);
  const isCommissionPaid = currentIdx === 4;

  if (compact) {
    // Mini barre horizontale pour cartes
    return (
      <div className="flex items-center gap-1">
        {MILESTONES.map((m, i) => {
          const done = i < currentIdx;
          const current = i === currentIdx;
          return (
            <div
              key={m.key}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                done || current
                  ? isCommissionPaid
                    ? "bg-green-500"
                    : current
                    ? "bg-[#D1B280]"
                    : "bg-[#D1B280]/60"
                  : "bg-gray-200"
              }`}
              title={m.label}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Steps */}
      <div className="relative flex items-start justify-between gap-1">
        {MILESTONES.map((m, i) => {
          const done = i < currentIdx;
          const current = i === currentIdx;
          const Icon = done ? Check : m.icon;
          return (
            <div
              key={m.key}
              className="flex flex-col items-center flex-1 relative"
            >
              {/* Connector line (except last) */}
              {i < MILESTONES.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 ${
                    done ? "bg-[#D1B280]" : "bg-gray-200"
                  }`}
                  style={{ transform: "translateX(50%)" }}
                />
              )}

              {/* Dot */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  done
                    ? "bg-[#D1B280] border-[#D1B280]"
                    : current
                    ? isCommissionPaid
                      ? "bg-green-500 border-green-500"
                      : "bg-white border-[#D1B280] ring-4 ring-[#D1B280]/15"
                    : "bg-white border-gray-200"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    done ? "text-white" : current ? isCommissionPaid ? "text-white" : "text-[#D1B280]" : "text-gray-300"
                  }`}
                />
              </div>

              {/* Label */}
              <p
                className={`text-[10px] sm:text-xs mt-2 text-center font-medium leading-tight ${
                  done
                    ? "text-gray-700"
                    : current
                    ? isCommissionPaid
                      ? "text-green-700"
                      : "text-[#D1B280]"
                    : "text-gray-400"
                }`}
              >
                <span className="hidden sm:inline">{m.label}</span>
                <span className="sm:hidden">{m.short}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Current step hint */}
      {!isCommissionPaid && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          <span className="font-medium text-gray-700">
            {MILESTONES[currentIdx].label}
          </span>{" "}
          — {currentIdx < MILESTONES.length - 1
            ? `prochaine étape : ${MILESTONES[currentIdx + 1].label.toLowerCase()}.`
            : "dernière étape avant versement."}
        </p>
      )}
      {isCommissionPaid && (
        <p className="text-xs text-green-700 mt-3 text-center font-medium">
          🎉 Votre gain a été versé — merci pour cette recommandation !
        </p>
      )}
    </div>
  );
}
