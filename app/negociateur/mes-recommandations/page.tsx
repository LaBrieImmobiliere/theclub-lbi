"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronRight, Phone, Mail, MapPin, Euro } from "lucide-react";
import { formatDate, LEAD_TYPE_LABELS } from "@/lib/utils";
import { LeadTimeline } from "@/components/lead-timeline";
import { ConfirmModal } from "@/components/confirm-modal";

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
  { key: "NOUVEAU", label: "Nouveau", color: "bg-blue-500" },
  { key: "PRIS_EN_CHARGE", label: "Pris en charge", color: "bg-indigo-500" },
  { key: "CONTACTE", label: "Contacté", color: "bg-yellow-500" },
  { key: "RDV_PLANIFIE", label: "RDV planifié", color: "bg-cyan-500" },
  { key: "EN_NEGOCIATION", label: "Négociation", color: "bg-orange-500" },
  { key: "MANDAT_SIGNE", label: "Mandat signé", color: "bg-violet-500" },
  { key: "SOUS_OFFRE", label: "Sous offre", color: "bg-pink-500" },
  { key: "COMPROMIS_SIGNE", label: "Compromis", color: "bg-emerald-500" },
  { key: "ACTE_SIGNE", label: "Acte signé", color: "bg-green-500" },
  { key: "RECONNAISSANCE_HONORAIRES", label: "Reco. hon.", color: "bg-amber-500" },
  { key: "COMMISSION_VERSEE", label: "Commission", color: "bg-green-600" },
  { key: "CLOTURE", label: "Clôturé", color: "bg-slate-500" },
];

const STATUS_BADGE: Record<string, string> = {
  NOUVEAU: "bg-blue-50 text-blue-700 border-blue-200",
  PRIS_EN_CHARGE: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CONTACTE: "bg-yellow-50 text-yellow-700 border-yellow-200",
  RDV_PLANIFIE: "bg-cyan-50 text-cyan-700 border-cyan-200",
  EN_NEGOCIATION: "bg-orange-50 text-orange-700 border-orange-200",
  MANDAT_SIGNE: "bg-violet-50 text-violet-700 border-violet-200",
  SOUS_OFFRE: "bg-pink-50 text-pink-700 border-pink-200",
  COMPROMIS_SIGNE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ACTE_SIGNE: "bg-green-50 text-green-700 border-green-200",
  RECONNAISSANCE_HONORAIRES: "bg-amber-50 text-amber-700 border-amber-200",
  COMMISSION_VERSEE: "bg-green-100 text-green-800 border-green-300",
  CLOTURE: "bg-slate-100 text-slate-700 border-slate-300",
  EN_PAUSE: "bg-gray-50 text-gray-500 border-gray-200",
  PERDU: "bg-red-50 text-red-700 border-red-200",
  EN_COURS: "bg-orange-50 text-orange-700 border-orange-200",
  SIGNE: "bg-green-50 text-green-700 border-green-200",
  ANNULE: "bg-gray-50 text-gray-500 border-gray-200",
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
  EN_COURS: "En cours",
  SIGNE: "Signé",
  ANNULE: "Annulé",
};

