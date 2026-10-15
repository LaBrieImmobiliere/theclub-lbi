"use client";

/**
 * Signature contrat 100% in-app — contenu lisible + checkbox + signature pad
 * sur un seul écran, sans télécharger de PDF. Le PDF complet reste accessible
 * via "Voir le contrat complet" pour les sceptiques.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/components/signature-pad";
import { formatCurrency, commissionTTC, isAssujettTVA } from "@/lib/utils";
import { ScrollText, FileText, CheckCircle2 } from "lucide-react";

interface ContractSummary {
  id: string;
  number: string;
  commissionType: string;
  commissionValue: number;
  commissionAmount?: number;
  propertyAddress?: string;
  propertyPrice?: number;
  honoraires?: number;
  notes?: string;
  ambassador: { legalStatus?: string; user: { name: string } };
  lead?: { firstName: string; lastName: string } | null;
}

interface Props {
  contract: ContractSummary;
  onCancel: () => void;
  onSign: (dataUrl: string) => void | Promise<void>;
  onReadFull: () => void;
}

export function InAppContractSignModal({ contract, onCancel, onSign, onReadFull }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [showPad, setShowPad] = useState(false);

  const ambassadorName = contract.ambassador?.user?.name ?? "l'ambassadeur";
  const legalStatus = contract.ambassador?.legalStatus;
  const ht = contract.commissionAmount
    ?? (contract.commissionType === "FIXED" ? contract.commissionValue : 0);
  const hasTVA = isAssujettTVA(legalStatus);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-[#D1B280] flex-shrink-0" />
                Signature du contrat {contract.number}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Lisez les points-clés et signez directement — tout se passe ici.
              </p>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
              ✕
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Résumé des conditions principales */}
          <div className="bg-brand-cream/60 border-l-4 border-brand-gold rounded-r-lg p-4 space-y-3 text-sm">
            <p className="font-semibold text-[#030A24]">Ce que vous signez :</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <span>
                  Vous intervenez en qualité d&apos;<strong>apporteur d&apos;affaires occasionnel</strong> pour
                  La Brie Immobilière. Vous ne négociez, ni ne concluez aucune opération immobilière
                  (hors Loi Hoguet).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <span>
                  Pour chaque vente conclue grâce à votre recommandation, vous percevez une commission :{" "}
                  {contract.commissionType === "PERCENTAGE" ? (
                    <strong>{contract.commissionValue}% des frais d&apos;agence</strong>
                  ) : (
                    <strong>{formatCurrency(contract.commissionValue)}</strong>
                  )}
                  {ht > 0 && (
                    <> — soit <strong className="text-green-700">
                      {formatCurrency(commissionTTC(ht, legalStatus))}
                    </strong>{hasTVA ? " TTC" : " net"} pour ce dossier.</>
                  )}
                </span>
              </li>
              {contract.lead && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                  <span>
                    Dossier concerné : <strong>{contract.lead.firstName} {contract.lead.lastName}</strong>
                    {contract.propertyAddress && <> — {contract.propertyAddress}</>}.
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <span>
                  La commission vous est versée après l&apos;acte authentique chez le notaire et le
                  paiement effectif des honoraires d&apos;agence.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <span>
                  Vous vous engagez à respecter la <strong>confidentialité</strong> des informations
                  partagées (coordonnées, prix, etc.) et à déclarer vos gains à l&apos;administration
                  fiscale.
                </span>
              </li>
            </ul>
            <button
              onClick={onReadFull}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D1B280] hover:underline mt-1"
            >
              <FileText className="w-3.5 h-3.5" />
              Voir le contrat complet (PDF)
            </button>
          </div>

          {/* Checkbox acceptation */}
          <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[#D1B280] flex-shrink-0"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              Je, <strong>{ambassadorName}</strong>, reconnais avoir pris connaissance des conditions
              ci-dessus et du contrat complet, et je les accepte sans réserve.
            </span>
          </label>

          {/* Signature pad - révélé après acceptation */}
          {!showPad ? (
            <Button
              type="button"
              onClick={() => setShowPad(true)}
              disabled={!accepted}
              className="w-full py-5 text-base"
            >
              ✍️ Procéder à la signature
            </Button>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Signez dans le cadre ci-dessous
                </p>
                <button
                  type="button"
                  onClick={() => setShowPad(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Revenir à la lecture
                </button>
              </div>
              <SignaturePad onSave={onSign} />
            </div>
          )}

          {/* Mention légale */}
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            Votre signature électronique a valeur juridique selon les articles 1366 et 1367 du Code
            civil. Un double signé par les deux parties vous sera envoyé après contresignature de
            La Brie Immobilière.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
