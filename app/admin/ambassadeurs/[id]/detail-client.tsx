"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, FileText, ClipboardList,
  Pencil, Save, X, Trash2, AlertTriangle, Building2, UserCircle,
} from "lucide-react";

const LEAD_STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau", CONTACTE: "Contacté", EN_COURS: "En cours",
  SIGNE: "Signé", PERDU: "Perdu",
};
const LEAD_STATUS_COLORS: Record<string, string> = {
  NOUVEAU: "bg-amber-100 text-amber-800", CONTACTE: "bg-blue-100 text-blue-800",
  EN_COURS: "bg-purple-100 text-purple-800", SIGNE: "bg-green-100 text-green-800",
  PERDU: "bg-red-100 text-red-800",
};
const CONTRACT_STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon", SIGNE: "Signé", PAYE: "Payé", ANNULE: "Annulé",
};
const CONTRACT_STATUS_COLORS: Record<string, string> = {
  BROUILLON: "bg-gray-100 text-gray-700", SIGNE: "bg-blue-100 text-blue-800",
  PAYE: "bg-green-100 text-green-800", ANNULE: "bg-red-100 text-red-800",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
function formatCurrency(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

interface AmbassadorData {
  id: string;
  code: string;
  status: string;
  notes: string;
  user: { name: string; firstName?: string; lastName?: string; email: string; phone: string };
  agency: string | null;
  negotiator: string | null;
  totalCommissions: number;
  paidCommissions: number;
  leadsCount: number;
  contractsCount: number;
  leads: { id: string; firstName: string; lastName: string; type: string; status: string; createdAt: string }[];
  contracts: { id: string; number: string; commissionAmount: number | null; status: string; createdAt: string }[];
}

export function AmbassadeurDetailClient({ data }: { data: AmbassadorData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState(data.user.firstName || "");
  const [lastName, setLastName] = useState(data.user.lastName || "");
  const [phone, setPhone] = useState(data.user.phone);
  const [status, setStatus] = useState(data.status);
  const [notes, setNotes] = useState(data.notes);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/ambassadeurs/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, name: firstName + " " + lastName, phone, status, notes }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/ambassadeurs/${data.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/ambassadeurs");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/ambassadeurs" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.user.name}</h1>
            <p className="text-gray-500 text-sm">
              Ambassadeur · Code : <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{data.code}</code>
            </p>
          </div>
          <Badge className={data.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
            {data.status === "ACTIVE" ? "Actif" : "Inactif"}
          </Badge>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-3 py-2 bg-brand-deep text-white text-sm font-medium hover:bg-brand-deep/90 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Modifier
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "..." : "Enregistrer"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFirstName(data.user.firstName || "");
                  setLastName(data.user.lastName || "");
                  setPhone(data.user.phone);
                  setStatus(data.status);
                  setNotes(data.notes);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Supprimer cet ambassadeur ?</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  &Ecirc;tes-vous s&ucirc;r de vouloir supprimer <strong>{data.user.name}</strong> ?
                </p>
              </div>
            </div>
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded mb-4">
              Cette action est irr&eacute;versible. Toutes les donn&eacute;es associ&eacute;es (compte utilisateur, recommandations, contrats) seront supprim&eacute;es d&eacute;finitivement.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Suppression..." : "Oui, supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Informations</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Prénom</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nom</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value.toUpperCase())}
                    style={{ textTransform: "uppercase" }}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email (non modifiable)</label>
                  <input
                    value={data.user.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 text-sm bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">T&eacute;l&eacute;phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="06 XX XX XX XX"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Statut</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">Actif</option>
                    <option value="INACTIVE">Inactif</option>
                    <option value="PENDING">En attente</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Notes internes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Notes visibles uniquement par l'admin..."
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <UserCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {data.user.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {data.user.email}
                </div>
                {data.user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {data.user.phone}
                  </div>
                )}
                {data.agency && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {data.agency}
                  </div>
                )}
                {data.negotiator && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <UserCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    N&eacute;gociateur : {data.negotiator}
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Recommandations</span>
                    <span className="font-medium">{data.leadsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Contrats</span>
                    <span className="font-medium">{data.contractsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Commissions totales</span>
                    <span className="font-medium text-green-700">{formatCurrency(data.totalCommissions)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Commissions pay&eacute;es</span>
                    <span className="font-medium text-green-600">{formatCurrency(data.paidCommissions)}</span>
                  </div>
                </div>
                {data.notes && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Notes internes</p>
                    <p className="text-sm text-gray-700">{data.notes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Leads */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Recommandations ({data.leads.length})</h2>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.leads.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Aucune recommandation</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-6 py-3 font-medium text-gray-500">Prospect</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium">{lead.firstName} {lead.lastName}</td>
                        <td className="px-6 py-3 text-gray-500">{lead.type}</td>
                        <td className="px-6 py-3">
                          <Badge className={LEAD_STATUS_COLORS[lead.status] || ""}>
                            {LEAD_STATUS_LABELS[lead.status] || lead.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{formatDate(lead.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Contracts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Contrats ({data.contracts.length})</h2>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.contracts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Aucun contrat</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-6 py-3 font-medium text-gray-500">Num&eacute;ro</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Commission</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.contracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-mono text-xs">{contract.number}</td>
                        <td className="px-6 py-3 font-medium text-green-700">
                          {contract.commissionAmount ? formatCurrency(contract.commissionAmount) : "-"}
                        </td>
                        <td className="px-6 py-3">
                          <Badge className={CONTRACT_STATUS_COLORS[contract.status] || ""}>
                            {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{formatDate(contract.createdAt)}</td>
                        <td className="px-6 py-3">
                          <Link href={`/admin/contrats/${contract.id}`} className="text-blue-600 hover:underline text-xs">
                            Voir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
