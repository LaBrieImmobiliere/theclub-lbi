"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SignaturePad } from "@/components/signature-pad";
import {
  ArrowLeft, FileText, Plus, CheckCircle2, Download,
} from "lucide-react";
import {
  formatDate,
  formatCurrency,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  HONORAIRE_STATUS_LABELS,
  HONORAIRE_STATUS_COLORS,
} from "@/lib/utils";
import Link from "next/link";

type HonoraryAck = {
  id: string;
  number: string;
  amount: number;
  description?: string;
  status: string;
  paidAt?: string;
  ambassadorSignature?: string;
  createdAt: string;
};

type Contract = {
  id: string;
  number: string;
  status: string;
  commissionType: string;
  commissionValue: number;
  commissionAmount?: number;
  propertyAddress?: string;
  propertyPrice?: number;
  honoraires?: number;
  notes?: string;
  adminSignature?: string;
  ambassadorSignature?: string;
  signedAt?: string;
  paidAt?: string;
  createdAt: string;
  ambassador: { id: string; user: { name: string; email: string; phone?: string } };
  lead?: { id: string; firstName: string; lastName: string; phone: string; type: string } | null;
  honoraryAcknowledgments: HonoraryAck[];
};

export default function ContratDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [showAckForm, setShowAckForm] = useState(false);
  const [ackForm, setAckForm] = useState({ amount: "", description: "" });
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchContract = useCallback(async () => {
    const res = await fetch(`/api/contrats/${id}`);
    if (res.ok) setContract(await res.json());
  }, [id]);

  useEffect(() => { fetchContract(); }, [fetchContract]);

  const updateStatus = async (status: string) => {
    setStatusUpdating(true);
    await fetch(`/api/contrats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setStatusUpdating(false);
    fetchContract();
  };

  const saveAdminSignature = async (dataUrl: string) => {
    setSaving(true);
    await fetch(`/api/contrats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSignature: dataUrl, status: "ENVOYE" }),
    });
    setSaving(false);
    setShowSignature(false);
    fetchContract();
  };

  const createAck = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/contrats/${id}/reconnaissances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ackForm),
    });
    setAckForm({ amount: "", description: "" });
    setShowAckForm(false);
    fetchContract();
  };

  const updateAckStatus = async (ackId: string, status: string) => {
    await fetch(`/api/contrats/${id}/reconnaissances/${ackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchContract();
  };

  const downloadPDF = async () => {
    if (!contract) return;
    const { generateContractPDF } = await import("@/lib/pdf");
    generateContractPDF(contract);
  };

  if (!contract) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/contrats" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{contract.number}</h1>
            <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
              {CONTRACT_STATUS_LABELS[contract.status]}
            </Badge>
          </div>
          <p className="text-gray-500">Contrat d&apos;apporteur d&apos;affaire · Créé le {formatDate(contract.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadPDF}>
            <Download className="w-4 h-4" /> Télécharger PDF
          </Button>
          {!contract.adminSignature && (
            <Button size="sm" onClick={() => setShowSignature(true)}>
              <CheckCircle2 className="w-4 h-4" /> Signer & Envoyer
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Ambassador */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Ambassadeur</h2></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{contract.ambassador.user.name}</p>
              <p className="text-gray-500">{contract.ambassador.user.email}</p>
              {contract.ambassador.user.phone && <p className="text-gray-500">{contract.ambassador.user.phone}</p>}
            </CardContent>
          </Card>

          {/* Lead */}
          {contract.lead && (
            <Card>
              <CardHeader><h2 className="font-semibold text-gray-900">Recommandation</h2></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">{contract.lead.firstName} {contract.lead.lastName}</p>
                <p className="text-gray-500">{contract.lead.phone}</p>
                <Badge className="bg-slate-100 text-slate-700">{contract.lead.type}</Badge>
              </CardContent>
            </Card>
          )}

          {/* Status changer */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Statut du contrat</h2></CardHeader>
            <CardContent className="space-y-2">
              {["BROUILLON", "ENVOYE", "SIGNE", "PAYE", "ANNULE"].map((s) => (
                <button
                  key={s}
                  disabled={statusUpdating || contract.status === s}
                  onClick={() => updateStatus(s)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    contract.status === s
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {CONTRACT_STATUS_LABELS[s]}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract details */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Détails du contrat</h2></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {contract.propertyAddress && (
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs mb-1">Adresse du bien</p>
                    <p className="font-medium">{contract.propertyAddress}</p>
                  </div>
                )}
                {contract.propertyPrice && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Prix du bien</p>
                    <p className="font-medium">{formatCurrency(contract.propertyPrice)}</p>
                  </div>
                )}
                {contract.honoraires && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Honoraires agence</p>
                    <p className="font-medium">{formatCurrency(contract.honoraires)}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 text-xs mb-1">Type de commission</p>
                  <p className="font-medium">
                    {contract.commissionType === "PERCENTAGE"
                      ? `${contract.commissionValue}% des honoraires`
                      : "Montant fixe"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Commission due</p>
                  <p className="text-xl font-bold text-green-700">
                    {contract.commissionAmount
                      ? formatCurrency(contract.commissionAmount)
                      : contract.commissionType === "FIXED"
                      ? formatCurrency(contract.commissionValue)
                      : "-"}
                  </p>
                </div>
                {contract.signedAt && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Signé le</p>
                    <p className="font-medium">{formatDate(contract.signedAt)}</p>
                  </div>
                )}
                {contract.paidAt && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Payé le</p>
                    <p className="font-medium">{formatDate(contract.paidAt)}</p>
                  </div>
                )}
              </div>
              {contract.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-500 text-xs mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{contract.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signatures */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Signatures</h2></CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-2">Signature agence</p>
                {contract.adminSignature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={contract.adminSignature} alt="Signature agence" className="border rounded-lg max-h-24 w-full object-contain bg-white" />
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg h-24 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Non signé</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Signature ambassadeur</p>
                {contract.ambassadorSignature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={contract.ambassadorSignature} alt="Signature ambassadeur" className="border rounded-lg max-h-24 w-full object-contain bg-white" />
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg h-24 flex items-center justify-center">
                    <p className="text-xs text-gray-400">En attente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reconnaissances d'honoraires */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Reconnaissances d&apos;honoraires</h2>
                <Button size="sm" variant="outline" onClick={() => setShowAckForm(!showAckForm)}>
                  <Plus className="w-4 h-4" /> Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAckForm && (
                <form onSubmit={createAck} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Montant (€) *"
                      type="number"
                      step="0.01"
                      value={ackForm.amount}
                      onChange={(e) => setAckForm({ ...ackForm, amount: e.target.value })}
                      required
                    />
                    <Input
                      label="Description"
                      value={ackForm.description}
                      onChange={(e) => setAckForm({ ...ackForm, description: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAckForm(false)}>Annuler</Button>
                    <Button type="submit" size="sm">Créer</Button>
                  </div>
                </form>
              )}

              {contract.honoraryAcknowledgments.length === 0 && !showAckForm ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucune reconnaissance d&apos;honoraires</p>
              ) : (
                <div className="space-y-2">
                  {contract.honoraryAcknowledgments.map((ack) => (
                    <div key={ack.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                      <div>
                        <p className="text-sm font-medium font-mono">{ack.number}</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(ack.amount)}
                          {ack.description && ` · ${ack.description}`}
                        </p>
                        {ack.ambassadorSignature && (
                          <p className="text-xs text-green-600">✓ Signé par l&apos;ambassadeur</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={HONORAIRE_STATUS_COLORS[ack.status]}>
                          {HONORAIRE_STATUS_LABELS[ack.status]}
                        </Badge>
                        {ack.status !== "PAYEE" && (
                          <Select
                            value={ack.status}
                            onChange={(e) => updateAckStatus(ack.id, e.target.value)}
                            options={[
                              { value: "EN_ATTENTE", label: "En attente" },
                              { value: "VALIDEE", label: "Valider" },
                              { value: "PAYEE", label: "Marquer payée" },
                            ]}
                            className="text-xs py-1 h-7"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Signature modal */}
      {showSignature && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Signature de l&apos;agence</h2>
                <button onClick={() => setShowSignature(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <p className="text-sm text-gray-500">
                En signant, vous validez le contrat {contract.number} et l&apos;envoyez à l&apos;ambassadeur.
              </p>
            </CardHeader>
            <CardContent>
              <SignaturePad onSave={saveAdminSignature} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
