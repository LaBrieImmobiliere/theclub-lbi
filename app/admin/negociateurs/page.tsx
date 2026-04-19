import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { UserCog, Phone, Mail, Building2, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminNegociateursPage() {
  const negotiators = await prisma.negotiator.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phone: true, image: true } },
      agency: { select: { name: true, city: true } },
      _count: { select: { leads: true, ambassadors: true } },
    },
  });

  const activeCount = negotiators.filter((n) => n.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            N&eacute;gociateurs
          </h1>
          <p className="text-gray-500 text-sm mt-1">{activeCount} actif{activeCount !== 1 ? "s" : ""} sur {negotiators.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {negotiators.map((neg) => (
          <Card key={neg.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                {neg.user.image ? (
                  <Image src={neg.user.image} alt={neg.user.name || ""} width={48} height={48} className="w-12 h-12 object-cover flex-shrink-0" unoptimized />
                ) : (
                  <div className="w-12 h-12 bg-[#030A24] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {(neg.user.name || neg.user.email)[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{neg.user.name}</p>
                    <Badge className={neg.status === "ACTIVE" ? "bg-green-100 text-green-800 text-[10px]" : "bg-gray-100 text-gray-600 text-[10px]"}>
                      {neg.status === "ACTIVE" ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{neg.code}</p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{neg.user.email}</span>
                </div>
                {neg.user.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    {neg.user.phone}
                  </div>
                )}
                {neg.agency && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Building2 className="w-3 h-3 flex-shrink-0" />
                    {neg.agency.name} — {neg.agency.city}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span><strong className="text-gray-900">{neg._count.ambassadors}</strong> ambassadeur{neg._count.ambassadors !== 1 ? "s" : ""}</span>
                  <span><strong className="text-gray-900">{neg._count.leads}</strong> lead{neg._count.leads !== 1 ? "s" : ""}</span>
                </div>
                <Link href={`/admin/agences/${neg.agencyId}/negociateur/${neg.id}`} className="text-xs text-[#D1B280] hover:underline flex items-center gap-1">
                  G&eacute;rer <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <p className="text-[10px] text-gray-400 mt-2">Inscrit le {formatDate(neg.createdAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {negotiators.length === 0 && (
        <div className="text-center py-16">
          <UserCog className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Aucun n&eacute;gociateur pour le moment</p>
        </div>
      )}
    </div>
  );
}
