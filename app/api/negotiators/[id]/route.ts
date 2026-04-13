import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const negotiator = await prisma.negotiator.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, firstName: true, lastName: true, email: true, phone: true, image: true } },
      agency: true,
      _count: { select: { leads: true, ambassadors: true } },
    },
  });

  if (!negotiator) {
    return NextResponse.json({ error: "Négociateur introuvable" }, { status: 404 });
  }

  return NextResponse.json(negotiator);
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
  const { name, email, phone, password, status } = body;

  const negotiator = await prisma.negotiator.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!negotiator) {
    return NextResponse.json({ error: "Négociateur introuvable" }, { status: 404 });
  }

  // Check email uniqueness if changed
  if (email && email !== negotiator.user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });
    }
  }

  // Update user fields
  const userData: Record<string, unknown> = {};
  if (name) userData.name = name;
  if (body.firstName) userData.firstName = body.firstName;
  if (body.lastName) userData.lastName = body.lastName;
  if (email) userData.email = email;
  if (phone !== undefined) userData.phone = phone || null;
  if (password) userData.password = await bcrypt.hash(password, 10);

  if (Object.keys(userData).length > 0) {
    await prisma.user.update({
      where: { id: negotiator.userId },
      data: userData,
    });
  }

  // Update negotiator fields
  const negData: Record<string, unknown> = {};
  if (status) negData.status = status;

  // Regenerate code if name changed
  if (name && name !== negotiator.user.name) {
    negData.code = generateNegCode(name);
  }

  if (Object.keys(negData).length > 0) {
    await prisma.negotiator.update({
      where: { id },
      data: negData,
    });
  }

  const updated = await prisma.negotiator.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, firstName: true, lastName: true, email: true, phone: true, image: true } },
      agency: true,
    },
  });

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

  const negotiator = await prisma.negotiator.findUnique({
    where: { id },
    include: { _count: { select: { leads: true } } },
  });

  if (!negotiator) {
    return NextResponse.json({ error: "Négociateur introuvable" }, { status: 404 });
  }

  // Check for reassignment parameter
  const url = new URL(req.url);
  const reassignTo = url.searchParams.get("reassignTo");

  if (reassignTo) {
    // Reassign all ambassadors to the new negotiator
    await prisma.ambassador.updateMany({
      where: { negotiatorId: id },
      data: { negotiatorId: reassignTo },
    });
    // Reassign all leads too
    await prisma.lead.updateMany({
      where: { negotiatorId: id },
      data: { negotiatorId: reassignTo },
    });
  } else {
    // Detach ambassadors (set negotiatorId to null)
    await prisma.ambassador.updateMany({
      where: { negotiatorId: id },
      data: { negotiatorId: null },
    });
    await prisma.lead.updateMany({
      where: { negotiatorId: id },
      data: { negotiatorId: null },
    });
  }

  // Delete user (cascades to negotiator)
  await prisma.user.delete({ where: { id: negotiator.userId } });

  return NextResponse.json({ success: true, reassignedTo: reassignTo || null });
}

function generateNegCode(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1][0].toUpperCase();
    return `NEG-${firstName}${lastInitial}`;
  }
  return `NEG-${parts[0]}`;
}
