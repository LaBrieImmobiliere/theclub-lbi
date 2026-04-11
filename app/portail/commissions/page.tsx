import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
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

  const contracts = ambassador.contracts;

  // Aggregate totals
  const totalEarned = contracts
    .filter((c) => c.status === "PAYE")
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);

  const totalPending = contracts
    .filter((c) => c.status === "SIGNE" || c.status === "ENVOYE")
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);

  const totalAll = contracts.reduce((s, c) => s + (c.commissionAmount || 0), 0);

  const signedCount = contracts.filter((c) => c.status === "SIGNE" || c.status === "PAYE").length;

  // Current year total
  const currentYear = new Date().getFullYear();
  const yearTotal = contracts
    .filter((c) => new Date(c.createdAt).getFullYear() === currentYear)
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes commissions</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Suivi de vos gains depuis le début de votre activité
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Payé</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEarned)}</p>
          <p className="text-xs text-gray-400 mt-1">Commissions encaissées</p>
        </div>

        <div className="bg-white border border-[#D1B280]/30 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#D1B280]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#D1B280]" />
            </div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">En attente</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-gray-400 mt-1">Contrats signés non payés</p>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{currentYear}</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(yearTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">Total cette année</p>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-purple-50 flex items-center justify-center">
              <Coins className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total cumulé</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAll)}</p>
          <p className="text-xs text-gray-400 mt-1">{signedCount} transaction{signedCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Commission table */}
      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Détail par contrat</h2>
        </div>

        {contracts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Coins className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucune commission pour l&apos;instant</p>
            <p className="text-sm text-gray-400 mt-1">
              Les commissions apparaîtront ici dès qu&apos;un contrat est créé pour l&apos;une de vos recommandations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Contrat</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Prospect</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Commission</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-mono text-gray-900 text-xs">{c.number}</td>
                    <td className="px-6 py-3 text-gray-700">
                      {c.lead ? `${c.lead.firstName} ${c.lead.lastName}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      {c.commissionAmount ? (
                        <span className={`font-semibold ${c.status === "PAYE" ? "text-green-700" : "text-gray-700"}`}>
                          {formatCurrency(c.commissionAmount)}
                        </span>
                      ) : c.commissionType === "FIXED" ? (
                        <span className="text-gray-500">{formatCurrency(c.commissionValue)}</span>
                      ) : (
                        <span className="text-gray-500">{c.commissionValue}%</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[c.status] || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
