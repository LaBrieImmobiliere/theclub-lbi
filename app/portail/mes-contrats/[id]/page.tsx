"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/components/signature-pad";
import { PdfPreviewModal } from "@/components/pdf-preview-modal";
import { ArrowLeft, Download, CheckCircle2, Eye } from "lucide-react";
import {
  formatDate,
  formatCurrency,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  HONORAIRE_STATUS_LABELS,
  HONORAIRE_STATUS_COLORS,
  commissionTTC,
  commissionTVA,
  isAssujettTVA,
  LEGAL_STATUS_LABELS,
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
  ambassador: { legalStatus?: string; user: { name: string } };
  lead?: { firstName: string; lastName: string; phone: string; type: string } | null;
  honoraryAcknowledgments: HonoraryAck[];
};

export default function ContratPortalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [showSignContract, setShowSignContract] = useState(false);
  const [showSignAck, setShowSignAck] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signed, setSigned] = useState(false);
  const [preview, setPreview] = useState<{ url: string; title: string; name: string } | null>(null);

  const fetchContract = useCallback(async () => {
    const res = await fetch(`/api/contrats/${id}`);
    if (res.ok) setContract(await res.json());
  }, [id]);

  useEffect(() => { fetchContract(); }, [fetchContract]);

  const signContract = async (dataUrl: string) => {
    setSaving(true);
    await fetch(`/api/contrats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ambassadorSignature: dataUrl }),
    });
    setSaving(false);
    setShowSignContract(false);
    setSigned(true);
    fetchContract();
  };

  const signAck = async (ackId: string, dataUrl: string) => {
    await fetch(`/api/contrats/${id}/reconnaissances/${ackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ambassadorSignature: dataUrl }),
    });
    setShowSignAck(null);
    fetchContract();
  };

  const downloadPDF = async () => {
    if (!contract) return;
    const { generateContractPDF } = await import("@/lib/pdf");
    generateContractPDF(contract);
  };

  const downloadAckPDF = async (ack: HonoraryAck) => {
    if (!contract) return;
    const { generateAcknowledgmentPDF } = await import("@/lib/pdf");
    generateAcknowledgmentPDF(ack, contract);
  };

  // Ouvre le PDF dans un modal de prévisualisation (sans forcer le téléchargement)
  const previewPDF = async () => {
    if (!contract) return;
    const { generateContractPDF } = await import("@/lib/pdf");
    const url = generateContractPDF(contract, "blob");
    if (typeof url === "string") {
      setPreview({ url, title: `Contrat ${contract.number}`, name: `contrat-${contract.number}.pdf` });
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

  const needsSignature = contract.status === "ENVOYE" && !contract.ambassadorSignature;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/portail/mes-contrats" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 font-mono">{contract.number}</h1>
            <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
              {CONTRACT_STATUS_LABELS[contract.status]}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">Créé le {formatDate(contract.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previewPDF}>
            <Eye className="w-4 h-4" /> Lire
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPDF}>
            <Download className="w-4 h-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Success message */}
      {signed && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">Contrat signé avec succès ! L&apos;agence en a été notifiée.</p>
        </div>
      )}

      {/* Sign alert */}
      {needsSignature && !signed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4">
          <p className="text-sm font-medium text-amber-900 mb-3">
            Ce contrat est prêt à être signé. Veuillez apposer votre signature électronique.
          </p>
          <Button onClick={() => setShowSignContract(true)}>
            ✍️ Signer le contrat
          </Button>
        </div>
      )}

      {/* Contract summary */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Résumé du contrat</h2></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {contract.propertyAddress && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-1">Bien concerné</p>
                <p className="font-medium">{contract.propertyAddress}</p>
              </div>
            )}
            {contract.propertyPrice && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Prix du bien</p>
                <p className="font-medium">{formatCurrency(contract.propertyPrice)}</p>
              </div>
            )}
            {contract.honoraires && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Honoraires agence</p>
                <p className="font-medium">{formatCurrency(contract.honoraires)}</p>
              </div>
            )}
            {(() => {
              const ht = contract.commissionAmount
                || (contract.commissionType === "FIXED" ? contract.commissionValue : 0);
              const ls = contract.ambassador?.legalStatus;
              const hasTVA = isAssujettTVA(ls);
              return ht ? (
                <>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Commission HT</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(ht)}</p>
                  </div>
                  {hasTVA ? (
                    <>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">TVA (20%)</p>
                        <p className="font-medium text-gray-500">{formatCurrency(commissionTVA(ht, ls))}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400 mb-1">Votre commission TTC</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(commissionTTC(ht, ls))}</p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Net &agrave; percevoir</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(ht)}</p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Votre commission</p>
                  <p className="font-medium text-gray-500">{contract.commissionValue}% des honoraires</p>
                </div>
              );
            })()}
            {contract.signedAt && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Signé le</p>
                <p className="font-medium">{formatDate(contract.signedAt)}</p>
              </div>
            )}
          </div>
          {contract.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
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
            <p className="text-xs text-gray-400 mb-2">La Brie Immobilière</p>
            {contract.adminSignature?.startsWith("data:image") ? (
              <Image src={contract.adminSignature} alt="Signature agence" width={400} height={96} className="border rounded-lg max-h-24 w-full object-contain bg-white" unoptimized />
            ) : contract.adminSignature ? (
              <div className="border rounded-lg h-20 flex items-center justify-center bg-white">
                <p className="text-sm italic text-blue-700 font-medium">{contract.adminSignature}</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg h-20 flex items-center justify-center">
                <p className="text-xs text-gray-400">Non signé</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">Votre signature</p>
            {contract.ambassadorSignature?.startsWith("data:image") ? (
              <Image src={contract.ambassadorSignature} alt="Votre signature" width={400} height={96} className="border rounded-lg max-h-24 w-full object-contain bg-white" unoptimized />
            ) : contract.ambassadorSignature ? (
              <div className="border rounded-lg h-20 flex items-center justify-center bg-white">
                <p className="text-sm italic text-blue-700 font-medium">{contract.ambassadorSignature}</p>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-lg h-20 flex items-center justify-center cursor-pointer hover:bg-blue-50"
                onClick={() => needsSignature && setShowSignContract(true)}
              >
                <p className="text-xs text-blue-500">{needsSignature ? "Cliquez pour signer" : "En attente"}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Honorary Acknowledgments */}
      {contract.honoraryAcknowledgments.length > 0 && (
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Reconnaissances d&apos;honoraires</h2></CardHeader>
          <CardContent className="space-y-3">
            {contract.honoraryAcknowledgments.map((ack) => (
              <div key={ack.id} className="p-4 border border-gray-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm font-semibold">{ack.number}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(ack.amount)}</p>
                    {ack.description && <p className="text-xs text-gray-400">{ack.description}</p>}
                    {ack.paidAt && <p className="text-xs text-green-600">Payée le {formatDate(ack.paidAt)}</p>}
                  </div>
                  <Badge className={HONORAIRE_STATUS_COLORS[ack.status]}>
                    {HONORAIRE_STATUS_LABELS[ack.status]}
                  </Badge>
                </div>
                {/* Signature progress */}
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ack.ambassadorSignature ? "bg-green-400" : "bg-gray-300"}`} />
                    <span className={ack.ambassadorSignature ? "text-green-700" : "text-gray-400"}>
                      {ack.ambassadorSignature ? "Votre signature" : "En attente de votre signature"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ack.adminSignature ? "bg-green-400" : "bg-gray-300"}`} />
                    <span className={ack.adminSignature ? "text-green-700" : "text-gray-400"}>
                      {ack.adminSignature ? "Contresignée par l'agence" : "Attente contresignature agence"}
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                  {(ack.status === "EN_ATTENTE" || ack.status === "VALIDEE") && !ack.ambassadorSignature && (
                    <Button size="sm" onClick={() => setShowSignAck(ack.id)}>
                      ✍️ Signer la reconnaissance
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => previewAckPDF(ack)}>
                    <Eye className="w-3 h-3" /> Lire
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadAckPDF(ack)}>
                    <Download className="w-3 h-3" /> PDF
                  </Button>
                </div>
                {ack.status === "CONTRESIGNEE" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-green-800">✅ Reconnaissance signée par les deux parties. Le versement de votre commission est en cours.</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contract signature modal */}
      {showSignContract && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Signer le contrat {contract.number}</h2>
                  <p className="text-sm text-gray-500 mt-1">En signant, vous acceptez les termes de ce contrat d&apos;apporteur d&apos;affaire.</p>
                </div>
                <button onClick={() => setShowSignContract(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </CardHeader>
            <CardContent>
              <SignaturePad onSave={signContract} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* PDF preview modal */}
      {preview && (
        <PdfPreviewModal
          url={preview.url}
          title={preview.title}
          downloadName={preview.name}
          onClose={closePreview}
        />
      )}

      {/* Acknowledgment signature modal */}
      {showSignAck && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Signer la reconnaissance d&apos;honoraires</h2>
                <button onClick={() => setShowSignAck(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </CardHeader>
            <CardContent>
              <SignaturePad onSave={(data) => signAck(showSignAck, data)} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
