import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { id?: string; role?: string; name?: string };
  if (!user.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const ambassador = await prisma.ambassador.findUnique({
    where: { userId: user.id },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        select: { id: true, firstName: true, lastName: true, status: true, type: true, createdAt: true },
      },
      contracts: {
        orderBy: { createdAt: "desc" },
        select: { id: true, number: true, commissionAmount: true, status: true, createdAt: true },
      },
    },
  });

  if (!ambassador) return NextResponse.json({ error: "Ambassadeur introuvable" }, { status: 404 });

  const now = new Date();
  const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const totalLeads = ambassador.leads.length;
  const totalContracts = ambassador.contracts.length;
  const totalCommissions = ambassador.contracts.reduce((s, c) => s + (c.commissionAmount || 0), 0);
  const paidCommissions = ambassador.contracts.filter(c => c.status === "PAYE").reduce((s, c) => s + (c.commissionAmount || 0), 0);

  // Build CSV for simplicity (PDF would require jsPDF server-side)
  const lines = [
    `RAPPORT MENSUEL - THE CLUB - LA BRIE IMMOBILIERE`,
    `Ambassadeur: ${user.name}`,
    `Code: ${ambassador.code}`,
    `Date: ${monthName}`,
    ``,
    `=== RESUME ===`,
    `Recommandations totales: ${totalLeads}`,
    `Contrats: ${totalContracts}`,
    `Commissions totales: ${totalCommissions.toLocaleString("fr-FR")} EUR`,
    `Commissions payees: ${paidCommissions.toLocaleString("fr-FR")} EUR`,
    ``,
    `=== RECOMMANDATIONS ===`,
    `Prospect;Type;Statut;Date`,
    ...ambassador.leads.map(l =>
      `${l.firstName} ${l.lastName};${l.type};${l.status};${new Date(l.createdAt).toLocaleDateString("fr-FR")}`
    ),
    ``,
    `=== CONTRATS ===`,
    `Numero;Commission;Statut;Date`,
    ...ambassador.contracts.map(c =>
      `${c.number};${c.commissionAmount?.toLocaleString("fr-FR") || "0"} EUR;${c.status};${new Date(c.createdAt).toLocaleDateString("fr-FR")}`
    ),
  ];

  const content = "\uFEFF" + lines.join("\n");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rapport-${ambassador.code}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv"`,
    },
  });
}
