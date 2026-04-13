"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Phone, Mail, MapPin, Euro, Home, Building, Key, ArrowLeft, ChevronRight } from "lucide-react";
import { formatDate, LEAD_TYPE_LABELS } from "@/lib/utils";
import { LeadTimeline } from "@/components/lead-timeline";
import { ConfirmModal } from "@/components/confirm-modal";
import { PullToRefresh } from "@/components/pull-to-refresh";

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  type: string;
  description?: string;
  budget?: string;
  location?: string;
  status: string;
  notes?: string;
  createdAt: string;
  ambassador: { user: { name: string | null; email: string } };
  contract?: { id: string; number: string; status: string } | null;
};

const STATUS_STEPS = [
  { key: "NOUVEAU", label: "Nouveau" },
  { key: "PRIS_EN_CHARGE", label: "Pris en charge" },
  { key: "CONTACTE", label: "Contacté" },
  { key: "RDV_PLANIFIE", label: "RDV planifié" },
  { key: "EN_NEGOCIATION", label: "Négociation" },
  { key: "MANDAT_SIGNE", label: "Mandat signé" },
  { key: "SOUS_OFFRE", label: "Sous offre" },
  { key: "COMPROMIS_SIGNE", label: "Compromis" },
  { key: "ACTE_SIGNE", label: "Acte signé" },
  { key: "RECONNAISSANCE_HONORAIRES", label: "Reco. hon." },
  { key: "COMMISSION_VERSEE", label: "Commission" },
  { key: "CLOTURE", label: "Clôturé" },
];

const STATUS_DOT: Record<string, string> = {
  NOUVEAU: "bg-blue-400",
  PRIS_EN_CHARGE: "bg-indigo-400",
  CONTACTE: "bg-yellow-400",
  RDV_PLANIFIE: "bg-cyan-400",
  EN_NEGOCIATION: "bg-orange-400",
  MANDAT_SIGNE: "bg-violet-400",
  SOUS_OFFRE: "bg-pink-400",
  COMPROMIS_SIGNE: "bg-emerald-400",
  ACTE_SIGNE: "bg-green-400",
  RECONNAISSANCE_HONORAIRES: "bg-amber-400",
  COMMISSION_VERSEE: "bg-green-500",
  CLOTURE: "bg-slate-400",
  EN_PAUSE: "bg-gray-400",
  PERDU: "bg-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  NOUVEAU: "Nouveau",
  PRIS_EN_CHARGE: "Pris en charge",
  CONTACTE: "Contacté",
  RDV_PLANIFIE: "RDV planifié",
  EN_NEGOCIATION: "Négociation",
  MANDAT_SIGNE: "Mandat signé",
  SOUS_OFFRE: "Sous offre",
  COMPROMIS_SIGNE: "Compromis signé",
  ACTE_SIGNE: "Acte signé",
  RECONNAISSANCE_HONORAIRES: "Reco. honoraires",
  COMMISSION_VERSEE: "Commission versée",
  CLOTURE: "Clôturé",
  EN_PAUSE: "En pause",
  PERDU: "Perdu",
};

const TYPE_ICON: Record<string, typeof Home> = {
  ACHAT: Home,
  VENTE: Building,
  LOCATION: Key,
};

