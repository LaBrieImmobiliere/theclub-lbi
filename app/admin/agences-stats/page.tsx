import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, ClipboardList, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgencesStatsPage() {
  const agencies = await prisma.agency.findMany({
    include: {
      negotiators: {
        include: {
          _count: { select: { leads: true, ambassadors: true } },
          leads: { select: { contract: { select: { commissionAmount: true, status: true } } } },
        },
      },
      ambassadors: { select: { id: true } },
      leads: { select: { id: true, status: true } },
    },
  });

  const stats = agencies.map((a) => {
    const totalAmbassadors = a.ambassadors.length;
    const totalNegotiators = a.negotiators.length;
    const totalLeads = a.leads.length;
    const convertedLeads = a.leads.filter((l) => l.status === "SIGNE").length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const totalCommissions = a.negotiators.reduce((s, n) =>
      s + n.leads.reduce((s2, l) => s2 + (l.contract?.commissionAmount || 0), 0), 0
    );
    const paidCommissions = a.negotiators.reduce((s, n) =>
      s + n.leads.reduce((s2, l) => s2 + (l.contract?.status === "PAYE" ? (l.contract.commissionAmount || 0) : 0), 0), 0
    );

    return {
      id: a.id,
      name: a.name,
      city: a.city,
      totalNegotiators,
      totalAmbassadors,
      totalLeads,
      convertedLeads,
      conversionRate,
      totalCommissions,
      paidCommissions,
    };
  }).sort((a, b) => b.totalCommissions - a.totalCommissions);

  const globalLeads = stats.reduce((s, a) => s + a.totalLeads, 0);
  const globalCommissions = stats.reduce((s, a) => s + a.totalCommissions, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Comparatif agences
        </h1>
        <p className="text-gray-500 text-sm mt-1">Performance par agence</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="py-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.length}</p>
          <p className="text-xs text-gray-500">Agences</p>
        </CardContent></Card>
        <Card><CardContent className="py-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.reduce((s, a) => s + a.totalNegotiators, 0)}</p>
          <p className="text-xs text-gray-500">N&eacute;gociateurs</p>
        </CardContent></Card>
        <Card><CardContent className="py-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{globalLeads}</p>
          <p className="text-xs text-gray-500">Leads totaux</p>
        </CardContent></Card>
        <Card><CardContent className="py-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(globalCommissions)}</p>
          <p className="text-xs text-gray-500">Commissions</p>
        </CardContent></Card>
      </div>

      {/* Agency cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((a, i) => (
          <Card key={a.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center text-white font-bold ${i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-gray-200 text-gray-600"}`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.city}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{a.totalAmbassadors}</p>
                    <p className="text-[10px] text-gray-400">Ambassadeurs</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5 text-purple-500" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{a.totalLeads}</p>
                    <p className="text-[10px] text-gray-400">Leads</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <div>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(a.totalCommissions)}</p>
                    <p className="text-[10px] text-gray-400">Commissions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{a.conversionRate}%</p>
                    <p className="text-[10px] text-gray-400">Conversion</p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>Part du CA</span>
                  <span>{globalCommissions > 0 ? Math.round((a.totalCommissions / globalCommissions) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D1B280] rounded-full transition-all"
                    style={{ width: `${globalCommissions > 0 ? (a.totalCommissions / globalCommissions) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Aucune agence</p>
        </div>
      )}
    </div>
  );
}
