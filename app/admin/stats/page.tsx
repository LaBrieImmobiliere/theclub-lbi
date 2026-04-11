import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LeadsBarChart, ActivityLineChart, StatusPieChart } from "@/components/admin/stats-chart";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Users, FileText, Euro } from "lucide-react";

export const dynamic = "force-dynamic";

function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleDateString("fr-FR", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return months;
}

export default async function StatsPage() {
  const months = getLast6Months();

  const [allLeads, allContracts, allAmbassadors] = await Promise.all([
    prisma.lead.findMany({ select: { status: true, createdAt: true, ambassadorId: true } }),
    prisma.contract.findMany({ select: { status: true, commissionAmount: true, createdAt: true, commissionValue: true, commissionType: true } }),
    prisma.ambassador.findMany({
      include: {
        user: { select: { name: true } },
        _count: { select: { leads: true, contracts: true } },
      },
    }),
  ]);

  // Activity over 6 months
  const activityData = months.map(({ label, year, month }) => ({
    name: label,
    leads: allLeads.filter(l => {
      const d = new Date(l.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length,
    contrats: allContracts.filter(c => {
      const d = new Date(c.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length,
  }));

  // Leads by ambassador (top 6)
  const leadsByAmb = allAmbassadors
    .sort((a, b) => b._count.leads - a._count.leads)
    .slice(0, 6)
    .map(a => ({ name: a.user.name?.split(" ")[0] || "?", value: a._count.leads }));

  // Lead status distribution
  const statusGroups: Record<string, number> = {};
  allLeads.forEach(l => {
    statusGroups[l.status] = (statusGroups[l.status] || 0) + 1;
  });
  const statusLabels: Record<string, string> = { NOUVEAU: "Nouveau", CONTACTE: "Contacté", EN_COURS: "En cours", SIGNE: "Signé", PERDU: "Perdu" };
  const pieData = Object.entries(statusGroups).map(([k, v]) => ({ name: statusLabels[k] || k, value: v }));

  // KPIs
  const totalCommissions = allContracts
    .filter(c => ["SIGNE", "PAYE"].includes(c.status))
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);
  const paidCommissions = allContracts
    .filter(c => c.status === "PAYE")
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);
  const conversionRate = allLeads.length > 0
    ? Math.round((allLeads.filter(l => l.status === "SIGNE").length / allLeads.length) * 100)
    : 0;

  const kpis = [
    { label: "Recommandations totales", value: allLeads.length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Taux de conversion", value: `${conversionRate}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Commissions totales dues", value: formatCurrency(totalCommissions), icon: Euro, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Commissions versées", value: formatCurrency(paidCommissions), icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-gray-500 mt-1">Vue analytique de votre réseau d'ambassadeurs</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
                <p className="text-xs text-gray-500 leading-tight">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity line chart */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Activité (6 derniers mois)</h2>
          </CardHeader>
          <CardContent>
            <ActivityLineChart data={activityData} />
          </CardContent>
        </Card>

        {/* Lead status pie */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Statut des recommandations</h2>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <StatusPieChart data={pieData} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-16">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* Top ambassadors bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Top ambassadeurs par recommandations</h2>
          </CardHeader>
          <CardContent>
            {leadsByAmb.length > 0 ? (
              <LeadsBarChart data={leadsByAmb} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-16">Aucun ambassadeur</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ambassador ranking table */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Classement des ambassadeurs</h2>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">#</th>
                <th className="px-6 py-3 font-medium text-gray-500">Ambassadeur</th>
                <th className="px-6 py-3 font-medium text-gray-500">Recommandations</th>
                <th className="px-6 py-3 font-medium text-gray-500">Contrats</th>
                <th className="px-6 py-3 font-medium text-gray-500">Taux conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allAmbassadors
                .sort((a, b) => b._count.leads - a._count.leads)
                .map((amb, i) => {
                  const rate = amb._count.leads > 0
                    ? Math.round((amb._count.contracts / amb._count.leads) * 100)
                    : 0;
                  return (
                    <tr key={amb.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3">
                        <span className={`text-sm font-bold ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-600" : "text-gray-300"}`}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900">{amb.user.name}</td>
                      <td className="px-6 py-3 text-gray-600">{amb._count.leads}</td>
                      <td className="px-6 py-3 text-gray-600">{amb._count.contracts}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-16">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-xs text-gray-600">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
