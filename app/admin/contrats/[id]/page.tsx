"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/confirm-modal";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SignaturePad } from "@/components/signature-pad";
import {
  ArrowLeft, Plus, CheckCircle2, Download, Pencil, Eye, Trash2,
} from "lucide-react";
import { PdfPreviewModal } from "@/components/pdf-preview-modal";
import {
  formatDate,
  formatCurrency,
  commissionTTC,
  commissionTVA,
  isAssujettTVA,
  LEGAL_STATUS_LABELS,
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
  adminSignature?: string;
  signedAt?: string;
  countersignedAt?: string;
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
  ambassador: { id: string; legalStatus?: string; companyName?: string; associationName?: string; user: { name: string; email: string; phone?: string } };
  lead?: { id: string; firstName: string; lastName: string; phone: string; type: string } | null;
  honoraryAcknowledgments: HonoraryAck[];
};

export default function ContratDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [showAckForm, setShowAckForm] = useState(false);
  const [ackForm, setAckForm] = useState({ amount: "", description: "" });
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showCountersign, setShowCountersign] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; title: string; name: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const [editForm, setEditForm] = useState({
    propertyAddress: "",
    propertyPrice: "",
    honoraires: "",
    commissionType: "PERCENTAGE",
    commissionValue: "",
    notes: "",
  });

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

  const countersignAck = async (ackId: string, dataUrl: string) => {
    setSaving(true);
    await fetch(`/api/contrats/${id}/reconnaissances/${ackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSignature: dataUrl }),
    });
    setSaving(false);
    setShowCountersign(null);
    fetchContract();
  };

  const startEdit = () => {
    if (!contract) return;
    setEditForm({
      propertyAddress: contract.propertyAddress || "",
      propertyPrice: contract.propertyPrice?.toString() || "",
      honoraires: contract.honoraires?.toString() || "",
      commissionType: contract.commissionType || "PERCENTAGE",
      commissionValue: contract.commissionValue?.toString() || "5",
      notes: contract.notes || "",
    });
    setEditMode(true);
  };

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/contrats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyAddress: editForm.propertyAddress || undefined,
        propertyPrice: editForm.propertyPrice ? parseFloat(editForm.propertyPrice) : undefined,
        honoraires: editForm.honoraires ? parseFloat(editForm.honoraires) : undefined,
        commissionType: editForm.commissionType,
        commissionValue: parseFloat(editForm.commissionValue) || 5,
        notes: editForm.notes || undefined,
      }),
    });
    setSaving(false);
    setEditMode(false);
    fetchContract();
  };

  const downloadPDF = async () => {
    if (!contract) return;
    const { generateContractPDF } = await import("@/lib/pdf");
    generateContractPDF(contract);
  };

  const deleteContract = async () => {
    if (!contract) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contrats/${contract.id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDelete(false);
        router.push("/admin/contrats");
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body.error || "Erreur lors de la suppression");
      }
    } finally {
      setDeleting(false);
    }
  };

  const downloadAllAcksPDF = async () => {
    if (!contract || contract.honoraryAcknowledgments.length === 0) return;
    const { generateAllAcknowledgmentsPDF } = await import("@/lib/pdf");
    generateAllAcknowledgmentsPDF(contract.honoraryAcknowledgments, contract);
  };

  const downloadAckPDF = async (ack: HonoraryAck) => {
    if (!contract) return;
    const { generateAcknowledgmentPDF } = await import("@/lib/pdf");
    generateAcknowledgmentPDF(ack, contract);
  };

  // Prévisualisation inline (blob URL + iframe)
  const previewPDF = async () => {
    if (!contract) return;
    const { generateContractPDF } = await import("@/lib/pdf");
    const url = generateContractPDF(contract, "blob");
    if (typeof url === "string") {
      setPreview({ url, title: `Contrat ${contract.number}`, name: `contrat-${contract.number}.pdf` });
    }
  };
  const previewAllAcksPDF = async () => {
    if (!contract || contract.honoraryAcknowledgments.length === 0) return;
    const { generateAllAcknowledgmentsPDF } = await import("@/lib/pdf");
    const url = generateAllAcknowledgmentsPDF(contract.honoraryAcknowledgments, contract, "blob");
    if (typeof url === "string") {
      setPreview({ url, title: `Reconnaissances ${contract.number}`, name: `reconnaissances-${contract.number}.pdf` });
    }
  };
  const previewAckPDF = async (ack: HonoraryAck) => {
    if (!contract) return;
    const { generateAcknowledgmentPDF } = await import("@/lib/pdf");
    const url = generateAcknowledgmentPDF(ack, contract, "blob");
    if (typeof url === "string") {
      setPreview({ url, title: `Reconnaissance ${ack.number}`, name: `reconnaissance-honoraires-${ack.number}.pdf` });
    }
  };
  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
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
          <Button variant="outline" size="sm" onClick={previewPDF}>
            <Eye className="w-4 h-4" /> Lire
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPDF}>
            <Download className="w-4 h-4" /> Télécharger PDF
          </Button>
          {!contract.adminSignature && (
            <Button size="sm" onClick={() => setShowSignature(true)}>
              <CheckCircle2 className="w-4 h-4" /> Signer & Envoyer
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmDelete(true)}
            className="!border-red-300 !text-red-600 hover:!bg-red-50"
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </Button>
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
              <Badge className={contract.ambassador.legalStatus === "SOCIETE" ? "bg-blue-50 text-blue-700" : contract.ambassador.legalStatus === "ASSOCIATION" ? "bg-purple-50 text-purple-700" : "bg-gray-50 text-gray-600"}>
                {LEGAL_STATUS_LABELS[contract.ambassador.legalStatus || "PARTICULIER"]}
              </Badge>
              {contract.ambassador.companyName && <p className="text-gray-500 text-xs">{contract.ambassador.companyName}</p>}
              {contract.ambassador.associationName && <p className="text-gray-500 text-xs">{contract.ambassador.associationName}</p>}
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Détails du contrat</h2>
                {!editMode && (
                  <Button variant="outline" size="sm" onClick={startEdit}>
                    <Pencil className="w-3 h-3" /> Modifier
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <form onSubmit={saveDetails} className="space-y-4">
                  <Input
                    label="Adresse du bien"
                    value={editForm.propertyAddress}
                    onChange={(e) => setEditForm({ ...editForm, propertyAddress: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Prix du bien (&euro;)"
                      type="number"
                      step="0.01"
                      value={editForm.propertyPrice}
                      onChange={(e) => setEditForm({ ...editForm, propertyPrice: e.target.value })}
                    />
                    <Input
                      label="Honoraires agence (&euro;)"
                      type="number"
                      step="0.01"
                      value={editForm.honoraires}
                      onChange={(e) => setEditForm({ ...editForm, honoraires: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Type de commission"
                      value={editForm.commissionType}
                      onChange={(e) => setEditForm({ ...editForm, commissionType: e.target.value })}
                      options={[
                        { value: "PERCENTAGE", label: "Pourcentage (%)" },
                        { value: "FIXED", label: "Montant fixe (\u20ac)" },
                      ]}
                    />
                    <Input
                      label={editForm.commissionType === "PERCENTAGE" ? "Commission (%)" : "Montant (\u20ac)"}
                      type="number"
                      step="0.01"
                      value={editForm.commissionValue}
                      onChange={(e) => setEditForm({ ...editForm, commissionValue: e.target.value })}
                    />
                  </div>
                  {editForm.commissionType === "PERCENTAGE" && editForm.honoraires && editForm.commissionValue && (() => {
                    const ht = (parseFloat(editForm.honoraires) * parseFloat(editForm.commissionValue)) / 100;
                    const ls = contract.ambassador.legalStatus;
                    const hasTVA = isAssujettTVA(ls);
                    return (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 space-y-1">
                        <p className="text-sm text-green-800">
                          <strong>Commission HT :</strong> {formatCurrency(ht)}
                          <span className="text-green-600 text-xs ml-2">({editForm.commissionValue}% de {formatCurrency(parseFloat(editForm.honoraires))})</span>
                        </p>
                        {hasTVA ? (
                          <>
                            <p className="text-sm text-green-700">
                              <strong>TVA (20%) :</strong> {formatCurrency(commissionTVA(ht, ls))}
                            </p>
                            <p className="text-base font-bold text-green-900">
                              Commission TTC : {formatCurrency(commissionTTC(ht, ls))}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-green-600">
                            {LEGAL_STATUS_LABELS[ls || "PARTICULIER"]} — pas de TVA applicable
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  <Textarea
                    label="Notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditMode(false)}>Annuler</Button>
                    <Button type="submit" size="sm" disabled={saving}>
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
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
                    {(() => {
                      const ht = contract.commissionAmount
                        || (contract.commissionType === "FIXED" ? contract.commissionValue : 0);
                      const ls = contract.ambassador.legalStatus;
                      const hasTVA = isAssujettTVA(ls);
                      return ht ? (
                        <>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">Commission HT</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(ht)}</p>
                          </div>
                          {hasTVA ? (
                            <>
                              <div>
                                <p className="text-gray-500 text-xs mb-1">TVA (20%)</p>
                                <p className="font-medium text-gray-600">{formatCurrency(commissionTVA(ht, ls))}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-gray-500 text-xs mb-1">Commission TTC</p>
                                <p className="text-2xl font-bold text-green-700">{formatCurrency(commissionTTC(ht, ls))}</p>
                              </div>
                            </>
                          ) : (
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Net &agrave; percevoir</p>
                              <p className="text-2xl font-bold text-green-700">{formatCurrency(ht)}</p>
                              <p className="text-xs text-gray-400">Pas de TVA ({LEGAL_STATUS_LABELS[ls || "PARTICULIER"]})</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Commission</p>
                          <p className="font-medium text-gray-400">
                            {contract.commissionType === "PERCENTAGE" ? `${contract.commissionValue}%` : "-"}
                          </p>
                        </div>
                      );
                    })()}
                    {contract.signedAt && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Sign&eacute; le</p>
                        <p className="font-medium">{formatDate(contract.signedAt)}</p>
                      </div>
                    )}
                    {contract.paidAt && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Pay&eacute; le</p>
                        <p className="font-medium">{formatDate(contract.paidAt)}</p>
                      </div>
                    )}
                  </div>
                  {!contract.propertyAddress && !contract.honoraires && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <p className="text-sm text-amber-800">
                        Les d&eacute;tails financiers n&apos;ont pas encore &eacute;t&eacute; compl&eacute;t&eacute;s. Cliquez sur &laquo; Modifier &raquo; pour renseigner les honoraires et calculer la commission.
                      </p>
                    </div>
                  )}
                  {contract.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-gray-500 text-xs mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{contract.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Signatures */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Signatures</h2></CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-2">Signature agence</p>
                {contract.adminSignature?.startsWith("data:image") ? (
                  <Image src={contract.adminSignature} alt="Signature agence" width={400} height={96} className="border rounded-lg max-h-24 w-full object-contain bg-white" unoptimized />
                ) : contract.adminSignature ? (
                  <div className="border rounded-lg h-24 flex items-center justify-center bg-white">
                    <p className="text-sm italic text-blue-700 font-medium">{contract.adminSignature}</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg h-24 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Non signé</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Signature ambassadeur</p>
                {contract.ambassadorSignature?.startsWith("data:image") ? (
                  <Image src={contract.ambassadorSignature} alt="Signature ambassadeur" width={400} height={96} className="border rounded-lg max-h-24 w-full object-contain bg-white" unoptimized />
                ) : contract.ambassadorSignature ? (
                  <div className="border rounded-lg h-24 flex items-center justify-center bg-white">
                    <p className="text-sm italic text-blue-700 font-medium">{contract.ambassadorSignature}</p>
                  </div>
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
                <div className="flex gap-2">
                  {contract.honoraryAcknowledgments.length > 1 && (
                    <>
                      <Button size="sm" variant="outline" onClick={previewAllAcksPDF}>
                        <Eye className="w-3 h-3" /> Tout lire
                      </Button>
                      <Button size="sm" variant="outline" onClick={downloadAllAcksPDF}>
                        <Download className="w-3 h-3" /> Tout exporter
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowAckForm(!showAckForm)}>
                    <Plus className="w-4 h-4" /> Ajouter
                  </Button>
                </div>
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
                <div className="space-y-3">
                  {contract.honoraryAcknowledgments.map((ack) => (
                    <div key={ack.id} className="p-4 border border-gray-100 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium font-mono">{ack.number}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(ack.amount)}
                            {ack.description && ` · ${ack.description}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={HONORAIRE_STATUS_COLORS[ack.status]}>
                            {HONORAIRE_STATUS_LABELS[ack.status]}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => previewAckPDF(ack)} className="h-7">
                            <Eye className="w-3 h-3" /> Lire
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => downloadAckPDF(ack)} className="h-7">
                            <Download className="w-3 h-3" /> PDF
                          </Button>
                        </div>
                      </div>
                      {/* Signature status */}
                      <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${ack.ambassadorSignature ? "bg-green-400" : "bg-gray-300"}`} />
                          <span className={ack.ambassadorSignature ? "text-green-700" : "text-gray-400"}>
                            {ack.ambassadorSignature ? "Ambassadeur a signé" : "Attente signature ambassadeur"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${ack.adminSignature ? "bg-green-400" : "bg-gray-300"}`} />
                          <span className={ack.adminSignature ? "text-green-700" : "text-gray-400"}>
                            {ack.adminSignature ? "Contresigné par l'agence" : "Attente contresignature"}
                          </span>
                        </div>
                      </div>
                      {/* Event history */}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-gray-400 border-t border-gray-50 pt-2">
                        <span>📄 Créée le {formatDate(ack.createdAt)}</span>
                        {ack.signedAt && <span>✍️ Signée ambassadeur le {formatDate(ack.signedAt)}</span>}
                        {ack.countersignedAt && <span>✅ Contresignée le {formatDate(ack.countersignedAt)}</span>}
                        {ack.paidAt && <span>💰 Payée le {formatDate(ack.paidAt)}</span>}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {ack.status === "SIGNEE_AMBASSADEUR" && !ack.adminSignature && (
                          <Button size="sm" onClick={() => setShowCountersign(ack.id)} className="bg-blue-600 hover:bg-blue-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Contresigner
                          </Button>
                        )}
                        {ack.status === "CONTRESIGNEE" && (
                          <Button size="sm" variant="outline" onClick={() => updateAckStatus(ack.id, "PAYEE")} className="text-green-700 border-green-300 hover:bg-green-50">
                            Marquer payée
                          </Button>
                        )}
                        {ack.status === "EN_ATTENTE" && (
                          <span className="text-xs text-amber-600 italic">En attente de signature par l&apos;ambassadeur</span>
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

      {/* PDF preview modal */}
      {preview && (
        <PdfPreviewModal
          url={preview.url}
          title={preview.title}
          downloadName={preview.name}
          onClose={closePreview}
        />
      )}

      {/* Confirm delete modal */}
      <ConfirmModal
        open={confirmDelete}
        title="Supprimer le contrat"
        message={`Supprimer définitivement le contrat ${contract.number} ? ${
          contract.honoraryAcknowledgments.length > 0
            ? `Les ${contract.honoraryAcknowledgments.length} reconnaissance${contract.honoraryAcknowledgments.length > 1 ? "s" : ""} d'honoraires seront aussi supprimée${contract.honoraryAcknowledgments.length > 1 ? "s" : ""}. `
            : ""
        }Cette action est irréversible.`}
        confirmLabel={deleting ? "Suppression…" : "Oui, supprimer"}
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={deleteContract}
        onCancel={() => !deleting && setConfirmDelete(false)}
      />

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

      {/* Countersign acknowledgment modal */}
      {showCountersign && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Contresigner la reconnaissance d&apos;honoraires</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    L&apos;ambassadeur a signé. Contresignez pour valider la reconnaissance et envoyer le document aux deux parties.
                  </p>
                </div>
                <button onClick={() => setShowCountersign(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </CardHeader>
            <CardContent>
              <SignaturePad onSave={(dataUrl) => countersignAck(showCountersign, dataUrl)} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