function StatusTimeline({ status, onStepClick, disabled }: { status: string; onStepClick?: (key: string) => void; disabled?: boolean }) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  if (status === "PERDU" || status === "ANNULE") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="text-sm text-red-400 font-medium">{status === "PERDU" ? "Dossier perdu" : "Dossier annulé"}</span>
      </div>
    );
  }
  if (status === "EN_PAUSE") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
        <span className="text-sm text-gray-400 font-medium">Dossier en pause</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {STATUS_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;
        const isClickable = onStepClick && !disabled && !isCurrent;
        if (isFuture && i > currentIndex + 2) return null;
        return (
          <button
            key={step.key}
            type="button"
            onClick={() => isClickable && onStepClick(step.key)}
            disabled={!isClickable}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
              isCurrent ? "bg-[#D1B280]/10 border border-[#D1B280]/30" :
              isDone ? "opacity-70" :
              "opacity-30"
            } ${isClickable ? "hover:bg-[#D1B280]/10 cursor-pointer" : ""}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
              isDone ? "bg-[#D1B280] border-[#D1B280]" :
              isCurrent ? "border-[#D1B280] bg-transparent" :
              "border-gray-600 bg-transparent"
            }`}>
              {isDone ? <Check className="w-3.5 h-3.5 text-white" /> :
               <span className="text-[10px] text-gray-400 font-medium">{i + 1}</span>}
            </div>
            <span className={`text-sm ${isCurrent ? "text-[#D1B280] font-semibold" : isDone ? "text-gray-400" : "text-gray-500"}`}>
              {step.label}
            </span>
            {isCurrent && <span className="ml-auto text-[10px] bg-[#D1B280]/20 text-[#D1B280] px-2 py-0.5 rounded-full font-medium">En cours</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function NegociateurRecommandationsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [confirmAction, setConfirmAction] = useState<{ status: string; label: string } | null>(null);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/recommandations?role=negotiator");
    if (res.ok) setLeads(await res.json());
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleSelectLead = (lead: Lead) => {
    setSelected(lead);
    setNotes(lead.notes || "");
  };

  const requestStatusChange = (newStatus: string) => {
    if (!selected || updatingStatus) return;
    setConfirmAction({ status: newStatus, label: STATUS_LABEL[newStatus] || newStatus });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selected || updatingStatus) return;
    setConfirmAction(null);
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/recommandations/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelected({ ...selected, status: updated.status });
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? { ...l, status: updated.status } : l)));
      }
    } finally { setUpdatingStatus(false); }
  };

  const handleSaveNotes = async () => {
    if (!selected || savingNotes) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/recommandations/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === selected.id ? { ...l, notes } : l)));
        setSelected((prev) => prev ? { ...prev, notes } : prev);
      }
    } finally { setSavingNotes(false); }
  };

  const filtered = filterStatus === "ALL" ? leads : leads.filter((l) => l.status === filterStatus);

  // ─── DETAIL VIEW (full page on mobile) ─────────────────────────
  if (selected) {
    const statusIdx = STATUS_STEPS.findIndex(s => s.key === selected.status);
    const progress = statusIdx >= 0 ? Math.round(((statusIdx + 1) / STATUS_STEPS.length) * 100) : 0;
    const TypeIcon = TYPE_ICON[selected.type] || Home;

    return (
      <div className="space-y-4 animate-in">
        {/* Back button */}
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors min-h-[44px]">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>

        {/* Header card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#D1B280]/20 flex items-center justify-center">
                <span className="text-[#D1B280] text-lg font-bold">{selected.firstName[0]}{selected.lastName[0]}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{selected.firstName} {selected.lastName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${STATUS_DOT[selected.status] || "bg-gray-400"}`} />
                  <span className="text-sm text-gray-400">{STATUS_LABEL[selected.status]}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
              <TypeIcon className="w-3.5 h-3.5 text-[#D1B280]" />
              <span className="text-xs text-gray-300">{LEAD_TYPE_LABELS[selected.type] || selected.type}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Progression</span>
              <span className="text-[#D1B280] font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #D1B280, #b89a65)" }} />
            </div>
          </div>

          {/* Contact buttons */}
          <div className="flex gap-2">
            <a href={`tel:${selected.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-[#D1B280] text-[#030A24] py-2.5 rounded-lg font-medium text-sm min-h-[44px]">
              <Phone className="w-4 h-4" /> Appeler
            </a>
            {selected.email && (
              <a href={`mailto:${selected.email}`} className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white py-2.5 rounded-lg font-medium text-sm min-h-[44px]">
                <Mail className="w-4 h-4" /> Email
              </a>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          {selected.location && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 col-span-2">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <MapPin className="w-3 h-3" /> Localisation
              </div>
              <p className="text-sm text-white">{selected.location}</p>
            </div>
          )}
          {selected.budget && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Euro className="w-3 h-3" /> Budget
              </div>
              <p className="text-sm text-white font-medium">{selected.budget}</p>
            </div>
          )}
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Ambassadeur</p>
            <p className="text-sm text-white">{selected.ambassador.user.name}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Date</p>
            <p className="text-sm text-white">{formatDate(selected.createdAt)}</p>
          </div>
          {selected.contract && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Contrat</p>
              <p className="text-sm text-[#D1B280] font-mono">{selected.contract.number}</p>
            </div>
          )}
        </div>

        {selected.description && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-2">Description</p>
            <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Avancement</p>
          <StatusTimeline status={selected.status} onStepClick={requestStatusChange} disabled={updatingStatus} />
        </div>

        {/* Action buttons */}
        {!["PERDU", "ANNULE", "CLOTURE"].includes(selected.status) && (
          <div className="flex gap-2">
            {selected.status === "COMMISSION_VERSEE" && (
              <button onClick={() => requestStatusChange("CLOTURE")} disabled={updatingStatus}
                className="flex-1 min-h-[44px] text-sm font-medium rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors disabled:opacity-50">
                ✅ Clore le dossier
              </button>
            )}
            <button onClick={() => requestStatusChange("EN_PAUSE")} disabled={updatingStatus || selected.status === "EN_PAUSE"}
              className="min-h-[44px] px-4 text-sm font-medium rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors disabled:opacity-50">
              ⏸ Pause
            </button>
            <button onClick={() => requestStatusChange("PERDU")} disabled={updatingStatus}
              className="min-h-[44px] px-4 text-sm font-medium rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
              ✕ Perdu
            </button>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Notes internes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ajouter des notes sur ce prospect..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D1B280] resize-none"
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes || notes === (selected.notes || "")}
            className="mt-2 w-full min-h-[44px] bg-[#030A24] border border-[#D1B280]/30 text-[#D1B280] text-sm font-medium rounded-lg hover:bg-[#D1B280]/10 disabled:opacity-40 transition-colors"
          >
            {savingNotes ? "Enregistrement..." : "Enregistrer les notes"}
          </button>
        </div>

        <ConfirmModal
          open={!!confirmAction}
          title="Changer le statut"
          message={confirmAction ? `Passer cette recommandation en « ${confirmAction.label} » ?` : ""}
          confirmLabel="Confirmer"
          cancelLabel="Annuler"
          variant={confirmAction?.status === "PERDU" ? "danger" : "default"}
          onConfirm={() => confirmAction && handleStatusChange(confirmAction.status)}
          onCancel={() => setConfirmAction(null)}
        />
      </div>
    );
  }

  // ─── LIST VIEW ──────────────────────────────────────────────────
  return (
    <PullToRefresh onRefresh={fetchLeads}>
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Recommandations
        </h1>
        <p className="text-gray-400 mt-1 text-sm">{leads.length} recommandation{leads.length > 1 ? "s" : ""}</p>
      </div>

      {/* Filters */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {["ALL", "NOUVEAU", "PRIS_EN_CHARGE", "CONTACTE", "RDV_PLANIFIE", "EN_NEGOCIATION", "MANDAT_SIGNE", "SOUS_OFFRE", "COMPROMIS_SIGNE", "ACTE_SIGNE", "RECONNAISSANCE_HONORAIRES", "COMMISSION_VERSEE", "CLOTURE", "EN_PAUSE", "PERDU"].map((s) => {
            const count = s === "ALL" ? leads.length : leads.filter((l) => l.status === s).length;
            const isActive = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#D1B280] text-[#030A24] shadow-sm"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:border-[#D1B280] hover:text-[#D1B280]"
                }`}
              >
                {s === "ALL" ? "Tous" : STATUS_LABEL[s]}
                {count > 0 && (
                  <span className={`text-[10px] ${isActive ? "bg-[#030A24]/30 text-[#030A24]" : "bg-white/10 text-gray-500"} rounded-full px-1.5 py-0.5 min-w-[20px] text-center`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-16 text-center">
            <p className="text-gray-400 text-sm">Aucune recommandation{filterStatus !== "ALL" ? " dans ce statut" : ""}</p>
          </div>
        ) : (
          filtered.map((lead) => {
            const statusIdx = STATUS_STEPS.findIndex(s => s.key === lead.status);
            const progress = statusIdx >= 0 ? Math.round(((statusIdx + 1) / STATUS_STEPS.length) * 100) : 0;
            const TypeIcon = TYPE_ICON[lead.type] || Home;

            return (
              <button
                key={lead.id}
                onClick={() => handleSelectLead(lead)}
                className="w-full text-left bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all hover:bg-white/[0.07] hover:border-white/20 active:scale-[0.99]"
              >
                {/* Segmented progress bar (like mareco) */}
                <div className="flex gap-0.5 px-4 pt-4">
                  {STATUS_STEPS.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= statusIdx ? "bg-[#D1B280]" : "bg-white/10"}`} />
                  ))}
                </div>

                <div className="p-4 pt-3">
                  {/* Top row: date + type */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-gray-500">{formatDate(lead.createdAt)}</span>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <TypeIcon className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{LEAD_TYPE_LABELS[lead.type] || lead.type}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="inline-flex items-center gap-1.5 bg-[#D1B280]/10 px-2.5 py-1 rounded-full mb-3">
                    <div className={`w-2 h-2 rounded-full ${STATUS_DOT[lead.status] || "bg-gray-400"}`} />
                    <span className="text-xs font-semibold text-[#D1B280]">{STATUS_LABEL[lead.status]}</span>
                  </div>

                  {/* Location */}
                  {lead.location && (
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-300">{lead.location}</p>
                    </div>
                  )}

                  {/* Contact row: name + actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-white truncate">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Ambassadeur : {lead.ambassador.user.name}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-3">
                      <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 rounded-full border border-[#D1B280]/30 flex items-center justify-center hover:bg-[#D1B280]/10 transition-colors">
                        <Phone className="w-4 h-4 text-[#D1B280]" />
                      </a>
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()}
                          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                          <Mail className="w-4 h-4 text-gray-400" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}
