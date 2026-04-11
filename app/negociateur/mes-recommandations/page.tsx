import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NegociateurRecommandationsPage() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");
  const user = session.user as { id?: string; role?: string };
  if (user.role !== "NEGOTIATOR") redirect("/portail/mes-recommandations");

  const negotiator = await prisma.negotiator.findUnique({
    where: { userId: user.id },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        include: { ambassador: { include: { user: true } }, contract: true },
      },
    },
  });

  if (!negotiator) redirect("/auth/connexion");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Recommandations
        </h1>
        <p className="text-gray-500 mt-1">{negotiator.leads.length} recommandation(s) au total</p>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm">
        {negotiator.leads.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Aucune recommandation pour l&apos;instant.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">Prospect</th>
                <th className="px-6 py-3 font-medium text-gray-500">Ambassadeur</th>
                <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                <th className="px-6 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {negotiator.leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-medium text-gray-900">{lead.firstName} {lead.lastName}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{lead.ambassador.user.name}</td>
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
                       lead.status === "CONTACTE" ? "Contacté" :
                       lead.status === "EN_COURS" ? "En cours" :
                       lead.status === "PERDU" ? "Perdu" : lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {new Date(lead.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
