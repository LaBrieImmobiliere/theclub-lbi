"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ClipboardList, Search, Plus, X, FileText, Check } from "lucide-react";
import { CsvExport } from "@/components/admin/csv-export";
import {
  formatDate,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_TYPE_LABELS,
  LEAD_STATUS_STEPS,
} from "@/lib/utils";
import Link from "next/link";

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
  ambassador: { user: { name: string; email: string } };
  contract?: { id: string; number: string } | null;
};

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "NOUVEAU", label: "Nouveau" },
  { value: "PRIS_EN_CHARGE", label: "Pris en charge" },
  { value: "CONTACTE", label: "Contacté" },
  { value: "RDV_PLANIFIE", label: "RDV planifié" },
  { value: "EN_NEGOCIATION", label: "En négociation" },
  { value: "MANDAT_SIGNE", label: "Mandat signé" },
  { value: "SOUS_OFFRE", label: "Sous offre" },
  { value: "COMPROMIS_SIGNE", label: "Compromis signé" },
  { value: "ACTE_SIGNE", label: "Acte signé" },
  { value: "COMMISSION_VERSEE", label: "Commission versée" },
  { value: "EN_PAUSE", label: "En pause" },
  { value: "PERDU", label: "Perdu" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Tous les types" },
  { value: "ACHAT", label: "Achat" },
  { value: "VENTE", label: "Vente" },
  { value: "LOCATION", label: "Location" },
  { value: "INVESTISSEMENT", label: "Investissement" },
];

