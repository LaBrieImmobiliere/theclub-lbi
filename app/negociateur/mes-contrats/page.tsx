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
  const contracts = negotiator.leads.map(l => l.contract!).filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Contrats</h1>
        <p className="text-gray-500 mt-1">{contracts.length} contrat(s)</p>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm">
        {contracts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Aucun contrat pour l&apos;instant.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">N&deg;</th>
                <th className="px-6 py-3 font-medium text-gray-500">Bien</th>
                <th className="px-6 py-3 font-medium text-gray-500">Commission</th>
                <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contracts.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-mono text-xs">
                    <Link href={`/negociateur/mes-contrats/${c.id}`} className="text-brand-deep hover:text-brand-gold underline-offset-2 hover:underline">
                      {c.number}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{c.propertyAddress ?? "—"}</td>
                  <td className="px-6 py-3 text-gray-900 font-medium">
                    {c.commissionAmount ? `${c.commissionAmount.toLocaleString("fr-FR")} €` : "—"}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-1 font-medium ${
                      c.status === "PAYE" ? "bg-green-100 text-green-700" :
                      c.status === "SIGNE" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {c.status === "PAYE" ? "Payé" : c.status === "SIGNE" ? "Signé" : c.status === "BROUILLON" ? "Brouillon" : c.status}
                    </span>
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
