import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const agencies = await prisma.agency.findMany({
    include: {
      _count: { select: { ambassadors: true, negotiators: true, leads: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(agencies);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { name, code, address, postalCode, city, phone, email } = body;

  if (!name || !code || !address || !postalCode || !city) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const existing = await prisma.agency.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "Ce code d'agence existe déjà" }, { status: 400 });
  }

  const agency = await prisma.agency.create({
    data: { name, code, address, postalCode, city, phone, email },
  });

  return NextResponse.json(agency, { status: 201 });
}
