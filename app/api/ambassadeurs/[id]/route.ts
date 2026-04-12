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

  const ambassador = await prisma.ambassador.update({
    where: { id },
    data: {
      status: body.status,
      notes: body.notes,
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
  const ambassador = await prisma.ambassador.findUnique({ where: { id } });
  if (!ambassador) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: ambassador.userId } });
  return NextResponse.json({ success: true });
}
