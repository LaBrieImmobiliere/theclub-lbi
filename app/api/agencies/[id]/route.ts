import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const agency = await prisma.agency.findUnique({ where: { id } });
  if (!agency) return NextResponse.json({ error: "Agence introuvable" }, { status: 404 });

  return NextResponse.json(agency);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const agency = await prisma.agency.findUnique({ where: { id } });
  if (!agency) return NextResponse.json({ error: "Agence introuvable" }, { status: 404 });

  // Check code uniqueness if changed
  if (body.code && body.code !== agency.code) {
    const existing = await prisma.agency.findUnique({ where: { code: body.code } });
    if (existing) return NextResponse.json({ error: "Ce code d'agence existe déjà" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (body.name) data.name = body.name;
  if (body.code) data.code = body.code;
  if (body.address) data.address = body.address;
  if (body.postalCode) data.postalCode = body.postalCode;
  if (body.city) data.city = body.city;
  if (body.phone !== undefined) data.phone = body.phone || "";
  if (body.email !== undefined) data.email = body.email || "";

  const updated = await prisma.agency.update({ where: { id }, data });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const agency = await prisma.agency.findUnique({
    where: { id },
    include: {
      negotiators: true,
      _count: { select: { ambassadors: true, negotiators: true, leads: true } },
    },
  });

  if (!agency) {
    return NextResponse.json({ error: "Agence introuvable" }, { status: 404 });
  }

  const url = new URL(req.url);
  const reassignTo = url.searchParams.get("reassignTo");

  if (reassignTo) {
    const target = await prisma.agency.findUnique({ where: { id: reassignTo } });
    if (!target) {
      return NextResponse.json({ error: "Agence de destination introuvable" }, { status: 400 });
    }

    await prisma.negotiator.updateMany({
      where: { agencyId: id },
      data: { agencyId: reassignTo },
    });
    await prisma.ambassador.updateMany({
      where: { agencyId: id },
      data: { agencyId: reassignTo },
    });
    await prisma.lead.updateMany({
      where: { agencyId: id },
      data: { agencyId: reassignTo },
    });
  } else {
    await prisma.ambassador.updateMany({
      where: { agencyId: id },
      data: { agencyId: null },
    });
    await prisma.lead.updateMany({
      where: { agencyId: id },
      data: { agencyId: null },
    });

    for (const neg of agency.negotiators) {
      await prisma.user.delete({ where: { id: neg.userId } });
    }
  }

  await prisma.agency.delete({ where: { id } });

  return NextResponse.json({ success: true, reassignedTo: reassignTo || null });
}
