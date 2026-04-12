import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json(null, { status: 401 });

  const user = session.user as { id?: string };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      onboarded: true,
      createdAt: true,
    },
  });

  if (!dbUser) return NextResponse.json(null, { status: 404 });

  return NextResponse.json(dbUser);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autoris\u00e9" }, { status: 401 });

  const user = session.user as { id?: string };
  if (!user.id) return NextResponse.json({ error: "Non autoris\u00e9" }, { status: 401 });

  const body = await req.json();
  const { name, firstName, lastName, phone, image, currentPassword, newPassword } = body;

  // Password change
  if (currentPassword && newPassword) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!dbUser || !dbUser.password) {
      return NextResponse.json(
        { error: "Impossible de changer le mot de passe" },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caract\u00e8res" },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 1 majuscule et 1 chiffre" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Mot de passe mis \u00e0 jour" });
  }

  // Profile update
  const data: Record<string, string | boolean> = {};
  if (typeof name === "string") data.name = name.trim();
  if (typeof firstName === "string") data.firstName = firstName.trim();
  if (typeof lastName === "string") data.lastName = lastName.trim();
  if (typeof phone === "string") data.phone = phone.trim();
  if (typeof image === "string") data.image = image;
  if (typeof body.onboarded === "boolean") data.onboarded = body.onboarded;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucune donn\u00e9e \u00e0 mettre \u00e0 jour" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      onboarded: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE — Suppression du compte (droit à l'effacement RGPD)
export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { id?: string };
  if (!user.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Cascade delete: User model has onDelete: Cascade on Ambassador, Negotiator, etc.
  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ success: true, message: "Compte supprimé" });
}
