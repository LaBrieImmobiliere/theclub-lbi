"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Search, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

type AuditEntry = {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  user?: { name: string; email: string } | null;
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  STATUS_CHANGE: "bg-amber-100 text-amber-700",
  LOGIN: "bg-purple-100 text-purple-700",
};

const ENTITY_OPTIONS = [
  { value: "", label: "Toutes les entités" },
  { value: "Lead", label: "Recommandation" },
  { value: "Contract", label: "Contrat" },
  { value: "User", label: "Utilisateur" },
  { value: "Ambassador", label: "Ambassadeur" },
  { value: "Negotiator", label: "Négociateur" },
  { value: "Agency", label: "Agence" },
];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 50;

  useEffect(() => {
    fetch("/api/admin/audit-log")
      .then(r => r.json())
      .then(data => { setLogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = logs.filter(log => {
    if (entityFilter && log.entity !== entityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        (log.details || "").toLowerCase().includes(q) ||
        (log.user?.name || "").toLowerCase().includes(q) ||
        (log.user?.email || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          <Shield className="w-6 h-6 inline-block mr-2 text-brand-gold" />
          Journal d&apos;audit
        </h1>
        <p className="text-gray-500 mt-1">{filtered.length} entrée(s)</p>
      </div>

      <Card className="rounded-none">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              />
            </div>
            <Select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} options={ENTITY_OPTIONS} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">Chargement...</div>
          ) : paginated.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">Aucune entrée trouvée.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left bg-brand-cream">
                    <th className="px-6 py-3 font-medium text-brand-deep">Date</th>
                    <th className="px-6 py-3 font-medium text-brand-deep">Utilisateur</th>
                    <th className="px-6 py-3 font-medium text-brand-deep">Action</th>
                    <th className="px-6 py-3 font-medium text-brand-deep">Entité</th>
                    <th className="px-6 py-3 font-medium text-brand-deep">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(log => (
                    <tr key={log.id} className="hover:bg-brand-cream/50">
                      <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td className="px-6 py-3 text-gray-700">{log.user?.name || log.user?.email || "Système"}</td>
                      <td className="px-6 py-3">
                        <Badge className={ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600"}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-700 font-mono text-xs">{log.entity}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs max-w-xs truncate">{log.details || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-deep disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" /> Précédent
              </button>
              <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-deep disabled:opacity-30"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
