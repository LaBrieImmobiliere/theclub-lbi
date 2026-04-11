"use client";

import { Check, Pause, XCircle } from "lucide-react";

const STEPS = [
  { key: "NOUVEAU", label: "Nouveau", emoji: "\uD83D\uDCE9", desc: "Recommandation soumise" },
  { key: "PRIS_EN_CHARGE", label: "Pris en charge", emoji: "\uD83D\uDC64", desc: "Un négociateur s'en occupe" },
  { key: "CONTACTE", label: "Contacté", emoji: "\uD83D\uDCDE", desc: "Le prospect a été contacté" },
  { key: "RDV_PLANIFIE", label: "RDV planifié", emoji: "\uD83D\uDCC5", desc: "Visite ou estimation programmée" },
  { key: "EN_NEGOCIATION", label: "En négociation", emoji: "\uD83E\uDD1D", desc: "Offre et négociation en cours" },
  { key: "MANDAT_SIGNE", label: "Mandat signé", emoji: "\u270D\uFE0F", desc: "Le mandat de vente est signé" },
  { key: "SOUS_OFFRE", label: "Sous offre", emoji: "\uD83D\uDCB0", desc: "Une offre a été acceptée" },
  { key: "COMPROMIS_SIGNE", label: "Compromis signé", emoji: "\uD83C\uDF89", desc: "Le compromis est signé !" },
  { key: "ACTE_SIGNE", label: "Acte signé", emoji: "\uD83C\uDFE0", desc: "Passage chez le notaire effectué" },
  { key: "COMMISSION_VERSEE", label: "Commission versée", emoji: "\uD83D\uDCB8", desc: "Votre commission a été payée !" },
];

// Legacy mapping
const LEGACY_MAP: Record<string, string> = {
  EN_COURS: "EN_NEGOCIATION",
  SIGNE: "COMPROMIS_SIGNE",
};

interface StatusHistoryEntry {
  id: string;
  toStatus: string;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
}

interface LeadTimelineProps {
  status: string;
  history?: StatusHistoryEntry[];
  compact?: boolean;
}

export function LeadTimeline({ status, history, compact }: LeadTimelineProps) {
  const normalizedStatus = LEGACY_MAP[status] || status;
  const isLost = normalizedStatus === "PERDU";
  const isPaused = normalizedStatus === "EN_PAUSE";
  const currentIndex = STEPS.findIndex((s) => s.key === normalizedStatus);

  if (isLost) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Dossier perdu</p>
          <p className="text-xs text-red-500">Le prospect n&apos;est plus int&eacute;ress&eacute;</p>
        </div>
      </div>
    );
  }

  if (isPaused) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200">
        <Pause className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-700">Dossier en pause</p>
          <p className="text-xs text-gray-500">Temporairement suspendu</p>
        </div>
      </div>
    );
  }

  // Build history map: status -> date
  const historyMap = new Map<string, string>();
  if (history) {
    for (const h of history) {
      historyMap.set(h.toStatus, h.createdAt);
    }
  }

  // Build notes map
  const notesMap = new Map<string, { note: string; by: string }>();
  if (history) {
    for (const h of history) {
      if (h.note) {
        notesMap.set(h.toStatus, { note: h.note, by: h.changedBy || "Système" });
      }
    }
  }

  return (
    <div className="space-y-0">
      <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
        Suivi du dossier
      </p>

      <div className="relative">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;
          const date = historyMap.get(step.key);
          const noteData = notesMap.get(step.key);

          if (compact && isFuture && i > currentIndex + 1) return null;

          return (
            <div key={step.key} className="flex gap-3 relative">
              {/* Vertical line */}
              {i < STEPS.length - 1 && !(compact && i >= currentIndex) && (
                <div className={`absolute left-[15px] top-[32px] w-0.5 ${isDone ? "bg-[#D1B280]" : "bg-gray-200"}`}
                  style={{ height: noteData && isDone ? 80 : 40 }} />
              )}

              {/* Circle */}
              <div className="flex-shrink-0 pt-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isDone ? "bg-[#D1B280] border-[#D1B280]" :
                  isCurrent ? "bg-white border-[#D1B280] shadow-md shadow-[#D1B280]/20" :
                  "bg-white border-gray-200"
                }`}>
                  {isDone ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : isCurrent ? (
                    <span className="text-sm">{step.emoji}</span>
                  ) : (
                    <span className="text-xs text-gray-300">{i + 1}</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className={`flex-1 pb-4 ${isFuture ? "opacity-40" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${isCurrent ? "text-[#D1B280]" : isDone ? "text-gray-900" : "text-gray-400"}`}>
                      {compact ? "" : `\u00C9tape ${i + 1} · `}{step.label}
                    </p>
                    {isCurrent && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-[#D1B280]/20 text-[#D1B280] rounded-full">
                        En cours
                      </span>
                    )}
                  </div>
                  {date && (
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
                {!compact && (
                  <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                )}

                {/* Comment/note */}
                {noteData && (isDone || isCurrent) && (
                  <div className="mt-2 bg-gray-50 border-l-2 border-[#D1B280] px-3 py-2">
                    <p className="text-xs text-gray-600 italic">{noteData.note}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{noteData.by}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
