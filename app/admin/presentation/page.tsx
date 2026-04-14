import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function PresentationPage() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "NEGOTIATOR") redirect("/");

  const [paidContracts, allContracts, ambassadorCount, leadCount] = await Promise.all([
    prisma.contract.findMany({ where: { status: "PAYE" }, select: { commissionAmount: true, paidAt: true } }),
    prisma.contract.count(),
    prisma.ambassador.count({ where: { status: "ACTIVE" } }),
    prisma.lead.count(),
  ]);

  const currentYear = new Date().getFullYear();
  const yearCommissions = paidContracts
    .filter(c => c.paidAt && new Date(c.paidAt).getFullYear() === currentYear)
    .reduce((s, c) => s + (c.commissionAmount || 0), 0);

  return (
    <div className="fixed inset-0 bg-[#030A24] text-white overflow-auto">
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Image src="/logo-white.png" alt="La Brie Immobilière" width={200} height={80} className="opacity-80" />
        </div>

        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-[#D1B280] text-sm font-semibold uppercase tracking-[0.3em] mb-4">
            The Club — Réseau d&apos;ambassadeurs
          </p>
          <h1 className="text-6xl md:text-8xl font-bold mb-4" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            {formatCurrency(yearCommissions)}
          </h1>
          <p className="text-white/60 text-xl">Commissions versées en {currentYear}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { value: leadCount, label: "Recommandations" },
            { value: allContracts, label: "Contrats signés" },
            { value: ambassadorCount, label: "Ambassadeurs actifs" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-5xl md:text-6xl font-bold text-[#D1B280] mb-2">{stat.value}</p>
              <p className="text-white/60 uppercase tracking-widest text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-sm">
          La Brie Immobilière — Depuis 1969 · Votre confiance, notre engagement
        </p>
      </div>
    </div>
  );
}
