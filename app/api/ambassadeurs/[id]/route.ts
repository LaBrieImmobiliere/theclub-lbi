import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const ambassador = await prisma.ambassador.findUnique({
    where: { id },
    include: {
      user: true,
      leads: { orderBy: { createdAt: "desc" } },
      contracts: {
        include: { lead: true, honoraryAcknowledgments: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ambassador) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(ambassador);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Compute name from firstName + lastName if provided
  const userName = body.firstName && body.lastName
    ? body.firstName + " " + body.lastName
    : body.name;

  // Build ambassador-level data
  const ambassadorData: Record<string, unknown> = {};
  if (body.status !== undefined) ambassadorData.status = body.status;
  if (body.notes !== undefined) ambassadorData.notes = body.notes;

  // Legal status fields
  const legalFields = [
    "legalStatus", "companyName", "companyLegalForm", "companySiret",
    "companyTva", "companyRcs", "companyCapital", "companyAddress",
    "associationName", "associationRna", "associationObject",
  ];
  for (const field of legalFields) {
    if (body[field] !== undefined) {
      ambassadorData[field] = body[field];
    }
  }
  // Clear irrelevant fields when switching legal status
  if (body.legalStatus) {
    if (body.legalStatus !== "SOCIETE") {
      ambassadorData.companyName = null;
      ambassadorData.companyLegalForm = null;
      ambassadorData.companySiret = null;
      ambassadorData.companyTva = null;
      ambassadorData.companyRcs = null;
      ambassadorData.companyCapital = null;
      ambassadorData.companyAddress = null;
    }
    if (body.legalStatus !== "ASSOCIATION") {
      ambassadorData.associationName = null;
      ambassadorData.associationRna = null;
      ambassadorData.associationObject = null;
    }
  }

  const ambassador = await prisma.ambassador.update({
    where: { id },
    data: {
      ...ambassadorData,
      user: {
        update: {
          name: userName,
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone,
        },
      },
    },
    include: { user: true },
  });

  const sessionUser = session.user as { id?: string };
  await auditLog("UPDATE", "Ambassador", id, sessionUser.id, `Ambassadeur ${ambassador.user?.name} mis à jour`);

  return NextResponse.json(ambassador);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const ambassador = await prisma.ambassador.findUnique({ where: { id }, include: { user: true } });
  if (!ambassador) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const delSessionUser = session.user as { id?: string };
  await auditLog("DELETE", "Ambassador", id, delSessionUser.id, `Ambassadeur ${ambassador.user?.name} supprimé`);

  await prisma.user.delete({ where: { id: ambassador.userId } });
  return NextResponse.json({ success: true });
}
