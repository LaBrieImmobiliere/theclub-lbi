"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Check } from "lucide-react";
import {
  formatDate,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_TYPE_LABELS,
} from "@/lib/utils";
import Link from "next/link";

import { LeadTimeline } from "@/components/lead-timeline";

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
};

export default function MesRecommandationsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/recommandations");
    const data = await res.json();
    setLeads(data);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mes recommandations</h1>
          <p className="text-gray-500 mt-1 text-sm">{leads.length} contact{leads.length > 1 ? "s" : ""} transmis</p>
        </div>
        <Link href="/portail/recommander">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Nouvelle recommandation
          </Button>
        </Link>
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        <Card>
          <CardContent className="p-0">
            {leads.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Aucune recommandation</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Transmettez les coordonnées d&apos;un contact pour commencer.
                </p>
                <Link href="/portail/recommander">
                  <Button>Faire ma première recommandation</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-6 py-3 font-medium text-gray-500">Contact</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Contrat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className={`hover:bg-gray-50/50 cursor-pointer ${selected?.id === lead.id ? "bg-blue-50/50" : ""}`}
                        onClick={() => setSelected(lead)}
                      >
                        <td className="px-6 py-3">
                          <p className="font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                          <p className="text-xs text-gray-500">{lead.phone}</p>
                        </td>
                        <td className="px-6 py-3">
                          <Badge className="bg-slate-100 text-slate-700">
                            {LEAD_TYPE_LABELS[lead.type] || lead.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">
                          <Badge className={LEAD_STATUS_COLORS[lead.status]}>
                            {LEAD_STATUS_LABELS[lead.status]}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{formatDate(lead.createdAt)}</td>
                        <td className="px-6 py-3">
                          {lead.contract ? (
                            <Link
                              href={`/portail/mes-contrats/${lead.contract.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-blue-600 hover:underline font-mono"
                            >
                              {lead.contract.number}
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
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
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-slate-100 text-slate-700">
                  {LEAD_TYPE_LABELS[selected.type] || selected.type}
                </Badge>
                {selected.status === "PERDU" && (
                  <Badge className="bg-red-100 text-red-700">Perdu</Badge>
                )}
              </div>

              {/* Status timeline */}
              <LeadTimeline status={selected.status} compact />

              {(selected.location || selected.budget) && (
                <div className="grid grid-cols-2 gap-3 text-sm">
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
              )}

              {selected.description && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selected.description}</p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Recommandé le {formatDate(selected.createdAt)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Notre équipe suit ce dossier. Vous serez notifié de chaque avancement.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
