"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, Download, FileText, Receipt, Eye } from "lucide-react";
import { formatDate, formatCurrency, CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS } from "@/lib/utils";
import { PdfPreviewModal } from "@/components/pdf-preview-modal";

type HonoraryAck = {
  id: string;
  number: string;
  amount: number;
  description?: string;
  status: string;
  ambassadorSignature?: string;
  adminSignature?: string;
  createdAt: string;
};

type Contract = {
  id: string;
  number: string;
  status: string;
  commissionAmount?: number;
  commissionValue: number;
  commissionType: string;
  propertyAddress?: string;
  adminSignature?: string;
  ambassadorSignature?: string;
  createdAt: string;
  ambassador?: { user: { name: string; email: string } };
  lead?: { firstName: string; lastName: string } | null;
  honoraryAcknowledgments: HonoraryAck[];
};

export default function DocumentsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ url: string; title: string; name: string } | null>(null);

  const fetchContracts = useCallback(async () => {
    const res = await fetch("/api/contrats");
    if (res.ok) setContracts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const downloadContract = async (contract: Contract) => {
    const { generateContractPDF } = await import("@/lib/pdf");
    generateContractPDF(contract);
  };

  const downloadAck = async (ack: HonoraryAck, contract: Contract) => {
    const { generateAcknowledgmentPDF } = await import("@/lib/pdf");
    generateAcknowledgmentPDF(ack, { ...contract, adminSignature: contract.adminSignature });
  };

  const previewContract = async (contract: Contract) => {
    const { generateContractPDF } = await import("@/lib/pdf");
    const url = generateContractPDF(contract, "blob");
    if (typeof url === "string") {
      setPreview({ url, title: `Contrat ${contract.number}`, name: `contrat-${contract.number}.pdf` });
    }
  };
  const previewAck = async (ack: HonoraryAck, contract: Contract) => {
    const { generateAcknowledgmentPDF } = await import("@/lib/pdf");
    const url = generateAcknowledgmentPDF(ack, { ...contract, adminSignature: contract.adminSignature }, "blob");
    if (typeof url === "string") {
      setPreview({ url, title: `Reconnaissance ${ack.number}`, name: `reconnaissance-honoraires-${ack.number}.pdf` });
    }
  };
  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const signedContracts = contracts.filter(c => ["SIGNE", "PAYE"].includes(c.status));
  const allAcks = contracts.flatMap(c => c.honoraryAcknowledgments.map(a => ({ ...a, contract: c })));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes documents</h1>
        <p className="text-gray-500 mt-1">Téléchargez vos contrats signés et reconnaissances d&apos;honoraires</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{contracts.length}</p>
              <p className="text-xs text-gray-500">Contrats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{signedContracts.length}</p>
              <p className="text-xs text-gray-500">Contrats signés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{allAcks.length}</p>
              <p className="text-xs text-gray-500">Reconnaissances</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Contrats d&apos;apporteur d&apos;affaire</h2>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {contracts.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucun contrat disponible</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">N° Contrat</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Bien / Prospect</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Commission</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Signatures</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contracts.map(contract => (
                  <tr key={contract.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-mono text-xs font-semibold">{contract.number}</td>
                    <td className="px-6 py-3">
                      <p className="text-gray-900">{contract.propertyAddress || "-"}</p>
                      {contract.lead && (
                        <p className="text-xs text-gray-400">{contract.lead.firstName} {contract.lead.lastName}</p>
                      )}
                    </td>
                    <td className="px-6 py-3 font-medium text-green-700">
                      {contract.commissionAmount
                        ? formatCurrency(contract.commissionAmount)
                        : contract.commissionType === "FIXED"
                        ? formatCurrency(contract.commissionValue)
                        : `${contract.commissionValue}%`}
                    </td>
                    <td className="px-6 py-3">
                      <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${contract.adminSignature ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                          Agence
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${contract.ambassadorSignature ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                          Vous
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(contract.createdAt)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => previewContract(contract)} title="Lire">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => downloadContract(contract)} title="Télécharger">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {preview && (
        <PdfPreviewModal
          url={preview.url}
          title={preview.title}
          downloadName={preview.name}
          onClose={closePreview}
        />
      )}

      {/* Reconnaissances */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Reconnaissances d&apos;honoraires</h2>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {allAcks.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucune reconnaissance disponible</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">N° Reconnaissance</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Contrat lié</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Montant</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allAcks.map(ack => (
                  <tr key={ack.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-mono text-xs font-semibold">{ack.number}</td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{ack.contract.number}</td>
                    <td className="px-6 py-3 font-medium text-green-700">{formatCurrency(ack.amount)}</td>
                    <td className="px-6 py-3">
                      <Badge className={ack.status === "PAYEE" ? "bg-green-100 text-green-800" : ack.status === "VALIDEE" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}>
                        {ack.status === "PAYEE" ? "Payée" : ack.status === "VALIDEE" ? "Validée" : "En attente"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(ack.createdAt)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => previewAck(ack, ack.contract)} title="Lire">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => downloadAck(ack, ack.contract)} title="Télécharger">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