export default function RecommandationsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState("");

  const fetchLeads = useCallback(async () => {
    const res = await fetch(`/api/recommandations${statusFilter ? `?status=${statusFilter}` : ""}`);
    const data = await res.json();
    setLeads(data);
  }, [statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = leads.filter((l) => {
    const matchSearch = !search ||
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.email || "").toLowerCase().includes(search.toLowerCase()) ||
      l.ambassador.user.name.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || l.type === typeFilter;
    return matchSearch && matchType;
  });

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(id + status);
    await fetch(`/api/recommandations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingStatus("");
    fetchLeads();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recommandations</h1>
          <p className="text-gray-500 mt-1">{leads.length} recommandation{leads.length > 1 ? "s" : ""} au total</p>
        </div>
        <CsvExport
          data={filtered.map(l => ({
            prospect: `${l.firstName} ${l.lastName}`,
            telephone: l.phone,
            email: l.email || "",
            type: l.type,
            ambassadeur: l.ambassador?.user?.name || "",
            statut: l.status,
            date: l.createdAt,
          }))}
          headers={[
            { key: "prospect", label: "Prospect" },
            { key: "telephone", label: "T\u00e9l\u00e9phone" },
            { key: "email", label: "Email" },
            { key: "type", label: "Type" },
            { key: "ambassadeur", label: "Ambassadeur" },
            { key: "statut", label: "Statut" },
            { key: "date", label: "Date" },
          ]}
          filename="recommandations.csv"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="Rechercher prospect, ambassadeur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={TYPE_OPTIONS}
          />
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune recommandation trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-6 py-3 font-medium text-gray-500">Prospect</th>
                      <th className="px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">Type</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Ambassadeur</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                      <th className="px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">Date</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((lead) => (
                      <tr
                        key={lead.id}
                        className={`hover:bg-gray-50/50 cursor-pointer ${selected?.id === lead.id ? "bg-blue-50/50" : ""}`}
                        onClick={() => setSelected(lead)}
                      >
                        <td className="px-6 py-3">
                          <p className="font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                          <p className="text-xs text-gray-500">{lead.phone}</p>
                        </td>
                        <td className="px-6 py-3 hidden sm:table-cell">
                          <Badge className="bg-slate-100 text-slate-700">
                            {LEAD_TYPE_LABELS[lead.type] || lead.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-gray-600">{lead.ambassador.user.name}</td>
                        <td className="px-6 py-3">
                          <Badge className={LEAD_STATUS_COLORS[lead.status]}>
                            {LEAD_STATUS_LABELS[lead.status]}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-gray-500 hidden sm:table-cell">{formatDate(lead.createdAt)}</td>
                        <td className="px-6 py-3">
                          {lead.contract && (
                            <Link href={`/admin/contrats/${lead.contract.id}`} onClick={(e) => e.stopPropagation()}>
                              <FileText className="w-4 h-4 text-blue-600" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail panel */}
        {selected && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.firstName} {selected.lastName}</h2>
                  <p className="text-sm text-gray-500">{selected.phone}{selected.email ? ` · ${selected.email}` : ""}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Type</p>
                  <p className="font-medium">{LEAD_TYPE_LABELS[selected.type] || selected.type}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Ambassadeur</p>
                  <p className="font-medium">{selected.ambassador.user.name}</p>
                </div>
                {selected.location && (
                  <div>
                    <p className="text-gray-500 text-xs">Localisation</p>
                    <p className="font-medium">{selected.location}</p>
                  </div>
                )}
                {selected.budget && (
                  <div>
                    <p className="text-gray-500 text-xs">Budget</p>
                    <p className="font-medium">{selected.budget}</p>
                  </div>
                )}
              </div>

              {selected.description && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selected.description}</p>
                </div>
              )}

              {/* Status timeline - clickable */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Avancement</p>
                <p className="text-[10px] text-gray-300 mb-3">Cliquez sur une étape pour avancer ou reculer</p>
                {(() => {
                  const currentIndex = LEAD_STATUS_STEPS.findIndex((s) => s === selected.status);
                  const isLost = selected.status === "PERDU" || selected.status === "ANNULE" || selected.status === "EN_PAUSE";
                  if (isLost) {
                    return (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded mb-3">
                        <div className={`w-2 h-2 rounded-full ${selected.status === "PERDU" ? "bg-red-400" : "bg-gray-400"}`} />
                        <span className={`text-sm font-medium ${selected.status === "PERDU" ? "text-red-600" : "text-gray-600"}`}>
                          {LEAD_STATUS_LABELS[selected.status]}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="relative pt-1 mb-3">
                      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100" />
                      <div className="absolute top-4 left-4 h-0.5 bg-blue-500 transition-all duration-500"
                        style={{ width: currentIndex <= 0 ? "0%" : `${(currentIndex / (LEAD_STATUS_STEPS.length - 1)) * 100}%` }} />
                      <div className="relative flex justify-between">
                        {LEAD_STATUS_STEPS.map((key, i) => {
                          const isDone = i < currentIndex;
                          const isCurrent = i === currentIndex;
                          const isClickable = !updatingStatus && !isCurrent;
                          return (
                            <div key={key} className="flex flex-col items-center gap-1.5" style={{ width: "20%" }}>
                              <button type="button" onClick={() => isClickable && updateStatus(selected.id, key)}
                                disabled={!isClickable}
                                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                                  isDone ? "bg-blue-500 border-blue-500" : isCurrent ? "bg-white border-blue-500 shadow-sm" : "bg-white border-gray-200"
                                } ${isClickable ? "cursor-pointer hover:scale-110 hover:shadow-md" : ""}`}
                                title={isClickable ? `Passer en "${LEAD_STATUS_LABELS[key]}"` : ""}>
                                {isDone ? <Check className="w-3 h-3 text-white" /> : isCurrent ? <div className="w-2 h-2 rounded-full bg-blue-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />}
                              </button>
                              <span className={`text-[9px] text-center leading-tight ${isCurrent ? "text-blue-600 font-semibold" : isDone ? "text-gray-500" : "text-gray-300"}`}
                                onClick={() => isClickable && updateStatus(selected.id, key)} style={{ cursor: isClickable ? "pointer" : "default" }}>
                                {LEAD_STATUS_LABELS[key]?.replace("Commission versée", "Commission")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => updateStatus(selected.id, "EN_PAUSE")} disabled={!!updatingStatus || selected.status === "EN_PAUSE"}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50">
                    ⏸ En pause
                  </button>
                  <button onClick={() => updateStatus(selected.id, "PERDU")} disabled={!!updatingStatus || selected.status === "PERDU"}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
                    ✕ Perdu
                  </button>
                </div>
              </div>

              {!selected.contract && (
                <Link href={`/admin/contrats?leadId=${selected.id}&ambassadorId=${selected.ambassador}`}>
                  <Button className="w-full" variant="outline" size="sm">
                    <Plus className="w-4 h-4" /> Créer un contrat
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
