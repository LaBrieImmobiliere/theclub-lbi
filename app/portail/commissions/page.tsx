import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, commissionTTC, isAssujettTVA } from "@/lib/utils";
import { Coins, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CommissionsPage() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");

  const user = session.user as { id?: string; role?: string };
  if (user.role !== "AMBASSADOR") redirect("/portail/tableau-de-bord");

  const ambassador = await prisma.ambassador.findUnique({
    where: { userId: user.id },
    include: {
      contracts: {
        orderBy: { createdAt: "desc" },
        include: {
          lead: { select: { firstName: true, lastName: true } },
          honoraryAcknowledgments: true,
        },
      },
    },
  });

  if (!ambassador) redirect("/auth/connexion");

  const ls = ambassador.legalStatus;
  const hasTVA = isAssujettTVA(ls);
  const contracts = ambassador.contracts;

  // Helper: commission for a contract = commissionAmount or sum of acknowledgment amounts
  const getCommission = (c: typeof contracts[0]) => {
    if (c.commissionAmount) return c.commissionAmount;
    return c.honoraryAcknowledgments.reduce((s, a) => s + (a.amount || 0), 0);
  };

  // Aggregate totals
  const totalEarned = contracts
    .filter((c) => c.status === "PAYE")
    .reduce((s, c) => s + getCommission(c), 0);

  const totalPending = contracts
    .filter((c) => c.status === "SIGNE" || c.status === "ENVOYE")
    .reduce((s, c) => s + getCommission(c), 0);

  const totalAll = contracts.reduce((s, c) => s + getCommission(c), 0);

  const signedCount = contracts.filter((c) => c.status === "SIGNE" || c.status === "PAYE").length;

  // Current year total
  const currentYear = new Date().getFullYear();
  const yearTotal = contracts
    .filter((c) => new Date(c.createdAt).getFullYear() === currentYear)
    .reduce((s, c) => s + getCommission(c), 0);

  // Monthly commission data (last 6 months) for chart
  const now = new Date();
  const monthNames = ["Jan","Fev","Mar","Avr","Mai","Juin","Juil","Aout","Sep","Oct","Nov","Dec"];
  const monthlyCommissions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const amount = contracts
      .filter((c) => {
        const cd = new Date(c.createdAt);
        return cd.getFullYear() === y && cd.getMonth() === m && (c.status === "PAYE" || c.status === "SIGNE");
      })
      .reduce((s, c) => s + getCommission(c), 0);
    return { name: monthNames[m], amount };
  });
  const maxCommission = Math.max(...monthlyCommissions.map((m) => m.amount), 1);

  const STATUS_LABEL: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYE: "En attente signature",
    SIGNE: "Signé — en attente paiement",
    PAYE: "Payé",
    ANNULE: "Annulé",
  };

  const STATUS_CLASS: Record<string, string> = {
    BROUILLON: "bg-gray-100 text-gray-600",
    ENVOYE: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    SIGNE: "bg-blue-50 text-blue-700 border border-blue-200",
    PAYE: "bg-green-50 text-green-700 border border-green-200",
    ANNULE: "bg-red-50 text-red-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes commissions</h1>
        <p className="text-gray-400 mt-1 text-sm">Suivi de vos gains depuis le d&eacute;but de votre activit&eacute;</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{hasTVA ? "Pay\u00e9 TTC" : "Pay\u00e9"}</p>
          </div>
          <p className="text-xl font-bold text-green-400">{formatCurrency(commissionTTC(totalEarned, ls))}</p>
          <p className="text-[10px] text-gray-500 mt-1">HT : {formatCurrency(totalEarned)}</p>
        </div>

        <div className="bg-white/5 border border-[#D1B280]/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#D1B280]/10 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#D1B280]" />
            </div>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">En attente</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(commissionTTC(totalPending, ls))}</p>
          <p className="text-[10px] text-gray-500 mt-1">HT : {formatCurrency(totalPending)}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{currentYear}</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(commissionTTC(yearTotal, ls))}</p>
          <p className="text-[10px] text-gray-500 mt-1">HT : {formatCurrency(yearTotal)}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Coins className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Total cumul&eacute;</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(commissionTTC(totalAll, ls))}</p>
          <p className="text-[10px] text-gray-500 mt-1">HT : {formatCurrency(totalAll)} &middot; {signedCount} transaction{signedCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Commission history chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h2 className="font-semibold text-white mb-4">&Eacute;volution des gains</h2>
        <div className="flex items-end gap-2 h-32">
          {monthlyCommissions.map((m) => (
            <div key={m.name} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-gray-400 font-medium">
                {m.amount > 0 ? formatCurrency(m.amount) : ""}
              </span>
              <div
                className="w-full bg-[#D1B280] rounded-t transition-all duration-500"
                style={{
                  height: `${(m.amount / maxCommission) * 100}%`,
                  minHeight: m.amount > 0 ? 4 : 0,
                }}
              />
              <span className="text-[9px] text-gray-500">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commission list — mobile cards */}
      <div>
        <h2 className="font-semibold text-white mb-3">D&eacute;tail par contrat</h2>

        {contracts.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-16 text-center">
            <Coins className="w-10 h-10 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Aucune commission pour l&apos;instant</p>
            <p className="text-sm text-gray-500 mt-1">Les commissions apparaîtront ici d&egrave;s qu&apos;un contrat est cr&eacute;&eacute;.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((c) => (
              <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm text-[#D1B280]">{c.number}</p>
                    <p className="text-sm text-white mt-0.5">
                      {c.lead ? `${c.lead.firstName} ${c.lead.lastName}` : "—"}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-medium rounded-full ${
                    c.status === "PAYE" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                    c.status === "SIGNE" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    c.status === "ENVOYE" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                    "bg-white/5 text-gray-400 border border-white/10"
                  }`}>
                    {STATUS_LABEL[c.status] || c.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <p className="text-[10px] text-gray-500">Commission</p>
                    <p className={`text-lg font-bold ${c.status === "PAYE" ? "text-green-400" : "text-gray-900 dark:text-white"}`}>
                      {getCommission(c) > 0 ? formatCurrency(commissionTTC(getCommission(c), ls)) : `${c.commissionValue}%`}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500">{formatDate(c.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
