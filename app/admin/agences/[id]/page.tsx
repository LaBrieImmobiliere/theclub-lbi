import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Users,
  UserPlus,
  Hash,
  ClipboardList,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const agency = await prisma.agency.findUnique({
    where: { id },
    include: {
      negotiators: {
        include: { user: true, _count: { select: { leads: true } } },
        orderBy: { createdAt: "desc" },
      },
      ambassadors: {
        include: { user: true, _count: { select: { leads: true } } },
        orderBy: { createdAt: "desc" },
      },
      leads: true,
    },
  });

  if (!agency) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/agences" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-brand-deep font-heading">
            {agency.name}
          </h1>
          <p className="text-gray-500 mt-0.5">
            Code : <code className="bg-brand-cream px-1.5 py-0.5 text-sm font-mono text-brand-deep">{agency.code}</code>
          </p>
        </div>
      </div>

      {/* Agency info banner */}
      <Card className="border-0 bg-brand-deep text-white rounded-none">
        <CardContent className="py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-brand-gold mt-0.5" />
              <div>
                <p className="text-xs text-brand-gold uppercase tracking-wider font-heading">Agence</p>
                <p className="text-sm font-medium mt-1">{agency.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-brand-gold mt-0.5" />
              <div>
                <p className="text-xs text-brand-gold uppercase tracking-wider font-heading">Adresse</p>
                <p className="text-sm font-medium mt-1">{agency.address}</p>
                <p className="text-sm text-gray-300">{agency.postalCode} {agency.city}</p>
              </div>
            </div>
            {agency.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand-gold mt-0.5" />
                <div>
                  <p className="text-xs text-brand-gold uppercase tracking-wider font-heading">Telephone</p>
                  <p className="text-sm font-medium mt-1">{agency.phone}</p>
                </div>
              </div>
            )}
            {agency.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-gold mt-0.5" />
                <div>
                  <p className="text-xs text-brand-gold uppercase tracking-wider font-heading">Email</p>
                  <p className="text-sm font-medium mt-1">{agency.email}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-none border-0 bg-brand-cream">
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-deep flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-deep font-heading">{agency.negotiators.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Negociateurs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-0 bg-brand-cream">
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-deep flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-deep font-heading">{agency.ambassadors.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Ambassadeurs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-0 bg-brand-cream">
          <CardContent className="py-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-deep flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-deep font-heading">{agency.leads.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Recommandations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Negotiators table */}
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-brand-gold" />
              <h2 className="font-semibold text-brand-deep font-heading">
                Negociateurs ({agency.negotiators.length})
              </h2>
            </div>
            <Link href={`/admin/agences/${agency.id}/negociateur/nouveau`}>
              <Button className="bg-brand-deep text-brand-gold hover:bg-brand-deep/90 rounded-none">
                <UserPlus className="w-4 h-4" /> Ajouter un negociateur
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {agency.negotiators.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun negociateur dans cette agence</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left bg-brand-cream">
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Nom</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Email</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Telephone</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Code</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Statut</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Leads</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Inscrit le</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {agency.negotiators.map((neg) => (
                    <tr key={neg.id} className="hover:bg-brand-cream/50">
                      <td className="px-6 py-4 font-medium">
                        <Link href={`/admin/agences/${agency.id}/negociateur/${neg.id}`} className="text-brand-deep hover:text-brand-gold font-medium transition-colors underline-offset-2 hover:underline">
                          {neg.user.name || "-"}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{neg.user.email}</td>
                      <td className="px-6 py-4 text-gray-600">{neg.user.phone || "-"}</td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-brand-cream px-2 py-1 font-mono text-brand-deep">
                          {neg.code}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            neg.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {neg.status === "ACTIVE" ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{neg._count.leads}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(neg.createdAt)}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/agences/${agency.id}/negociateur/${neg.id}`} className="text-xs text-brand-gold hover:underline font-medium">
                          Modifier
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ambassadors table */}
      <Card className="rounded-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-gold" />
            <h2 className="font-semibold text-brand-deep font-heading">
              Ambassadeurs ({agency.ambassadors.length})
            </h2>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {agency.ambassadors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun ambassadeur dans cette agence</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left bg-brand-cream">
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Nom</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Email</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Telephone</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Code</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Statut</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Leads</th>
                    <th className="px-6 py-3 font-medium text-brand-deep font-heading">Inscrit le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {agency.ambassadors.map((amb) => (
                    <tr key={amb.id} className="hover:bg-brand-cream/50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {amb.user.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{amb.user.email}</td>
                      <td className="px-6 py-4 text-gray-600">{amb.user.phone || "-"}</td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-brand-cream px-2 py-1 font-mono text-brand-deep">
                          {amb.code}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            amb.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {amb.status === "ACTIVE" ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{amb._count.leads}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(amb.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
