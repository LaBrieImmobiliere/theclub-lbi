import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, MapPin, Phone, Mail, Users, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgencesPage() {
  const agencies = await prisma.agency.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          ambassadors: true,
          negotiators: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-brand-deep"
            style={{ fontFamily: "'Fira Sans', sans-serif" }}
          >
            Agences
          </h1>
          <p className="text-gray-500 mt-1">
            {agencies.length} agence{agencies.length > 1 ? "s" : ""} enregistrée{agencies.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/agences/nouvelle"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-deep text-brand-gold text-sm font-medium rounded-none hover:bg-brand-deep/90 transition-colors"
          style={{ fontFamily: "'Fira Sans', sans-serif" }}
        >
          <Plus className="w-4 h-4" />
          Nouvelle agence
        </Link>
      </div>

      {/* Grid */}
      {agencies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">Aucune agence enregistrée</p>
          <Link
            href="/admin/agences/nouvelle"
            className="mt-4 text-sm text-brand-gold hover:underline"
          >
            Ajouter votre premiere agence
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {agencies.map((agency) => (
            <Link
              key={agency.id}
              href={`/admin/agences/${agency.id}`}
              className="group block"
            >
              <div className="bg-white border border-gray-200 rounded-none p-6 hover:border-brand-gold transition-colors h-full flex flex-col">
                {/* Agency name and code */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-cream flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-brand-deep" />
                    </div>
                    <div>
                      <h2
                        className="font-semibold text-brand-deep group-hover:text-brand-gold transition-colors"
                        style={{ fontFamily: "'Fira Sans', sans-serif" }}
                      >
                        {agency.name}
                      </h2>
                      <span className="text-xs text-gray-400 font-mono tracking-wide">
                        {agency.code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-600 flex-1">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>
                      {agency.address}, {agency.postalCode} {agency.city}
                    </span>
                  </div>
                  {agency.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{agency.phone}</span>
                    </div>
                  )}
                  {agency.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{agency.email}</span>
                    </div>
                  )}
                </div>

                {/* Counts */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-gold" />
                    <span className="text-sm text-gray-700">
                      <strong className="text-brand-deep">{agency._count.negotiators}</strong>{" "}
                      négociateur{agency._count.negotiators > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-gold" />
                    <span className="text-sm text-gray-700">
                      <strong className="text-brand-deep">{agency._count.ambassadors}</strong>{" "}
                      ambassadeur{agency._count.ambassadors > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
