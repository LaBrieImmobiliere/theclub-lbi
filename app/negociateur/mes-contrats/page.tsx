import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NegociateurContratsPage() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");
  const user = session.user as { id?: string; role?: string };
  if (user.role !== "NEGOTIATOR") redirect("/portail/mes-contrats");

  const negotiator = await prisma.negotiator.findUnique({
    where: { userId: user.id },
    include: {
      leads: {
        where: { contract: { isNot: null } },
        include: {
          contract: { include: { honoraryAcknowledgments: true } },
          ambassador: { include: { user: true } },
        },
      },
    },
  });

  if (!negotiator) redirect("/auth/connexion");
  const contractsWithAmbassador = negotiator.leads.map(l => ({
    ...l.contract!,
    ambassadorName: l.ambassador?.user?.name || "—",
  })).filter(Boolean);

  const statusLabel = (s: string) =>
    s === "PAYE" ? "Payé" : s === "SIGNE" ? "Signé" : s === "BROUILLON" ? "Brouillon" : s;
  const statusClass = (s: string) =>
    s === "PAYE" ? "bg-green-100 text-green-700" :
    s === "SIGNE" ? "bg-blue-100 text-blue-700" :
    "bg-gray-100 text-gray-600";
  const initials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Contrats</h1>
        <p className="text-gray-500 mt-1">{contractsWithAmbassador.length} contrat(s)</p>
      </div>

      {contractsWithAmbassador.length === 0 ? (
        <div className="bg-white border border-gray-100 shadow-sm rounded-lg px-6 py-12 text-center text-gray-400 text-sm">
          Aucun contrat pour l&apos;instant.
        </div>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="flex flex-col gap-3 md:hidden">
            {contractsWithAmbassador.map(c => (
              <Link key={c.id} href={`/negociateur/mes-contrats/${c.id}`} className="block">
                <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#030A24] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials(c.ambassadorName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.ambassadorName}</p>
                        <p className="text-xs text-gray-400 font-mono">{c.number}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statusClass(c.status)}`}>
                      {statusLabel(c.status)}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">{c.propertyAddress ?? "Adresse non renseignée"}</p>
                    <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {c.commissionAmount ? `${c.commissionAmount.toLocaleString("fr-FR")} €` : "—"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden md:block bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">N&deg;</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Ambassadeur</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Bien</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Commission</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contractsWithAmbassador.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-mono text-xs">
                      <Link href={`/negociateur/mes-contrats/${c.id}`} className="text-brand-deep hover:text-brand-gold underline-offset-2 hover:underline">
                        {c.number}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#030A24] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {initials(c.ambassadorName)}
                        </div>
                        <span className="text-gray-700">{c.ambassadorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{c.propertyAddress ?? "—"}</td>
                    <td className="px-6 py-3 text-gray-900 font-medium">
                      {c.commissionAmount ? `${c.commissionAmount.toLocaleString("fr-FR")} €` : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusClass(c.status)}`}>
                        {statusLabel(c.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
