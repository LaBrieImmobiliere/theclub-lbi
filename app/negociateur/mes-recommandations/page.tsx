"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronRight, Phone, Mail, MapPin, Euro } from "lucide-react";
import { formatDate, LEAD_TYPE_LABELS } from "@/lib/utils";

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
  { key: "CONTACTE", label: "Contacté", color: "bg-yellow-500" },
  { key: "EN_COURS", label: "En cours", color: "bg-orange-500" },
  { key: "SIGNE", label: "Signé", color: "bg-green-500" },
];

const STATUS_BADGE: Record<string, string> = {
  NOUVEAU: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTE: "bg-yellow-50 text-yellow-700 border-yellow-200",
  EN_COURS: "bg-orange-50 text-orange-700 border-orange-200",
  SIGNE: "bg-green-50 text-green-700 border-green-200",
  PERDU: "bg-red-50 text-red-700 border-red-200",
  ANNULE: "bg-gray-50 text-gray-500 border-gray-200",
};

const STATUS_LABEL: Record<string, string> = {
  NOUVEAU: "Nouveau",
  CONTACTE: "Contacté",
  EN_COURS: "En cours",
  SIGNE: "Signé",
  PERDU: "Perdu",
  ANNULE: "Annulé",
};

function StatusTimeline({ status }: { status: string }) {
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
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5" style={{ width: "25%" }}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? "bg-[#D1B280] border-[#D1B280]"
                    : isCurrent
                    ? "bg-white border-[#D1B280] shadow-sm"
                    : "bg-white border-gray-200"
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : isCurrent ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D1B280]" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-200" />
                )}
              </div>
              <span
                className={`text-[10px] text-center leading-tight ${
                  isCurrent ? "text-[#D1B280] font-semibold" : isDone ? "text-gray-500" : "text-gray-300"
                }`}
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

  const handleStatusChange = async (newStatus: string) => {
    if (!selected || updatingStatus) return;
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "NOUVEAU", "CONTACTE", "EN_COURS", "SIGNE", "PERDU"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 text-xs font-medium border transition-colors ${
              filterStatus === s
                ? "bg-[#030A24] text-white border-[#030A24]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            {s === "ALL" ? "Tous" : STATUS_LABEL[s]}
            {s !== "ALL" && (
              <span className="ml-1.5 opacity-60">
                {leads.filter((l) => l.status === s).length}
              </span>
            )}
          </button>
        ))}
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

              {/* Timeline */}
              <div>
                <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Avancement</p>
                <StatusTimeline status={selected.status} />
              </div>

              {/* Status change buttons */}
              {selected.status !== "SIGNE" && selected.status !== "PERDU" && selected.status !== "ANNULE" && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Mettre à jour le statut</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_STEPS.filter((s) => s.key !== selected.status).map((step) => (
                      <button
                        key={step.key}
                        onClick={() => handleStatusChange(step.key)}
                        disabled={updatingStatus}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 hover:border-[#D1B280] hover:text-[#D1B280] transition-colors disabled:opacity-50"
                      >
                        → {step.label}
                      </button>
                    ))}
                    <button
                      onClick={() => handleStatusChange("PERDU")}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      → Perdu
                    </button>
                  </div>
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
    </div>
  );
}
