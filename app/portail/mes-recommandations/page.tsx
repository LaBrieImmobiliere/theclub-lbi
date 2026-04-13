"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";
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

      {leads.length === 0 ? (
        <Card>
          <CardContent className="p-0">
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
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-6 ${selected ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* Cards list */}
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelected(lead)}
                className={`bg-white border border-gray-100 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${selected?.id === lead.id ? "ring-2 ring-[#D1B280] border-[#D1B280]" : ""}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{lead.phone}</p>
                    </div>
                    <Badge className={LEAD_STATUS_COLORS[lead.status]}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge className="bg-slate-100 text-slate-700">
                      {LEAD_TYPE_LABELS[lead.type] || lead.type}
                    </Badge>
                    <span className="text-xs text-gray-400">{formatDate(lead.createdAt)}</span>
                    {lead.contract && (
                      <Link
                        href={`/portail/mes-contrats/${lead.contract.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:underline font-mono ml-auto"
                      >
                        {lead.contract.number}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selected.firstName} {selected.lastName}</h2>
                    <p className="text-sm text-gray-500">{selected.phone}{selected.email ? ` · ${selected.email}` : ""}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 p-1">✕</button>
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
                <div className="overflow-x-auto -mx-2 px-2">
                  <LeadTimeline status={selected.status} compact />
                </div>

                {(selected.location || selected.budget) && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selected.location && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Localisation</p>
                        <p className="font-medium mt-0.5">{selected.location}</p>
                      </div>
                    )}
                    {selected.budget && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Budget</p>
                        <p className="font-medium mt-0.5">{selected.budget}</p>
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
      )}
    </div>
  );
}
