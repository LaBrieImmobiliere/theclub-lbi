"use client";

import { useState } from "react";
import { Copy, Check, Users, Link2, QrCode } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  code: string;
  inscriptionUrl: string;
  ambassadorCount: number;
  recentAmbassadors: {
    name: string | null;
    email: string;
    leadsCount: number;
    createdAt: string;
  }[];
}

export function NegociateurParrainagePage({ code, inscriptionUrl, ambassadorCount, recentAmbassadors }: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(inscriptionUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Rejoins The Club - La Brie Immobilière",
        text: `Deviens ambassadeur La Brie Immobilière et gagne des commissions sur tes recommandations. Inscris-toi ici :`,
        url: inscriptionUrl,
      });
    } else {
      copyLink();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Recrutement ambassadeurs
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Partagez votre lien pour inviter de nouveaux ambassadeurs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#030A24]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#030A24]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{ambassadorCount}</p>
          <p className="text-sm text-gray-500 mt-1">Ambassadeur{ambassadorCount !== 1 ? "s" : ""} recruté{ambassadorCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white border border-[#D1B280]/30 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#D1B280]/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#D1B280]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{recentAmbassadors.reduce((s, a) => s + a.leadsCount, 0)}</p>
          <p className="text-sm text-gray-500 mt-1">Recommandations générées</p>
        </div>
      </div>

      {/* Code de recrutement */}
      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-[#D1B280]" />
          <h2 className="font-semibold text-gray-900">Votre code de recrutement</h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Code */}
          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Code</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-[#030A24] text-[#D1B280] px-5 py-3 text-xl font-mono font-bold tracking-widest text-center">
                {code}
              </code>
              <button onClick={copyCode}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:border-[#D1B280] text-sm font-medium text-gray-600 hover:text-[#D1B280] transition-colors">
                {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>

          {/* Lien */}
          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Lien d&apos;inscription</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600 font-mono truncate">
                {inscriptionUrl}
              </div>
              <button onClick={copyLink}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:border-[#D1B280] text-sm font-medium text-gray-600 hover:text-[#D1B280] transition-colors flex-shrink-0">
                {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>

          {/* Share button */}
          <button onClick={shareLink}
            className="w-full py-3 bg-[#030A24] text-white text-sm font-medium hover:bg-[#0f1e40] transition-colors flex items-center justify-center gap-2">
            <Link2 className="w-4 h-4" />
            Partager le lien
          </button>

          <p className="text-xs text-gray-400 text-center">
            Les ambassadeurs qui s&apos;inscrivent via ce lien seront automatiquement rattachés à votre compte.
          </p>
        </div>
      </div>

      {/* Derniers ambassadeurs */}
      {recentAmbassadors.length > 0 && (
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Derniers ambassadeurs recrutés</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAmbassadors.map((a, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#030A24] text-white flex items-center justify-center text-sm font-bold">
                    {(a.name || a.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.name || a.email}</p>
                    <p className="text-xs text-gray-400">{a.email} · inscrit le {formatDate(a.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{a.leadsCount}</p>
                  <p className="text-xs text-gray-400">recommandation{a.leadsCount !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
