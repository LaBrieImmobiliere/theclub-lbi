"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText, User, MapPin, Banknote } from "lucide-react";
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
  ambassador: { legalStatus?: string; user: { name: string; email: string; phone?: string } };
  lead?: { firstName: string; lastName: string; phone: string; type: string } | null;
  honoraryAcknowledgments: HonoraryAck[];
};

export default function NegociateurContratDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContract = useCallback(async () => {
    const res = await fetch(`/api/contrats/${id}`);
    if (res.ok) setContract(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchContract(); }, [fetchContract]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 w-48" />
          <div className="h-64 bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12 text-gray-400">
        Contrat introuvable.
      </div>
    );
  }

  const legalStatus = contract.ambassador?.legalStatus || "PARTICULIER";
  const hasTVA = isAssujettTVA(legalStatus);
  const ht = contract.commissionAmount || 0;
  const tva = hasTVA ? commissionTVA(ht) : 0;
  const ttc = hasTVA ? commissionTTC(ht, legalStatus) : ht;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/negociateur/mes-contrats"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-deep"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux contrats
      </Link>

      {/* Header */}
      <Card className="rounded-none">
        <div className="bg-brand-deep px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white flex items-center gap-2" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                <FileText className="w-5 h-5 text-brand-gold" />
                Contrat {contract.number}
              </h1>
              <p className="text-sm text-white/50 mt-1">
                Créé le {formatDate(contract.createdAt)}
              </p>
            </div>
            <Badge className={CONTRACT_STATUS_COLORS[contract.status] || "bg-gray-100 text-gray-600"}>
              {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Contract Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Property */}
        <Card className="rounded-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-gold" />
              <h2 className="font-semibold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Bien</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{contract.propertyAddress || "Non renseigné"}</p>
            {contract.propertyPrice && (
              <p className="text-sm text-gray-500 mt-1">
                Prix : {formatCurrency(contract.propertyPrice)}
              </p>
            )}
            {contract.honoraires && (
              <p className="text-sm text-gray-500 mt-1">
                Honoraires : {formatCurrency(contract.honoraires)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ambassador */}
        <Card className="rounded-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-gold" />
              <h2 className="font-semibold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Ambassadeur</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-gray-900">{contract.ambassador?.user?.name || "—"}</p>
            <p className="text-sm text-gray-500">{contract.ambassador?.user?.email}</p>
            {contract.ambassador?.user?.phone && (
              <p className="text-sm text-gray-500">{contract.ambassador.user.phone}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead info */}
      {contract.lead && (
        <Card className="rounded-none">
          <CardHeader>
            <h2 className="font-semibold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Prospect recommandé</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nom</p>
                <p className="font-medium">{contract.lead.firstName} {contract.lead.lastName}</p>
              </div>
              <div>
                <p className="text-gray-500">Téléphone</p>
                <p className="font-medium">{contract.lead.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Type</p>
                <p className="font-medium">{contract.lead.type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission */}
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-brand-gold" />
            <h2 className="font-semibold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Commission</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Montant HT</span>
              <span className="text-lg font-bold text-green-700">{formatCurrency(ht)}</span>
            </div>
            {hasTVA && (
              <>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-500">TVA (20%)</span>
                  <span className="text-sm text-gray-600">{formatCurrency(tva)}</span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-green-200">
                  <span className="text-sm font-medium text-gray-700">Montant TTC</span>
                  <span className="text-lg font-bold text-green-700">{formatCurrency(ttc)}</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 text-sm text-gray-500">
            <p>Type : {contract.commissionType === "PERCENTAGE" ? `${contract.commissionValue}% des honoraires` : "Montant fixe"}</p>
            {contract.signedAt && <p>Signé le : {formatDate(contract.signedAt)}</p>}
            {contract.paidAt && <p>Payé le : {formatDate(contract.paidAt)}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card className="rounded-none">
        <CardHeader>
          <h2 className="font-semibold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Signatures</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 p-3 min-h-[100px]">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Agence</p>
              {contract.adminSignature?.startsWith("data:image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={contract.adminSignature} alt="Signature agence" className="max-h-16 object-contain" />
              ) : contract.adminSignature ? (
                <p className="text-sm italic text-blue-700 font-medium">{contract.adminSignature}</p>
              ) : (
                <p className="text-sm text-gray-300 italic">Non signé</p>
              )}
            </div>
            <div className="border border-gray-200 p-3 min-h-[100px]">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Ambassadeur</p>
              {contract.ambassadorSignature?.startsWith("data:image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={contract.ambassadorSignature} alt="Signature ambassadeur" className="max-h-16 object-contain" />
              ) : contract.ambassadorSignature ? (
                <p className="text-sm italic text-blue-700 font-medium">{contract.ambassadorSignature}</p>
              ) : (
                <p className="text-sm text-gray-300 italic">Non signé</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Honorary Acknowledgments */}
      {contract.honoraryAcknowledgments.length > 0 && (
        <Card className="rounded-none">
          <CardHeader>
            <h2 className="font-semibold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
              Reconnaissances d&apos;honoraires ({contract.honoraryAcknowledgments.length})
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-brand-cream">
                  <th className="px-6 py-3 font-medium text-brand-deep">N°</th>
                  <th className="px-6 py-3 font-medium text-brand-deep">Montant</th>
                  <th className="px-6 py-3 font-medium text-brand-deep">Description</th>
                  <th className="px-6 py-3 font-medium text-brand-deep">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contract.honoraryAcknowledgments.map(ack => (
                  <tr key={ack.id} className="hover:bg-brand-cream/50">
                    <td className="px-6 py-3 font-mono text-xs">{ack.number}</td>
                    <td className="px-6 py-3 font-medium">{formatCurrency(ack.amount)}</td>
                    <td className="px-6 py-3 text-gray-500">{ack.description || "—"}</td>
                    <td className="px-6 py-3">
                      <Badge className={HONORAIRE_STATUS_COLORS[ack.status] || "bg-gray-100 text-gray-600"}>
                        {HONORAIRE_STATUS_LABELS[ack.status] || ack.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {contract.notes && (
        <Card className="rounded-none">
          <CardHeader>
            <h2 className="font-semibold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Notes</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{contract.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
