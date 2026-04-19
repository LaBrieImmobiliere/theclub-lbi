import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trophy, Medal, Star, TrendingUp, ClipboardList } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const ambassadors = await prisma.ambassador.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { name: true, email: true, image: true } },
      leads: { select: { id: true, status: true } },
      contracts: { select: { id: true, commissionAmount: true, status: true } },
      negotiator: { include: { user: { select: { name: true } }, agency: { select: { name: true } } } },
    },
  });

  // Calculate rankings
  const ranked = ambassadors.map((a) => ({
    id: a.id,
    name: a.user.name || a.user.email,
    image: a.user.image,
    code: a.code,
    agency: a.negotiator?.agency?.name || null,
    negotiator: a.negotiator?.user?.name || null,
    totalLeads: a.leads.length,
    convertedLeads: a.leads.filter((l) => l.status === "SIGNE").length,
    totalContracts: a.contracts.length,
    totalCommissions: a.contracts.reduce((s, c) => s + (c.commissionAmount || 0), 0),
    paidCommissions: a.contracts.filter((c) => c.status === "PAYE").reduce((s, c) => s + (c.commissionAmount || 0), 0),
    conversionRate: a.leads.length > 0 ? Math.round((a.contracts.length / a.leads.length) * 100) : 0,
  }));

  // Sort by total commissions
  const byCommissions = [...ranked].sort((a, b) => b.totalCommissions - a.totalCommissions);
  // Sort by leads
  const byLeads = [...ranked].sort((a, b) => b.totalLeads - a.totalLeads);
  // Sort by conversion rate (min 3 leads)
  const byConversion = [...ranked].filter((a) => a.totalLeads >= 3).sort((a, b) => b.conversionRate - a.conversionRate);

  const podiumColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];
  const podiumBg = ["bg-yellow-50 border-yellow-200", "bg-gray-50 border-gray-200", "bg-amber-50 border-amber-200"];
  const podiumIcons = [Trophy, Medal, Star];

  const totalGlobalCommissions = ranked.reduce((s, a) => s + a.totalCommissions, 0);
  const totalGlobalLeads = ranked.reduce((s, a) => s + a.totalLeads, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Classement ambassadeurs
        </h1>
        <p className="text-gray-500 text-sm mt-1">Performance de votre r&eacute;seau</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{ranked.length}</p>
            <p className="text-xs text-gray-500">Ambassadeurs actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalGlobalLeads}</p>
            <p className="text-xs text-gray-500">Recommandations totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(totalGlobalCommissions)}</p>
            <p className="text-xs text-gray-500">Commissions totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalGlobalLeads > 0 ? Math.round((ranked.reduce((s, a) => s + a.totalContracts, 0) / totalGlobalLeads) * 100) : 0}%</p>
            <p className="text-xs text-gray-500">Taux de conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Podium - Top 3 commissions */}
      {byCommissions.length >= 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold text-gray-900">Podium — Commissions</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {byCommissions.slice(0, 3).map((a, i) => {
                const Icon = podiumIcons[i];
                return (
                  <div key={a.id} className={`border ${podiumBg[i]} p-4 text-center`}>
                    <Icon className={`w-8 h-8 ${podiumColors[i]} mx-auto mb-2`} />
                    {a.image ? (
                      <Image src={a.image} alt={a.name} width={56} height={56} className="w-14 h-14 object-cover mx-auto mb-2" unoptimized />
                    ) : (
                      <div className="w-14 h-14 bg-[#030A24] text-white flex items-center justify-center text-xl font-bold mx-auto mb-2">
                        {a.name[0].toUpperCase()}
                      </div>
                    )}
                    <p className="font-bold text-gray-900 text-sm">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.agency || "—"}</p>
                    <p className="text-lg font-bold text-green-600 mt-2">{formatCurrency(a.totalCommissions)}</p>
                    <p className="text-[10px] text-gray-400">{a.totalLeads} leads · {a.totalContracts} contrats</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking by leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-500" />
              <h2 className="font-semibold text-gray-900">Top recommandations</h2>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {byLeads.slice(0, 10).map((a, i) => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < 3 ? "bg-[#D1B280] text-white" : "bg-gray-100 text-gray-600"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                    <p className="text-[10px] text-gray-400">{a.agency || "—"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{a.totalLeads}</p>
                    <p className="text-[10px] text-gray-400">leads</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ranking by conversion */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h2 className="font-semibold text-gray-900">Meilleur taux de conversion</h2>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {byConversion.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Minimum 3 leads pour appara&icirc;tre</p>
              ) : (
                byConversion.slice(0, 10).map((a, i) => (
                  <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < 3 ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                      <p className="text-[10px] text-gray-400">{a.totalLeads} leads · {a.totalContracts} contrats</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-600">{a.conversionRate}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full ranking table */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Classement complet</h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-medium text-gray-500 w-10">#</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Ambassadeur</th>
                  <th className="px-5 py-3 font-medium text-gray-500 hidden sm:table-cell">Agence</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-right">Leads</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-right hidden sm:table-cell">Contrats</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-right hidden sm:table-cell">Conv.</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-right">Commissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byCommissions.map((a, i) => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-bold text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{a.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{a.code}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{a.agency || "—"}</td>
                    <td className="px-5 py-3 text-right font-medium">{a.totalLeads}</td>
                    <td className="px-5 py-3 text-right hidden sm:table-cell">{a.totalContracts}</td>
                    <td className="px-5 py-3 text-right hidden sm:table-cell">{a.conversionRate}%</td>
                    <td className="px-5 py-3 text-right font-bold text-green-600">{formatCurrency(a.totalCommissions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
