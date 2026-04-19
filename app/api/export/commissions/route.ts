import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const where: { status: string; paidAt?: { gte?: Date; lte?: Date } } = { status: "PAYE" };
  if (from) where.paidAt = { ...where.paidAt, gte: new Date(from) };
  if (to) where.paidAt = { ...where.paidAt, lte: new Date(to) };

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      ambassador: { include: { user: { select: { name: true, email: true, phone: true, rib: true } } } },
      lead: { select: { firstName: true, lastName: true } },
    },
    orderBy: { paidAt: "desc" },
  });

  // Generate CSV
  const headers = ["Date paiement", "N° Contrat", "Ambassadeur", "Email", "Téléphone", "RIB/IBAN", "Prospect", "Adresse bien", "Prix bien", "Honoraires", "Commission HT", "Statut"];
  const rows = contracts.map(c => [
    c.paidAt ? new Date(c.paidAt).toLocaleDateString("fr-FR") : "",
    c.number,
    c.ambassador.user.name || "",
    c.ambassador.user.email,
    c.ambassador.user.phone || "",
    c.ambassador.user.rib || "",
    c.lead ? `${c.lead.firstName} ${c.lead.lastName}` : "",
    c.propertyAddress || "",
    c.propertyPrice?.toString() || "",
    c.honoraires?.toString() || "",
    c.commissionAmount?.toString() || "",
    "Payé",
  ]);

  const csv = [headers.join(";"), ...rows.map(r => r.map(v => `"${v}"`).join(";"))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="export-commissions-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
