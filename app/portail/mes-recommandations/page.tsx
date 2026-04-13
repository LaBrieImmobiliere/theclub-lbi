"use client";

import { useState, useEffect, useCallback } from "react";
import { Phone, Mail, MapPin, Euro, Home, Building, Key, ArrowLeft, Plus, ClipboardList } from "lucide-react";
import { formatDate, LEAD_STATUS_LABELS, LEAD_TYPE_LABELS } from "@/lib/utils";
import { LeadTimeline } from "@/components/lead-timeline";
import Link from "next/link";
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
  createdAt: string;
  contract?: { id: string; number: string } | null;
  statusHistory?: { id: string; toStatus: string; changedBy: string | null; note: string | null; createdAt: string }[];
};

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

const TYPE_ICON: Record<string, typeof Home> = {
  ACHAT: Home,
  VENTE: Building,
  LOCATION: Key,
};

const STEPS = [
  "NOUVEAU", "PRIS_EN_CHARGE", "CONTACTE", "RDV_PLANIFIE", "EN_NEGOCIATION",
  "MANDAT_SIGNE", "SOUS_OFFRE", "COMPROMIS_SIGNE", "ACTE_SIGNE",
  "RECONNAISSANCE_HONORAIRES", "COMMISSION_VERSEE", "CLOTURE",
];

export default function MesRecommandationsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/recommandations");
    if (res.ok) setLeads(await res.json());
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ─── DETAIL VIEW ────────────────────────────────────────────────
  if (selected) {
    const statusIdx = STEPS.indexOf(selected.status);
    const progress = statusIdx >= 0 ? Math.round(((statusIdx + 1) / STEPS.length) * 100) : 0;
    const TypeIcon = TYPE_ICON[selected.type] || Home;

    return (
      <div className="space-y-4 animate-in">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors min-h-[44px]">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Mes recommandations</span>
        </button>

        {/* Header */}
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
                  <span className="text-sm text-[#D1B280]">{LEAD_STATUS_LABELS[selected.status]}</span>
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
              <span className="text-gray-500">Progression du dossier</span>
              <span className="text-[#D1B280] font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #D1B280, #b89a65)" }} />
            </div>
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
            <p className="text-gray-400 text-xs mb-1">Recommandé le</p>
            <p className="text-sm text-white">{formatDate(selected.createdAt)}</p>
          </div>
          {selected.contract && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Contrat</p>
              <Link href={`/portail/mes-contrats/${selected.contract.id}`} className="text-sm text-[#D1B280] font-mono hover:underline">
                {selected.contract.number}
              </Link>
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
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Suivi du dossier</p>
          <LeadTimeline status={selected.status} history={selected.statusHistory} />
        </div>

        {/* Message */}
        <div className="bg-[#D1B280]/10 border border-[#D1B280]/20 rounded-lg p-4 text-center">
          <p className="text-sm text-[#D1B280]">Notre équipe suit ce dossier. Vous serez notifié de chaque avancement.</p>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ──────────────────────────────────────────────────
  return (
    <PullToRefresh onRefresh={fetchLeads}>
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Mes recommandations
          </h1>
          <p className="text-gray-400 mt-1 text-sm">{leads.length} contact{leads.length > 1 ? "s" : ""} transmis</p>
        </div>
        <Link href="/portail/recommander"
          className="flex items-center gap-2 bg-[#D1B280] text-[#030A24] px-4 py-2.5 rounded-lg text-sm font-semibold min-h-[44px] hover:bg-[#b89a65] transition-colors">
          <Plus className="w-4 h-4" /> Recommander
        </Link>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-16 text-center">
          <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="font-medium text-white mb-2">Aucune recommandation</h3>
          <p className="text-sm text-gray-400 mb-6">Transmettez les coordonnées d&apos;un contact pour commencer.</p>
          <Link href="/portail/recommander"
            className="inline-flex items-center gap-2 bg-[#D1B280] text-[#030A24] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b89a65] transition-colors">
            Faire ma première recommandation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const statusIdx = STEPS.indexOf(lead.status);
            const progress = statusIdx >= 0 ? Math.round(((statusIdx + 1) / STEPS.length) * 100) : 0;
            const TypeIcon = TYPE_ICON[lead.type] || Home;

            return (
              <button
                key={lead.id}
                onClick={() => setSelected(lead)}
                className="w-full text-left bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all hover:bg-white/[0.07] hover:border-white/20 active:scale-[0.99]"
              >
                {/* Segmented progress bar (like mareco) */}
                <div className="flex gap-0.5 px-4 pt-4">
                  {STEPS.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= statusIdx ? "bg-[#D1B280]" : "bg-white/10"}`} />
                  ))}
                </div>

                <div className="p-4 pt-3">
                  {/* Top: date + type */}
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
                    <span className="text-xs font-semibold text-[#D1B280]">{LEAD_STATUS_LABELS[lead.status]}</span>
                  </div>

                  {/* Location */}
                  {lead.location && (
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-300">{lead.location}</p>
                    </div>
                  )}

                  {/* Name + contract */}
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-white">{lead.firstName} {lead.lastName}</p>
                    {lead.contract && (
                      <span className="text-[10px] text-[#D1B280] font-mono bg-[#D1B280]/10 px-2 py-0.5 rounded-full">
                        {lead.contract.number}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