function StatusTimeline({ status, onStepClick, disabled }: { status: string; onStepClick?: (key: string) => void; disabled?: boolean }) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  const isLost = status === "PERDU" || status === "ANNULE";

  if (isLost) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded">
        <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
        <span className="text-sm text-red-600 font-medium">
          {status === "PERDU" ? "Dossier perdu" : "Dossier annulé"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative pt-1">
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100" />
      <div
        className="absolute top-4 left-4 h-0.5 bg-[#D1B280] transition-all duration-500"
        style={{
          width: currentIndex <= 0
            ? "0%"
            : `${(currentIndex / (STATUS_STEPS.length - 1)) * 100}%`,
        }}
      />
      <div className="relative flex justify-between">
        {STATUS_STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isClickable = onStepClick && !disabled && !isCurrent;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5" style={{ width: "25%" }}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={!isClickable}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? "bg-[#D1B280] border-[#D1B280]"
                    : isCurrent
                    ? "bg-white border-[#D1B280] shadow-sm"
                    : "bg-white border-gray-200"
                } ${isClickable ? "cursor-pointer hover:scale-110 hover:shadow-md" : ""}`}
                title={isClickable ? `Passer en "${step.label}"` : ""}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : isCurrent ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D1B280]" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-200" />
                )}
              </button>
              <span
                className={`text-[10px] text-center leading-tight ${
                  isCurrent ? "text-[#D1B280] font-semibold" : isDone ? "text-gray-500" : "text-gray-300"
                } ${isClickable ? "cursor-pointer" : ""}`}
                onClick={() => isClickable && onStepClick(step.key)}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
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
    if (res.ok) {
      const data = await res.json();
      setLeads(data);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSelectLead = (lead: Lead) => {
    setSelected(lead);
    setNotes(lead.notes || "");
  };

  const requestStatusChange = (newStatus: string) => {
    if (!selected || updatingStatus) return;
    const label = STATUS_LABEL[newStatus] || newStatus;
    setConfirmAction({ status: newStatus, label });
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
        const updatedLead = { ...selected, status: updated.status };
        setSelected(updatedLead);
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? { ...l, status: updated.status } : l)));
      }
    } finally {
      setUpdatingStatus(false);
    }
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
    } finally {
      setSavingNotes(false);
    }
  };

  const filtered = filterStatus === "ALL" ? leads : leads.filter((l) => l.status === filterStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Recommandations
        </h1>
        <p className="text-gray-500 mt-1 text-sm">{leads.length} recommandation{leads.length > 1 ? "s" : ""} au total</p>
      </div>

      {/* Filters — horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {["ALL", "NOUVEAU", "PRIS_EN_CHARGE", "CONTACTE", "RDV_PLANIFIE", "EN_NEGOCIATION", "MANDAT_SIGNE", "SOUS_OFFRE", "COMPROMIS_SIGNE", "ACTE_SIGNE", "RECONNAISSANCE_HONORAIRES", "COMMISSION_VERSEE", "CLOTURE", "EN_PAUSE", "PERDU"].map((s) => {
            const count = s === "ALL" ? leads.length : leads.filter((l) => l.status === s).length;
            const isActive = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#030A24] text-white shadow-sm"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-[#D1B280] hover:text-[#D1B280]"
                }`}
              >
                {s === "ALL" ? "Tous" : STATUS_LABEL[s]}
                <span className={`text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"} rounded-full px-1.5 py-0.5 min-w-[20px] text-center`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}>
        {/* Lead list */}
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              Aucune recommandation{filterStatus !== "ALL" ? " dans ce statut" : ""}.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  className={`w-full text-left px-5 py-4 hover:bg-gray-50/70 transition-colors flex items-center justify-between gap-3 ${
                    selected?.id === lead.id ? "bg-[#030A24]/[0.03] border-l-2 border-[#D1B280]" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium border ${STATUS_BADGE[lead.status]}`}>
                        {STATUS_LABEL[lead.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {lead.ambassador.user.name} &middot; {LEAD_TYPE_LABELS[lead.type] || lead.type} &middot; {formatDate(lead.createdAt)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{selected.firstName} {selected.lastName}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Ambassadeur : <span className="font-medium text-gray-600">{selected.ambassador.user.name}</span>
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-300 hover:text-gray-500 transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#030A24]">
                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {selected.phone}
                </a>
                {selected.email && (
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#030A24] truncate">
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{selected.email}</span>
                  </a>
                )}
                {selected.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {selected.location}
                  </div>
                )}
                {selected.budget && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Euro className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {selected.budget}
                  </div>
                )}
              </div>

              {selected.description && (
                <div className="bg-gray-50 px-4 py-3 text-sm text-gray-700 leading-relaxed border border-gray-100">
                  {selected.description}
                </div>
              )}

              {/* Timeline - clickable */}
              <div>
                <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Avancement</p>
                <p className="text-[10px] text-gray-300 mb-3">Cliquez sur une étape pour avancer ou reculer</p>
                <StatusTimeline status={selected.status} onStepClick={requestStatusChange} disabled={updatingStatus} />
              </div>

              {/* Quick action buttons */}
              {selected.status !== "SIGNE" && selected.status !== "PERDU" && selected.status !== "ANNULE" && selected.status !== "CLOTURE" && (
                <div className="flex flex-wrap gap-2">
                    {selected.status === "COMMISSION_VERSEE" && (
                      <button
                        onClick={() => requestStatusChange("CLOTURE")}
                        disabled={updatingStatus}
                        className="px-3 py-1.5 text-xs font-medium border border-slate-400 text-slate-600 bg-slate-50 hover:bg-slate-100 hover:border-slate-500 transition-colors disabled:opacity-50"
                      >
                        ✅ Clore le dossier
                      </button>
                    )}
                    <button
                      onClick={() => requestStatusChange("EN_PAUSE")}
                      disabled={updatingStatus || selected.status === "EN_PAUSE"}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                    >
                      ⏸ En pause
                    </button>
                    <button
                      onClick={() => requestStatusChange("PERDU")}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      ✕ Perdu
                    </button>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Notes internes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajouter des notes sur ce prospect..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#D1B280] resize-none"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes || notes === (selected.notes || "")}
                  className="mt-2 px-4 py-1.5 bg-[#030A24] text-white text-xs font-medium hover:bg-[#0f1e40] disabled:opacity-40 transition-colors"
                >
                  {savingNotes ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>

              {/* Dates */}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
                Recommandé le {formatDate(selected.createdAt)}
                {selected.contract && (
                  <span className="ml-2">&middot; Contrat : <span className="font-mono text-gray-600">{selected.contract.number}</span></span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm status change modal */}
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
