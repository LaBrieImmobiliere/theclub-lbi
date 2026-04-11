import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, ClipboardList, FileText, TrendingUp,
  Clock, Coins, Percent, Bell, ArrowRight,
} from "lucide-react";
import {
  formatCurrency, formatDate,
  LEAD_STATUS_COLORS, LEAD_STATUS_LABELS,
  CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS,
} from "@/lib/utils";
import Link from "next/link";
import DashboardChart from "@/components/portal/dashboard-chart";
import { CAGauge } from "@/components/admin/ca-gauge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    ambassadorCount,
    leadCount,
    contractCount,
    pendingLeads,
    allContracts,
    recentLeads,
    recentContracts,
    allLeads,
  ] = await Promise.all([
    prisma.ambassador.count({ where: { status: "ACTIVE" } }),
    prisma.lead.count(),
    prisma.contract.count(),
    prisma.lead.count({ where: { status: "NOUVEAU" } }),
    prisma.contract.findMany({
      select: { commissionAmount: true, status: true, createdAt: true },
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
      select: { createdAt: true, contract: { select: { createdAt: true } } },
    }),
  ]);

  // CA calculations
  const caPotentiel = allContracts.reduce((s, c) => s + (c.commissionAmount || 0), 0);
  const caSigne = allContracts
    .filter((c) => ["SIGNE", "PAYE"].includes(c.status))
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);
  const caValide = allContracts
    .filter((c) => c.status === "PAYE")
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);

  const conversionRate = leadCount > 0 ? Math.round((contractCount / leadCount) * 100) : 0;

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
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
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
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
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
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
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
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
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
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-5 py-3">
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
          <h2 className="font-semibold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Chiffre d&apos;affaires — Commissions
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <CAGauge
              label="CA Potentiel"
              value={caPotentiel}
              maxValue={caPotentiel}
              color="#8B5CF6"
              lightColor="#EDE9FE"
            />
            <CAGauge
              label="CA Signé"
              value={caSigne}
              maxValue={caPotentiel}
              color="#2563EB"
              lightColor="#DBEAFE"
            />
            <CAGauge
              label="CA Validé / Payé"
              value={caValide}
              maxValue={caPotentiel}
              color="#16A34A"
              lightColor="#DCFCE7"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm sm:text-lg font-bold text-gray-900">{formatCurrency(caPotentiel)}</p>
              <p className="text-xs text-gray-500">Total tous contrats</p>
            </div>
            <div className="text-center">
              <p className="text-sm sm:text-lg font-bold text-blue-600">{formatCurrency(caSigne)}</p>
              <p className="text-xs text-gray-500">Signé + Payé</p>
            </div>
            <div className="text-center">
              <p className="text-sm sm:text-lg font-bold text-green-600">{formatCurrency(caValide)}</p>
              <p className="text-xs text-gray-500">Validé (payé)</p>
            </div>
          </div>
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
