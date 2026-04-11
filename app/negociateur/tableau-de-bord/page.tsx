import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ClipboardList, Users, FileText, TrendingUp,
  Percent, Bell, CheckCircle2, Clock, ArrowRight,
} from "lucide-react";
import { formatDate, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import DashboardChart from "@/components/portal/dashboard-chart";
import { CAGauge } from "@/components/admin/ca-gauge";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NegociateurDashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");
  const user = session.user as { id?: string; role?: string; name?: string };
  if (user.role !== "NEGOTIATOR") redirect("/portail/tableau-de-bord");

  const negotiator = await prisma.negotiator.findUnique({
    where: { userId: user.id },
    include: {
      agency: true,
      leads: {
        orderBy: { createdAt: "desc" },
        include: {
          ambassador: { include: { user: { select: { name: true } } } },
          contract: true,
        },
      },
      ambassadors: {
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { leads: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!negotiator) redirect("/auth/connexion");

  const allLeads = negotiator.leads;
  const totalLeads = allLeads.length;
  const newLeads = allLeads.filter((l) => l.status === "NOUVEAU").length;
  const totalAmbassadors = negotiator.ambassadors.length;
  const totalContracts = allLeads.filter((l) => l.contract).length;
  const conversionRate = totalLeads > 0 ? Math.round((totalContracts / totalLeads) * 100) : 0;

  // Monthly chart data (6 months)
  const now = new Date();
  const monthNames = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const y = d.getFullYear(); const m = d.getMonth();
    return {
      name: monthNames[m],
      leads: allLeads.filter((l) => { const c = new Date(l.createdAt); return c.getFullYear() === y && c.getMonth() === m; }).length,
      contrats: allLeads.filter((l) => { if (!l.contract) return false; const c = new Date(l.createdAt); return c.getFullYear() === y && c.getMonth() === m; }).length,
    };
  });

  // CA calculations
  const caPotentiel = allLeads.reduce((s, l) => s + (l.contract?.commissionAmount || 0), 0);
  const caSigne = allLeads.filter(l => l.contract && ["SIGNE", "PAYE"].includes(l.contract.status)).reduce((s, l) => s + (l.contract!.commissionAmount || 0), 0);
  const caValide = allLeads.filter(l => l.contract?.status === "PAYE").reduce((s, l) => s + (l.contract!.commissionAmount || 0), 0);

  const recentLeads = allLeads.slice(0, 5);
  const activeAmbassadors = negotiator.ambassadors.filter((a) => a.status === "ACTIVE");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Bonjour, {user.name?.split(" ")[0] || "Négociateur"} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {negotiator.agency?.name || "La Brie Immobilière"} &mdash; Espace négociateur
          </p>
        </div>
        {newLeads > 0 && (
          <Link href="/negociateur/mes-recommandations"
            className="flex items-center gap-2 px-4 py-2 bg-[#D1B280] text-white text-sm font-medium hover:bg-[#b89a65] transition-colors flex-shrink-0">
            <Bell className="w-4 h-4" />
            {newLeads} nouvelle{newLeads > 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalLeads}</p>
              <p className="text-xs text-gray-500">Recommandations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{newLeads}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalAmbassadors}</p>
              <p className="text-xs text-gray-500">Ambassadeurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{conversionRate}%</p>
              <p className="text-xs text-gray-500">Conversion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jauges CA */}
      <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
              Chiffre d&apos;affaires — Commissions
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <CAGauge label="CA Potentiel" value={caPotentiel} maxValue={caPotentiel} color="#8B5CF6" lightColor="#EDE9FE" />
              <CAGauge label="CA Signé" value={caSigne} maxValue={caPotentiel} color="#2563EB" lightColor="#DBEAFE" />
              <CAGauge label="CA Validé / Payé" value={caValide} maxValue={caPotentiel} color="#16A34A" lightColor="#DCFCE7" />
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

      {/* Alerte leads en attente */}
      {newLeads > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{newLeads} lead{newLeads > 1 ? "s" : ""} nouveau{newLeads > 1 ? "x" : ""}</strong> en attente de contact.
            </p>
          </div>
          <Link href="/negociateur/mes-recommandations"
            className="text-sm text-amber-700 font-medium hover:text-amber-900 flex items-center gap-1 flex-shrink-0">
            Voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Graphique activité */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Activité — 6 derniers mois</h2>
        </CardHeader>
        <CardContent>
          <DashboardChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières recommandations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recommandations récentes</h2>
              <Link href="/negociateur/mes-recommandations" className="text-xs text-[#D1B280] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeads.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucune recommandation pour l&apos;instant</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentLeads.map((lead) => (
                  <li key={lead.id} className="px-6 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {lead.ambassador.user.name} &middot; {formatDate(lead.createdAt)}
                      </p>
                    </div>
                    <Badge className={`flex-shrink-0 text-xs ${LEAD_STATUS_COLORS[lead.status]}`}>
                      {LEAD_STATUS_LABELS[lead.status] || lead.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Ambassadeurs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Mes ambassadeurs</h2>
              <Link href="/negociateur/mes-ambassadeurs" className="text-xs text-[#D1B280] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activeAmbassadors.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucun ambassadeur pour l&apos;instant</p>
                <Link href="/negociateur/parrainage" className="mt-3 inline-flex items-center gap-1 text-xs text-[#D1B280] hover:underline">
                  Recruter via votre lien <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {activeAmbassadors.slice(0, 5).map((amb) => (
                  <li key={amb.id} className="px-6 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-[#030A24] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(amb.user.name || amb.user.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{amb.user.name}</p>
                        <p className="text-xs text-gray-400">{amb._count.leads} recommandation{amb._count.leads !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Actif</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA recrutement */}
      <Link href="/negociateur/parrainage">
        <div className="bg-gradient-to-r from-[#030A24] to-[#0f1e40] p-6 text-white cursor-pointer hover:from-[#0a1535] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Recruter un ambassadeur</h2>
              <p className="text-white/60 text-sm mt-1">
                Partagez votre lien de recrutement pour agrandir votre réseau.
              </p>
            </div>
            <div className="w-11 h-11 bg-[#D1B280]/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#D1B280]" />
            </div>
          </div>
        </div>
      </Link>

      {/* Taux conversion detail */}
      {totalLeads > 0 && (
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D1B280]" />
                <p className="text-sm font-medium text-gray-900">Taux de conversion global</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{conversionRate}%</p>
            </div>
            <div className="w-full bg-gray-100 h-2">
              <div
                className="h-2 bg-[#D1B280] transition-all duration-700"
                style={{ width: `${Math.min(conversionRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {totalContracts} contrat{totalContracts !== 1 ? "s" : ""} sur {totalLeads} recommandation{totalLeads !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
