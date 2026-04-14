import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, ClipboardList, FileText, TrendingUp,
  Clock, Coins, Percent, Bell, ArrowRight,
  Download, Trophy,
} from "lucide-react";
import {
  formatCurrency, formatDate,
  LEAD_STATUS_COLORS, LEAD_STATUS_LABELS,
  CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS,
} from "@/lib/utils";
import Link from "next/link";
import DashboardChart from "@/components/portal/dashboard-chart";
import { CAGauge } from "@/components/admin/ca-gauge";
import { KPIComparison } from "@/components/admin/kpi-comparison";
import { ExportCommissionsButton } from "@/components/admin/export-commissions-button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    ambassadorCount,
    leadCount,
    contractCount,
    pendingLeads,
    allContractsRaw,
    recentLeads,
    recentContracts,
    allLeads,
    topAmbassadors,
  ] = await Promise.all([
    prisma.ambassador.count({ where: { status: "ACTIVE" } }),
    prisma.lead.count(),
    prisma.contract.count(),
    prisma.lead.count({ where: { status: "NOUVEAU" } }),
    prisma.contract.findMany({
      take: 500,
      select: { commissionAmount: true, honoraires: true, status: true, createdAt: true },
    }),
    prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { ambassador: { include: { user: { select: { name: true } } } } },
    }),
    prisma.contract.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { ambassador: { include: { user: { select: { name: true } } } } },
    }),
    prisma.lead.findMany({
      take: 500,
      select: { createdAt: true, contract: { select: { createdAt: true } } },
    }),
    prisma.ambassador.findMany({
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { leads: true, contracts: true } },
        contracts: { where: { status: "PAYE" }, select: { commissionAmount: true } },
      },
      orderBy: { leads: { _count: "desc" } },
    }),
  ]);

  const allContracts = allContractsRaw;

  // CA calculations
  // Violet: CA potentiel HT = total honoraires de tous les contrats
  const caHonorairesPotentiel = allContracts.reduce((s, c) => s + (c.honoraires || 0), 0);
  // Bleu: CA validé = honoraires des contrats signés/payés (affaires concrétisées)
  const caValide = allContracts
    .filter((c) => ["SIGNE", "PAYE"].includes(c.status))
    .reduce((s, c) => s + (c.honoraires || 0), 0);
  // Orange: Commissions potentielles à verser (contrats en cours, non payés)
  const commissionsPotentielles = allContracts
    .filter((c) => ["ENVOYE", "SIGNE"].includes(c.status))
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);
  // Vert: Commissions effectivement versées
  const commissionsVersees = allContracts
    .filter((c) => c.status === "PAYE")
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);

  const conversionRate = leadCount > 0 ? Math.round((contractCount / leadCount) * 100) : 0;

  // Month-over-month KPIs
  const currentDate = new Date();
  const thisMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

  const thisMonthLeads = allLeads.filter(l => new Date(l.createdAt) >= thisMonthStart).length;
  const lastMonthLeads = allLeads.filter(l => new Date(l.createdAt) >= lastMonthStart && new Date(l.createdAt) < thisMonthStart).length;

  const thisMonthContracts = allContracts.filter(c => new Date(c.createdAt) >= thisMonthStart).length;
  const lastMonthContracts = allContracts.filter(c => new Date(c.createdAt) >= lastMonthStart && new Date(c.createdAt) < thisMonthStart).length;

  const thisMonthCA = allContracts.filter(c => new Date(c.createdAt) >= thisMonthStart).reduce((s, c) => s + (c.commissionAmount || 0), 0);
  const lastMonthCA = allContracts.filter(c => new Date(c.createdAt) >= lastMonthStart && new Date(c.createdAt) < thisMonthStart).reduce((s, c) => s + (c.commissionAmount || 0), 0);

  const [thisMonthAmbassadors, lastMonthAmbassadors] = await Promise.all([
    prisma.ambassador.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.ambassador.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
  ]);

  // Chart data (6 months)
  const now = new Date();
  const monthNames = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const y = d.getFullYear(), m = d.getMonth();
    return {
      name: monthNames[m],
      leads: allLeads.filter((l) => { const c = new Date(l.createdAt); return c.getFullYear() === y && c.getMonth() === m; }).length,
      contrats: allLeads.filter((l) => { if (!l.contract) return false; const c = new Date(l.contract.createdAt); return c.getFullYear() === y && c.getMonth() === m; }).length,
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Tableau de bord
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Vue d&apos;ensemble du réseau La Brie Immobilière
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/admin/ambassadeurs">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-2 sm:gap-3 py-5">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{ambassadorCount}</p>
                <p className="text-xs text-gray-500">Ambassadeurs</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/recommandations">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-2 sm:gap-3 py-5">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{leadCount}</p>
                <p className="text-xs text-gray-500">Recommandations</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/contrats">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-2 sm:gap-3 py-5">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{contractCount}</p>
                <p className="text-xs text-gray-500">Contrats</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="flex items-center gap-2 sm:gap-3 py-5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{conversionRate}%</p>
              <p className="text-xs text-gray-500">Conversion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {pendingLeads > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-5 py-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{pendingLeads} lead{pendingLeads > 1 ? "s" : ""} nouveau{pendingLeads > 1 ? "x" : ""}</strong> en attente de prise en charge.
            </p>
          </div>
          <Link href="/admin/recommandations" className="text-sm text-amber-700 font-medium hover:text-amber-900 flex items-center gap-1 flex-shrink-0">
            Voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* CA Gauges */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
              Chiffre d&apos;affaires — Commissions
            </h2>
            <ExportCommissionsButton />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <CAGauge
              label="CA Honoraires potentiel"
              value={caHonorairesPotentiel}
              maxValue={caHonorairesPotentiel}
              color="#8B5CF6"
              lightColor="#EDE9FE"
            />
            <CAGauge
              label="CA Validé (apports)"
              value={caValide}
              maxValue={caHonorairesPotentiel}
              color="#2563EB"
              lightColor="#DBEAFE"
            />
            <CAGauge
              label="Commissions à verser"
              value={commissionsPotentielles}
              maxValue={commissionsPotentielles + commissionsVersees}
              color="#F59E0B"
              lightColor="#FEF3C7"
            />
            <CAGauge
              label="Commissions versées"
              value={commissionsVersees}
              maxValue={commissionsPotentielles + commissionsVersees}
              color="#16A34A"
              lightColor="#DCFCE7"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm sm:text-lg font-bold text-purple-600">{formatCurrency(caHonorairesPotentiel)}</p>
              <p className="text-xs text-gray-500">Honoraires HT potentiels</p>
            </div>
            <div className="text-center">
              <p className="text-sm sm:text-lg font-bold text-blue-600">{formatCurrency(caValide)}</p>
              <p className="text-xs text-gray-500">CA validé (signé+payé)</p>
            </div>
            <div className="text-center">
              <p className="text-sm sm:text-lg font-bold text-amber-600">{formatCurrency(commissionsPotentielles)}</p>
              <p className="text-xs text-gray-500">Commissions en cours</p>
            </div>
            <div className="text-center">
              <p className="text-sm sm:text-lg font-bold text-green-600">{formatCurrency(commissionsVersees)}</p>
              <p className="text-xs text-gray-500">Commissions versées</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs mois/mois */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Performance mois en cours vs pr&eacute;c&eacute;dent
          </h2>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <KPIComparison label="Nouveaux ambassadeurs" current={thisMonthAmbassadors} previous={lastMonthAmbassadors} />
          <KPIComparison label="Recommandations" current={thisMonthLeads} previous={lastMonthLeads} />
          <KPIComparison label="Contrats" current={thisMonthContracts} previous={lastMonthContracts} />
          <KPIComparison label="Commissions" current={thisMonthCA} previous={lastMonthCA} format="currency" />
        </CardContent>
      </Card>

      {/* Top ambassadeurs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
              <Trophy className="w-4 h-4 inline-block mr-2 text-amber-500" />
              Top ambassadeurs
            </h2>
            <Link href="/admin/ambassadeurs" className="text-xs text-[#D1B280] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {topAmbassadors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucun ambassadeur</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ambassadeur</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contrats</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Commissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topAmbassadors.map((amb) => {
                      const totalCommissions = amb.contracts.reduce((s, c) => s + (c.commissionAmount || 0), 0);
                      return (
                        <tr key={amb.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3">
                            <p className="font-medium text-gray-900">{amb.user.name || "—"}</p>
                            <p className="text-xs text-gray-400">{amb.user.email}</p>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
                              {amb._count.leads}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                              {amb._count.contracts}
                            </span>
                          </td>
                          <td className="text-right px-6 py-3 font-medium text-gray-900">
                            {totalCommissions > 0 ? formatCurrency(totalCommissions) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="sm:hidden divide-y divide-gray-50">
                {topAmbassadors.map((amb) => {
                  const totalCommissions = amb.contracts.reduce((s, c) => s + (c.commissionAmount || 0), 0);
                  return (
                    <li key={amb.id} className="px-5 py-4 space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{amb.user.name || "—"}</p>
                        <p className="text-xs text-gray-400">{amb.user.email}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center text-[10px] font-semibold">{amb._count.leads}</span>
                          <span className="text-gray-500">leads</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-5 h-5 rounded-full bg-green-50 text-green-700 flex items-center justify-center text-[10px] font-semibold">{amb._count.contracts}</span>
                          <span className="text-gray-500">contrats</span>
                        </span>
                        <span className="ml-auto font-medium text-gray-900">
                          {totalCommissions > 0 ? formatCurrency(totalCommissions) : "—"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {/* Activity chart */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Activité — 6 derniers mois</h2>
        </CardHeader>
        <CardContent>
          <DashboardChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Dernières recommandations</h2>
              <Link href="/admin/recommandations" className="text-xs text-[#D1B280] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeads.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune recommandation</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentLeads.map((lead) => (
                  <li key={lead.id} className="px-6 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{lead.ambassador.user.name} · {formatDate(lead.createdAt)}</p>
                    </div>
                    <Badge className={`flex-shrink-0 text-xs ${LEAD_STATUS_COLORS[lead.status]}`}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent contracts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Derniers contrats</h2>
              <Link href="/admin/contrats" className="text-xs text-[#D1B280] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentContracts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun contrat</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentContracts.map((contract) => (
                  <li key={contract.id} className="px-6 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{contract.number}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {contract.ambassador.user.name} · {contract.commissionAmount ? formatCurrency(contract.commissionAmount) : "-"}
                      </p>
                    </div>
                    <Badge className={`flex-shrink-0 text-xs ${CONTRACT_STATUS_COLORS[contract.status]}`}>
                      {CONTRACT_STATUS_LABELS[contract.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
