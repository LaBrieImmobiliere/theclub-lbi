import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MesAmbassadeursPage() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");
  const user = session.user as { id?: string; role?: string };
  if (user.role !== "NEGOTIATOR") redirect("/portail/tableau-de-bord");

  const negotiator = await prisma.negotiator.findUnique({
    where: { userId: user.id },
    include: {
      ambassadors: {
        include: {
          user: true,
          leads: { select: { id: true, status: true, contract: { select: { status: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!negotiator) redirect("/auth/connexion");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Mes ambassadeurs
        </h1>
        <p className="text-gray-500 mt-1">{negotiator.ambassadors.length} ambassadeur(s) dans votre r&eacute;seau</p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden">
        {negotiator.ambassadors.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <p className="text-sm">Aucun ambassadeur rattach&eacute; pour l&apos;instant.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left bg-gray-50/50">
                <th className="px-6 py-3 font-medium text-gray-500">Ambassadeur</th>
                <th className="px-6 py-3 font-medium text-gray-500">Code</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-center">Recos</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-center">Converties</th>
                <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {negotiator.ambassadors.map(amb => {
                const converted = amb.leads.filter(l => l.contract && ["SIGNE","PAYE"].includes(l.contract.status)).length;
                return (
                  <tr key={amb.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{amb.user.name}</p>
                      <p className="text-xs text-gray-400">{amb.user.email}</p>
                    </td>
                    <td className="px-6 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-[#030A24]">{amb.code}</code>
                    </td>
                    <td className="px-6 py-3 text-center text-gray-700">{amb.leads.length}</td>
                    <td className="px-6 py-3 text-center text-green-700 font-medium">{converted}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        amb.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {amb.status === "ACTIVE" ? "Actif" : amb.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {negotiator.ambassadors.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-lg px-6 py-12 text-center text-gray-400">
            <p className="text-sm">Aucun ambassadeur rattach&eacute; pour l&apos;instant.</p>
          </div>
        ) : (
          negotiator.ambassadors.map(amb => {
            const converted = amb.leads.filter(l => l.contract && ["SIGNE","PAYE"].includes(l.contract.status)).length;
            return (
              <div key={amb.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-[#030A24] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {(amb.user.name || "?").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{amb.user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{amb.user.email}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    amb.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {amb.status === "ACTIVE" ? "Actif" : amb.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-[#030A24] font-mono">{amb.code}</code>
                  <div className="flex gap-4 text-xs">
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{amb.leads.length}</p>
                      <p className="text-gray-400">Recos</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-700">{converted}</p>
                      <p className="text-gray-400">Converties</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
