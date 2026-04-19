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
import { OnboardingModal } from "@/components/onboarding-modal";
import { PersonalizedGreeting } from "@/components/portal/personalized-greeting";
import {
  formatCurrency,
  formatDate,
  commissionTTC,
  isAssujettTVA,
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
          take: 100,
          orderBy: { createdAt: "desc" },
          include: { contract: true },
        },
        ambassadors: {
          take: 50,
          include: {
            user: { select: { name: true, email: true } },
            _count: { select: { leads: true, contracts: true } },
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
            <CardContent className="px-4 py-3">
              {recentLeads.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Aucune recommandation</p>
              ) : (
                <div className="space-y-2">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between bg-gray-50/80 border border-gray-100 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{lead.type} &middot; {formatDate(lead.createdAt)}</p>
                      </div>
                      <Badge className={LEAD_STATUS_COLORS[lead.status]}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
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
            <CardContent className="px-4 py-3">
              {negotiator.ambassadors.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Aucun ambassadeur recrut&eacute;</p>
              ) : (
                <div className="space-y-2">
                  {negotiator.ambassadors.slice(0, 5).map((amb) => (
                    <div key={amb.id} className="flex items-center justify-between bg-gray-50/80 border border-gray-100 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{amb.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {amb._count.leads} recommandation{amb._count.leads !== 1 ? "s" : ""} &middot; {amb._count.contracts} contrat{amb._count.contracts !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">
                        {amb.code}
                      </code>
                    </div>
                  ))}
                </div>
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
        take: 100,
        orderBy: { createdAt: "desc" },
        include: { contract: true },
      },
      contracts: {
        take: 100,
        orderBy: { createdAt: "desc" },
        include: { honoraryAcknowledgments: true },
      },
    },
  });

  if (!ambassador) redirect("/auth/connexion");

  // Calculate ranking
  const allAmbassadors = await prisma.ambassador.findMany({
    where: { status: "ACTIVE" },
    take: 200,
    select: {
      id: true,
      contracts: { select: { commissionAmount: true } },
    },
  });
  const rankedAmbs = allAmbassadors
    .map((a) => ({ id: a.id, total: a.contracts.reduce((s, c) => s + (c.commissionAmount || 0), 0) }))
    .sort((a, b) => b.total - a.total);
  const myRank = rankedAmbs.findIndex((a) => a.id === ambassador.id) + 1;
  const totalActiveAmbassadors = rankedAmbs.length;

  // Stats
  const allLeads = ambassador.leads;
  const allContracts = ambassador.contracts;
  const totalLeads = allLeads.length;
  const totalContracts = allContracts.length;

  // Helper: commission for a contract = commissionAmount or sum of acknowledgment amounts
  const getContractCommission = (c: typeof allContracts[0]) => {
    if (c.commissionAmount) return c.commissionAmount;
    const ackTotal = c.honoraryAcknowledgments.reduce((s, a) => s + (a.amount || 0), 0);
    return ackTotal;
  };

  const totalCommissions = allContracts.reduce(
    (sum, c) => sum + getContractCommission(c),
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
    .reduce((sum, c) => sum + getContractCommission(c), 0);

  // Cagnotte: gains acquis (contrats signés ou payés) vs gains potentiels (en cours)
  const gainsAcquis = allContracts.reduce((sum, c) => {
    if (c.status === "SIGNE" || c.status === "PAYE") return sum + getContractCommission(c);
    // Also count individually paid acknowledgments
    const paidAcks = c.honoraryAcknowledgments
      .filter((a) => a.status === "PAYEE" || a.status === "VALIDEE")
      .reduce((s, a) => s + (a.amount || 0), 0);
    return sum + paidAcks;
  }, 0);
  const gainsPotentiels = totalCommissions;

  // Days since last lead (pour greeting personnalisé) — Server Component, Date.now() est OK
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const lastLead = allLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const daysSinceLastLead = lastLead
    ? Math.floor((now - new Date(lastLead.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  const totalEarned = allContracts
    .filter((c) => c.status === "PAYE")
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Personalized greeting */}
      <PersonalizedGreeting
        name={user.name || "Ambassadeur"}
        totalLeads={totalLeads}
        totalContracts={totalContracts}
        totalEarned={totalEarned}
        daysSinceLastLead={daysSinceLastLead}
      />

      {/* Code parrainage */}
      <div>
        <p className="text-gray-500 text-sm">
          Votre code parrainage :{" "}
          <code className="bg-[#D1B280]/10 text-[#D1B280] px-2.5 py-0.5 rounded-full font-mono font-medium">
            {ambassador.code}
          </code>
        </p>
      </div>

      {/* Cagnotte Gauge */}
      <Card>
        <CardContent className="py-6">
          <CagnotteGauge gainsAcquis={commissionTTC(gainsAcquis, ambassador.legalStatus)} gainsPotentiels={commissionTTC(gainsPotentiels, ambassador.legalStatus)} />
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
                      {formatCurrency(commissionTTC(getContractCommission(contract), ambassador.legalStatus))}
                    </p>
                    {isAssujettTVA(ambassador.legalStatus) && (
                      <p className="text-[10px] text-gray-400">
                        HT : {formatCurrency(getContractCommission(contract))}
                      </p>
                    )}
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

      {/* Classement personnel */}
      {totalActiveAmbassadors > 1 && (
        <div className="flex items-center gap-4 bg-gradient-to-r from-[#030A24] to-[#0f1e40] rounded-lg px-5 py-4 text-white">
          <div className="w-12 h-12 bg-[#D1B280]/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-[#D1B280]">{myRank > 0 ? `#${myRank}` : "—"}</span>
          </div>
          <div>
            <p className="text-sm font-semibold">
              Vous &ecirc;tes {myRank === 1 ? "1er" : `${myRank}\u00e8me`} sur {totalActiveAmbassadors} ambassadeur{totalActiveAmbassadors > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-white/50 mt-0.5">
              {myRank <= 3 ? "Bravo, vous faites partie du top 3 !" : "Continuez \u00e0 recommander pour monter dans le classement !"}
            </p>
          </div>
        </div>
      )}

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

      {/* Rapport mensuel */}
      <a
        href="/api/me/rapport"
        download
        className="flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#D1B280] hover:text-[#D1B280] transition-colors"
      >
        <FileText className="w-4 h-4" />
        T&eacute;l&eacute;charger mon rapport mensuel
      </a>

      {/* Pending signatures alert */}
      {pendingAcks > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-colors">
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
          <CardContent className="px-4 py-3">
            {recentLeads.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune recommandation</p>
            ) : (
              <div className="space-y-2">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between bg-gray-50/80 border border-gray-100 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{lead.type} &middot; {formatDate(lead.createdAt)}</p>
                    </div>
                    <Badge className={LEAD_STATUS_COLORS[lead.status]}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </Badge>
                  </div>
                ))}
              </div>
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
          <CardContent className="px-4 py-3">
            {recentContracts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun contrat</p>
            ) : (
              <div className="space-y-2">
                {recentContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between bg-gray-50/80 border border-gray-100 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium font-mono text-gray-900">{contract.number}</p>
                      <p className="text-xs text-gray-500">
                        {contract.commissionAmount ? formatCurrency(contract.commissionAmount) : "-"}
                      </p>
                    </div>
                    <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
                      {CONTRACT_STATUS_LABELS[contract.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <OnboardingModal />
    </div>
  );
}
