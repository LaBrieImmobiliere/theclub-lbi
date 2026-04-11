import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ClipboardList,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
} from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    ambassadorCount,
    leadCount,
    contractCount,
    pendingContracts,
    recentLeads,
    recentContracts,
    signedContracts,
  ] = await Promise.all([
    prisma.ambassador.count({ where: { status: "ACTIVE" } }),
    prisma.lead.count(),
    prisma.contract.count(),
    prisma.contract.count({ where: { status: { in: ["BROUILLON", "ENVOYE"] } } }),
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
    prisma.contract.findMany({
      where: { status: { in: ["SIGNE", "PAYE"] } },
      select: { commissionAmount: true },
    }),
  ]);

  const totalCommissions = signedContracts.reduce(
    (sum, c) => sum + (c.commissionAmount || 0),
    0
  );

  const stats = [
    {
      label: "Ambassadeurs actifs",
      value: ambassadorCount,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/ambassadeurs",
    },
    {
      label: "Recommandations",
      value: leadCount,
      icon: ClipboardList,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/admin/recommandations",
    },
    {
      label: "Contrats",
      value: contractCount,
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/admin/contrats",
    },
    {
      label: "Commissions dues",
      value: formatCurrency(totalCommissions),
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/admin/contrats",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Vue d&apos;ensemble de votre réseau d&apos;ambassadeurs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-5">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Alert pending contracts */}
      {pendingContracts > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{pendingContracts} contrat{pendingContracts > 1 ? "s" : ""}</strong> en attente de signature ou d&apos;envoi.{" "}
            <Link href="/admin/contrats" className="underline font-medium">
              Voir les contrats
            </Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Dernières recommandations</h2>
              <Link href="/admin/recommandations" className="text-sm text-blue-600 hover:underline">
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
                      <p className="text-xs text-gray-500">
                        {lead.ambassador.user.name} · {formatDate(lead.createdAt)}
                      </p>
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
              <h2 className="font-semibold text-gray-900">Derniers contrats</h2>
              <Link href="/admin/contrats" className="text-sm text-blue-600 hover:underline">
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
                      <p className="text-sm font-medium text-gray-900">{contract.number}</p>
                      <p className="text-xs text-gray-500">
                        {contract.ambassador.user.name} ·{" "}
                        {contract.commissionAmount
                          ? formatCurrency(contract.commissionAmount)
                          : "-"}
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
