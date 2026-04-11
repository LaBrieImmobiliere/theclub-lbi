import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    if (v == null) return "";
    const str = String(v);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "leads";

  let csv = "";
  let filename = "";

  if (type === "leads") {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ambassador: { include: { user: { select: { name: true, email: true } } } },
        negotiator: { include: { user: { select: { name: true } } } },
        contract: { select: { number: true, status: true, commissionAmount: true } },
      },
    });

    csv = toCSV(
      ["ID", "Prénom", "Nom", "Email", "Téléphone", "Type", "Statut", "Budget", "Localisation", "Ambassadeur", "Email Ambassadeur", "Négociateur", "Contrat", "Statut Contrat", "Commission (€)", "Date création"],
      leads.map((l) => [
        l.id,
        l.firstName,
        l.lastName,
        l.email,
        l.phone,
        l.type,
        l.status,
        l.budget,
        l.location,
        l.ambassador.user.name,
        l.ambassador.user.email,
        l.negotiator?.user.name,
        l.contract?.number,
        l.contract?.status,
        l.contract?.commissionAmount,
        formatDate(l.createdAt),
      ])
    );
    filename = `leads_${new Date().toISOString().split("T")[0]}.csv`;

  } else if (type === "commissions") {
    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ambassador: { include: { user: { select: { name: true, email: true } } } },
        lead: { select: { firstName: true, lastName: true } },
        honoraryAcknowledgments: { select: { amount: true, status: true } },
      },
    });

    csv = toCSV(
      ["Numéro contrat", "Ambassadeur", "Email", "Prospect", "Type commission", "Valeur %/€", "Montant commission (€)", "Statut", "Reconnaissances", "Total reconnaissances (€)", "Date"],
      contracts.map((c) => [
        c.number,
        c.ambassador.user.name,
        c.ambassador.user.email,
        c.lead ? `${c.lead.firstName} ${c.lead.lastName}` : "",
        c.commissionType,
        c.commissionValue,
        c.commissionAmount,
        c.status,
        c.honoraryAcknowledgments.length,
        c.honoraryAcknowledgments.reduce((s, a) => s + a.amount, 0),
        formatDate(c.createdAt),
      ])
    );
    filename = `commissions_${new Date().toISOString().split("T")[0]}.csv`;

  } else if (type === "ambassadeurs") {
    const ambassadors = await prisma.ambassador.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true, createdAt: true } },
        negotiator: { include: { user: { select: { name: true } } } },
        _count: { select: { leads: true, contracts: true } },
      },
    });

    csv = toCSV(
      ["Code", "Nom", "Email", "Téléphone", "Statut", "Négociateur", "Nombre leads", "Nombre contrats", "Date inscription"],
      ambassadors.map((a) => [
        a.code,
        a.user.name,
        a.user.email,
        a.user.phone,
        a.status,
        a.negotiator?.user.name,
        a._count.leads,
        a._count.contracts,
        formatDate(a.user.createdAt),
      ])
    );
    filename = `ambassadeurs_${new Date().toISOString().split("T")[0]}.csv`;

  } else {
    return NextResponse.json({ error: "Type invalide. Utilisez: leads, commissions, ambassadeurs" }, { status: 400 });
  }

  // BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
