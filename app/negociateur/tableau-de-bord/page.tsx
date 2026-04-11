import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NegociateurDashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");
  const user = session.user as { id?: string; role?: string };
  if (user.role !== "NEGOTIATOR") redirect("/portail/tableau-de-bord");

  const negotiator = await prisma.negotiator.findUnique({
    where: { userId: user.id },
    include: {
      agency: true,
      leads: { orderBy: { createdAt: "desc" }, include: { contract: true } },
      ambassadors: { include: { user: true } },
    },
  });

  if (!negotiator) redirect("/auth/connexion");

  // Calcule les stats
  const totalLeads = negotiator.leads.length;
  const newLeads = negotiator.leads.filter(l => l.status === "NOUVEAU").length;
  const convertedLeads = negotiator.leads.filter(l => l.contract && ["SIGNE","PAYE"].includes(l.contract.status)).length;
  const totalAmbassadors = negotiator.ambassadors.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Tableau de bord
        </h1>
        <p className="text-gray-500 mt-1">
          Bonjour {session.user?.name?.split(" ")[0]} &mdash; {negotiator.agency?.name ?? "La Brie Immobilière"}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Recommandations", value: totalLeads, color: "text-brand-gold", bg: "bg-brand-cream" },
          { label: "Nouvelles", value: newLeads, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Converties", value: convertedLeads, color: "text-green-600", bg: "bg-green-50" },
          { label: "Ambassadeurs", value: totalAmbassadors, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent leads */}
      {negotiator.leads.length > 0 && (
        <div className="bg-white border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
              Derni&egrave;res recommandations
            </h2>
          </div>
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
              {negotiator.leads.slice(0, 8).map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-medium text-gray-900">{lead.firstName} {lead.lastName}</td>
                  <td className="px-6 py-3 text-gray-500">{lead.type}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-1 font-medium ${
                      lead.contract?.status === "PAYE" ? "bg-green-100 text-green-700" :
                      lead.contract?.status === "SIGNE" ? "bg-blue-100 text-blue-700" :
                      lead.status === "PERDU" ? "bg-red-100 text-red-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {lead.contract?.status === "PAYE" ? "Payé" :
                       lead.contract?.status === "SIGNE" ? "Signé" :
                       lead.status === "NOUVEAU" ? "Nouveau" :
                       lead.status === "EN_COURS" ? "En cours" :
                       lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {new Date(lead.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ambassadeurs */}
      {negotiator.ambassadors.length > 0 && (
        <div className="bg-white border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
              Mes ambassadeurs actifs
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {negotiator.ambassadors.slice(0, 5).map(amb => (
              <div key={amb.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{amb.user.name}</p>
                  <p className="text-xs text-gray-500">{amb.code}</p>
                </div>
                <span className={`text-xs px-2 py-1 ${amb.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {amb.status === "ACTIVE" ? "Actif" : amb.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
