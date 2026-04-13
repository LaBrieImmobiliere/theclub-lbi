import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt, decrypt } from "@/lib/crypto";

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
      rib: true,
      onboarded: true,
      createdAt: true,
      ambassador: {
        select: {
          id: true,
          legalStatus: true,
          companyName: true,
          companyLegalForm: true,
          companySiret: true,
          companyTva: true,
          companyRcs: true,
          companyCapital: true,
          companyAddress: true,
          associationName: true,
          associationRna: true,
          associationObject: true,
        },
      },
    },
  });

  if (!dbUser) return NextResponse.json(null, { status: 404 });

  // Decrypt RIB for reading
  if (dbUser.rib) {
    dbUser.rib = decrypt(dbUser.rib);
  }

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

  // Check if RIB is being added/changed (before update)
  const isNewRib = typeof body.rib === "string" && body.rib.trim().length > 0;
  let previousRib: string | null = null;
  if (isNewRib) {
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { rib: true },
    });
    previousRib = currentUser?.rib ?? null;
  }

  // Profile update
  const data: Record<string, string | boolean> = {};
  if (typeof name === "string") data.name = name.trim();
  if (typeof firstName === "string") data.firstName = firstName.trim();
  if (typeof lastName === "string") data.lastName = lastName.trim();
  if (typeof phone === "string") data.phone = phone.trim();
  if (typeof image === "string") data.image = image;
  if (typeof body.rib === "string") data.rib = body.rib.trim() ? encrypt(body.rib.trim()) : body.rib;
  if (typeof body.onboarded === "boolean") data.onboarded = body.onboarded;

  // Ambassador legal status update
  const ambassadorFields = [
    "legalStatus", "companyName", "companyLegalForm", "companySiret",
    "companyTva", "companyRcs", "companyCapital", "companyAddress",
    "associationName", "associationRna", "associationObject",
  ];
  const ambassadorData: Record<string, string | null> = {};
  for (const field of ambassadorFields) {
    if (body[field] !== undefined) {
      ambassadorData[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
    }
  }
  // Clear irrelevant fields when switching legal status
  if (ambassadorData.legalStatus) {
    if (ambassadorData.legalStatus !== "SOCIETE") {
      ambassadorData.companyName = null;
      ambassadorData.companyLegalForm = null;
      ambassadorData.companySiret = null;
      ambassadorData.companyTva = null;
      ambassadorData.companyRcs = null;
      ambassadorData.companyCapital = null;
      ambassadorData.companyAddress = null;
    }
    if (ambassadorData.legalStatus !== "ASSOCIATION") {
      ambassadorData.associationName = null;
      ambassadorData.associationRna = null;
      ambassadorData.associationObject = null;
    }
  }

  const hasAmbassadorUpdate = Object.keys(ambassadorData).length > 0;

  if (Object.keys(data).length === 0 && !hasAmbassadorUpdate) {
    return NextResponse.json({ error: "Aucune donn\u00e9e \u00e0 mettre \u00e0 jour" }, { status: 400 });
  }

  // Update ambassador fields if needed
  if (hasAmbassadorUpdate) {
    const ambassador = await prisma.ambassador.findUnique({ where: { userId: user.id } });
    if (ambassador) {
      await prisma.ambassador.update({
        where: { id: ambassador.id },
        data: ambassadorData,
      });
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: Object.keys(data).length > 0 ? data : {},
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      rib: true,
      onboarded: true,
      createdAt: true,
      ambassador: {
        select: {
          id: true,
          legalStatus: true,
          companyName: true,
          companyLegalForm: true,
          companySiret: true,
          companyTva: true,
          companyRcs: true,
          companyCapital: true,
          companyAddress: true,
          associationName: true,
          associationRna: true,
          associationObject: true,
        },
      },
    },
  });

  // Notify admin if RIB was added or changed
  if (isNewRib && body.rib !== previousRib && updated.role === "AMBASSADOR") {
    try {
      const { sendRibAddedNotification } = await import("@/lib/email");
      await sendRibAddedNotification(
        updated.name || "Ambassadeur",
        updated.email,
        body.rib,
      );
    } catch (error) {
      console.error("Failed to send RIB notification:", error);
    }
  }

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
