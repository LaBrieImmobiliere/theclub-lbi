import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, FileText, ClipboardList } from "lucide-react";
import {
  formatDate,
  formatCurrency,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AmbassadeurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ambassador = await prisma.ambassador.findUnique({
    where: { id },
    include: {
      user: true,
      leads: { orderBy: { createdAt: "desc" } },
      contracts: {
        include: { honoraryAcknowledgments: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ambassador) notFound();

  const totalCommissions = ambassador.contracts.reduce(
    (sum, c) => sum + (c.commissionAmount || 0),
    0
  );
  const paidCommissions = ambassador.contracts
    .filter((c) => c.status === "PAYE")
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/ambassadeurs" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ambassador.user.name}</h1>
          <p className="text-gray-500">Ambassadeur · Code : <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{ambassador.code}</code></p>
        </div>
        <Badge className={ambassador.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
          {ambassador.status === "ACTIVE" ? "Actif" : "Inactif"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Informations</h2></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              {ambassador.user.email}
            </div>
            {ambassador.user.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                {ambassador.user.phone}
              </div>
            )}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Recommandations</span>
                <span className="font-medium">{ambassador.leads.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Contrats</span>
                <span className="font-medium">{ambassador.contracts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Commissions totales</span>
                <span className="font-medium text-green-700">{formatCurrency(totalCommissions)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Commissions payées</span>
                <span className="font-medium text-green-600">{formatCurrency(paidCommissions)}</span>
              </div>
            </div>
            {ambassador.notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notes internes</p>
                <p className="text-sm text-gray-700">{ambassador.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Leads */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Recommandations ({ambassador.leads.length})</h2>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {ambassador.leads.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Aucune recommandation</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-6 py-3 font-medium text-gray-500">Prospect</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ambassador.leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium">{lead.firstName} {lead.lastName}</td>
                        <td className="px-6 py-3 text-gray-500">{lead.type}</td>
                        <td className="px-6 py-3">
                          <Badge className={LEAD_STATUS_COLORS[lead.status]}>
                            {LEAD_STATUS_LABELS[lead.status]}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{formatDate(lead.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Contracts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Contrats ({ambassador.contracts.length})</h2>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {ambassador.contracts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Aucun contrat</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-6 py-3 font-medium text-gray-500">Numéro</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Commission</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ambassador.contracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-mono text-xs">{contract.number}</td>
                        <td className="px-6 py-3 font-medium text-green-700">
                          {contract.commissionAmount ? formatCurrency(contract.commissionAmount) : "-"}
                        </td>
                        <td className="px-6 py-3">
                          <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
                            {CONTRACT_STATUS_LABELS[contract.status]}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{formatDate(contract.createdAt)}</td>
                        <td className="px-6 py-3">
                          <Link href={`/admin/contrats/${contract.id}`} className="text-blue-600 hover:underline text-xs">
                            Voir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
