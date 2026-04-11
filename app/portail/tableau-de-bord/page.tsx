import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import DashboardChart from "@/components/portal/dashboard-chart";
import { CagnotteGauge } from "@/components/portal/cagnotte-gauge";
import {
  ClipboardList,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Percent,
  Coins,
  Users,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");

  const user = session.user as { id?: string; name?: string; role?: string };

  // ── NEGOTIATOR DASHBOARD ──────────────────────────────────────────────────
  if (user.role === "NEGOTIATOR") {
    const negotiator = await prisma.negotiator.findUnique({
      where: { userId: user.id },
      include: {
        leads: {
          orderBy: { createdAt: "desc" },
          include: { contract: true },
        },
        ambassadors: {
          include: {
            user: { select: { name: true, email: true } },
            leads: true,
            contracts: true,
          },
          orderBy: { createdAt: "desc" },
        },
        agency: true,
      },
    });

    if (!negotiator) redirect("/auth/connexion");

    const allLeads = negotiator.leads;
    const totalLeads = allLeads.length;
    const totalAmbassadors = negotiator.ambassadors.length;
    const totalContracts = allLeads.filter((l) => l.contract).length;
    const conversionRate =
      totalLeads > 0 ? Math.round((totalContracts / totalLeads) * 100) : 0;

    const now = new Date();
    const monthNames = [
      "Jan", "F\u00e9v", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Ao\u00fbt", "Sep", "Oct", "Nov", "D\u00e9c",
    ];

    const chartData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const leads = allLeads.filter((l) => {
        const c = new Date(l.createdAt);
        return c.getFullYear() === year && c.getMonth() === month;
      }).length;
      const contrats = allLeads.filter((l) => {
        if (!l.contract) return false;
        const cd = new Date(l.createdAt);
        return cd.getFullYear() === year && cd.getMonth() === month;
      }).length;
      return { name: monthNames[month], leads, contrats };
    });

    const recentLeads = allLeads.slice(0, 5);

    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {user.name?.split(" ")[0] || "N\u00e9gociateur"} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Tableau de bord n&eacute;gociateur &mdash; {negotiator.agency?.name || "La Brie Immobili\u00e8re"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalLeads}</p>
                <p className="text-sm text-gray-500">Recommandations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalContracts}</p>
                <p className="text-sm text-gray-500">Contrats</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalAmbassadors}</p>
                <p className="text-sm text-gray-500">Ambassadeurs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Percent className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{conversionRate}%</p>
                <p className="text-sm text-gray-500">Taux de conversion</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity chart */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Activit&eacute; (6 derniers mois)</h2>
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
                <h2 className="font-semibold text-gray-900">Recommandations r&eacute;centes</h2>
                <Link href="/portail/mes-recommandations" className="text-sm text-blue-600 hover:underline">
                  Voir tout
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentLeads.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Aucune recommandation</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {recentLeads.map((lead) => (
                    <li key={lead.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{lead.type} &middot; {formatDate(lead.createdAt)}</p>
                      </div>
                      <Badge className={LEAD_STATUS_COLORS[lead.status]}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Ambassadors */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Mes ambassadeurs</h2>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {negotiator.ambassadors.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Aucun ambassadeur recrut&eacute;</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {negotiator.ambassadors.slice(0, 5).map((amb) => (
                    <li key={amb.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{amb.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {amb.leads.length} recommandation{amb.leads.length !== 1 ? "s" : ""} &middot; {amb.contracts.length} contrat{amb.contracts.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                        {amb.code}
                      </code>
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

  // ── AMBASSADOR DASHBOARD ──────────────────────────────────────────────────
  const ambassador = await prisma.ambassador.findUnique({
    where: { userId: user.id },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        include: { contract: true },
      },
      contracts: {
        orderBy: { createdAt: "desc" },
        include: { honoraryAcknowledgments: true },
      },
    },
  });

  if (!ambassador) redirect("/auth/connexion");

  // Stats
  const allLeads = ambassador.leads;
  const allContracts = ambassador.contracts;
  const totalLeads = allLeads.length;
  const totalContracts = allContracts.length;
  const totalCommissions = allContracts.reduce(
    (sum, c) => sum + (c.commissionAmount || 0),
    0
  );
  const conversionRate =
    totalLeads > 0 ? Math.round((totalContracts / totalLeads) * 100) : 0;

  const pendingAcks = allContracts
    .flatMap((c) => c.honoraryAcknowledgments)
    .filter((a) => a.status === "EN_ATTENTE" || a.status === "VALIDEE").length;

  // Recent items (first 5 since already sorted desc)
  const recentLeads = allLeads.slice(0, 5);
  const recentContracts = allContracts.slice(0, 5);

  // Monthly chart data (last 6 months)
  const now = new Date();
  const monthNames = [
    "Jan", "F\u00e9v", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Ao\u00fbt", "Sep", "Oct", "Nov", "D\u00e9c",
  ];

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    const leads = allLeads.filter((l) => {
      const c = new Date(l.createdAt);
      return c.getFullYear() === year && c.getMonth() === month;
    }).length;

    const contrats = allContracts.filter((c) => {
      const cd = new Date(c.createdAt);
      return cd.getFullYear() === year && cd.getMonth() === month;
    }).length;

    return {
      name: monthNames[month],
      leads,
      contrats,
    };
  });

  // Commission of the current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const commissionDuMois = allContracts
    .filter((c) => new Date(c.createdAt) >= currentMonthStart)
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

  // Cagnotte: gains acquis (contrats payés) vs gains potentiels (tous contrats)
  const gainsAcquis = allContracts
    .filter((c) => c.status === "PAYE")
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
  const gainsPotentiels = totalCommissions;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user.name?.split(" ")[0] || "Ambassadeur"} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Votre code parrainage :{" "}
          <code className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-medium">
            {ambassador.code}
          </code>
        </p>
      </div>

      {/* Cagnotte Gauge */}
      <Card>
        <CardContent className="py-6">
          <CagnotteGauge gainsAcquis={gainsAcquis} gainsPotentiels={gainsPotentiels} />
        </CardContent>
        {allContracts.length > 0 && (
          <>
            <div className="px-6 py-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-900">D&eacute;tails</p>
            </div>
            <div className="px-6 pb-4 divide-y divide-gray-50">
              {allContracts.slice(0, 5).map((contract) => (
                <div key={contract.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{contract.number}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(contract.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(contract.commissionAmount || 0)}
                    </p>
                    <p className={`text-[10px] font-medium ${
                      contract.status === "PAYE" ? "text-green-600" :
                      contract.status === "SIGNE" ? "text-blue-600" :
                      "text-amber-600"
                    }`}>
                      {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalLeads}</p>
              <p className="text-sm text-gray-500">Recommandations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalContracts}</p>
              <p className="text-sm text-gray-500">Contrats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalCommissions)}</p>
              <p className="text-sm text-gray-500">Commissions totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Percent className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{conversionRate}%</p>
              <p className="text-sm text-gray-500">Taux de conversion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity chart */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Mon activit&eacute; (6 derniers mois)</h2>
        </CardHeader>
        <CardContent>
          <DashboardChart data={chartData} />
        </CardContent>
      </Card>

      {/* Commission du mois */}
      <Card className="border-[#D1B280]/40 bg-gradient-to-r from-[#D1B280]/10 to-[#D1B280]/5">
        <CardContent className="flex items-center gap-4 py-5">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[#D1B280]/20 rounded-xl flex items-center justify-center">
            <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-[#D1B280]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#030A24]/60">Commission du mois</p>
            <p className="text-2xl font-bold text-[#030A24]">
              {formatCurrency(commissionDuMois)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending signatures alert */}
      {pendingAcks > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-sm text-blue-800">
            <strong>{pendingAcks} reconnaissance{pendingAcks > 1 ? "s" : ""} d&apos;honoraires</strong> en attente de votre action.
          </p>
          <Link href="/portail/mes-contrats" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
            Voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* CTA */}
      <Link href="/portail/recommander">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Recommander un proche</h2>
              <p className="text-blue-100 text-sm mt-1">
                Transmettez les coordonn&eacute;es d&apos;un ami, client ou contact int&eacute;ress&eacute; par l&apos;immobilier.
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Mes recommandations r&eacute;centes</h2>
              <Link href="/portail/mes-recommandations" className="text-sm text-blue-600 hover:underline">
                Voir tout
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeads.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune recommandation</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentLeads.map((lead) => (
                  <li key={lead.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{lead.type} &middot; {formatDate(lead.createdAt)}</p>
                    </div>
                    <Badge className={LEAD_STATUS_COLORS[lead.status]}>
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
              <h2 className="font-semibold text-gray-900">Mes contrats r&eacute;cents</h2>
              <Link href="/portail/mes-contrats" className="text-sm text-blue-600 hover:underline">
                Voir tout
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentContracts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun contrat</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentContracts.map((contract) => (
                  <li key={contract.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium font-mono text-gray-900">{contract.number}</p>
                      <p className="text-xs text-gray-500">
                        {contract.commissionAmount ? formatCurrency(contract.commissionAmount) : "-"}
                      </p>
                    </div>
                    <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
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
