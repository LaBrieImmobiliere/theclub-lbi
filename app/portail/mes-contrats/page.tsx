"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";
import {
  formatDate,
  formatCurrency,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
} from "@/lib/utils";
import Link from "next/link";

type Contract = {
  id: string;
  number: string;
  status: string;
  commissionType: string;
  commissionValue: number;
  commissionAmount?: number;
  propertyAddress?: string;
  createdAt: string;
  honoraryAcknowledgments: { id: string; status: string; amount: number }[];
};

export default function MesContratsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);

  const fetchContracts = useCallback(async () => {
    const res = await fetch("/api/contrats");
    const data = await res.json();
    setContracts(data);
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const pendingSign = contracts.filter(
    (c) => c.status === "ENVOYE" && !c.honoraryAcknowledgments.every((a) => a.status === "PAYEE")
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes contrats</h1>
        <p className="text-gray-500 mt-1">{contracts.length} contrat{contracts.length > 1 ? "s" : ""}</p>
      </div>

      {pendingSign.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-sm text-blue-800">
            <strong>{pendingSign.length} contrat{pendingSign.length > 1 ? "s" : ""}</strong> en attente de votre signature.
          </p>
        </div>
      )}

      {contracts.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">Aucun contrat</h3>
          <p className="text-sm text-gray-500">
            Vos contrats d&apos;apporteur d&apos;affaire apparaîtront ici une fois créés par l&apos;agence.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => {
            const pendingAcks = contract.honoraryAcknowledgments.filter(
              (a) => a.status === "EN_ATTENTE" || a.status === "VALIDEE"
            );
            return (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <p className="font-mono font-semibold text-gray-900">{contract.number}</p>
                        <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
                          {CONTRACT_STATUS_LABELS[contract.status]}
                        </Badge>
                        {contract.status === "ENVOYE" && (
                          <Badge className="bg-amber-100 text-amber-700 animate-pulse">
                            ✍️ Signature requise
                          </Badge>
                        )}
                      </div>

                      {contract.propertyAddress && (
                        <p className="text-sm text-gray-600">{contract.propertyAddress}</p>
                      )}

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">Commission</p>
                          <p className="font-semibold text-green-700">
                            {contract.commissionAmount
                              ? formatCurrency(contract.commissionAmount)
                              : contract.commissionType === "FIXED"
                              ? formatCurrency(contract.commissionValue)
                              : `${contract.commissionValue}%`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Reconnaissances</p>
                          <p className="font-medium text-gray-700">
                            {contract.honoraryAcknowledgments.length}
                            {pendingAcks.length > 0 && (
                              <span className="ml-1 text-amber-600">({pendingAcks.length} en attente)</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Créé le</p>
                          <p className="font-medium text-gray-700">{formatDate(contract.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    <Link href={`/portail/mes-contrats/${contract.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" /> Voir
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
