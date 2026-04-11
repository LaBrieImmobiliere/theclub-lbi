import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firstName, lastName, email, phone, type, description, budget, location, referralCode } = body;

  if (!firstName || !lastName || !phone || !type) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  if (!referralCode) {
    return NextResponse.json({ error: "Code de parrainage manquant" }, { status: 400 });
  }

  // Try ambassador first, then negotiator
  const ambassador = await prisma.ambassador.findUnique({
    where: { code: referralCode },
    include: { user: true },
  });

  const negotiator = !ambassador
    ? await prisma.negotiator.findUnique({
        where: { code: referralCode },
        include: { user: true },
      })
    : null;

  if (!ambassador && !negotiator) {
    return NextResponse.json({ error: "Code de parrainage invalide" }, { status: 404 });
  }

  if (ambassador) {
    const lead = await prisma.lead.create({
      data: {
        ambassadorId: ambassador.id,
        agencyId: ambassador.agencyId,
        firstName, lastName,
        email: email || null, phone, type,
        description: description || null,
        budget: budget || null,
        location: location || null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: ambassador.userId,
        title: "Nouvelle recommandation",
        message: `${firstName} ${lastName} a soumis une demande via votre lien de parrainage.`,
        type: "SUCCESS",
      },
    });

    return NextResponse.json(lead, { status: 201 });
  }

  // Negotiator referral - need a default ambassador for the lead (or create a system one)
  // For now, the lead is attributed to the negotiator via negotiatorId
  // We need an ambassador for the relation - use a system/placeholder
  if (negotiator) {
    // Find or create a system ambassador for negotiator-originated leads
    let systemAmb = await prisma.ambassador.findFirst({
      where: { code: "SYSTEM-NEG" },
    });

    if (!systemAmb) {
      // Create a system user for negotiator leads
      const systemUser = await prisma.user.create({
        data: {
          name: "Leads Négociateurs",
          email: "system-neg@labrieimmobiliere.fr",
          password: "SYSTEM",
          role: "AMBASSADOR",
          ambassador: {
            create: { code: "SYSTEM-NEG", status: "SYSTEM" },
          },
        },
        include: { ambassador: true },
      });
      systemAmb = systemUser.ambassador!;
    }

    const lead = await prisma.lead.create({
      data: {
        ambassadorId: systemAmb.id,
        negotiatorId: negotiator.id,
        agencyId: negotiator.agencyId,
        firstName, lastName,
        email: email || null, phone, type,
        description: description || null,
        budget: budget || null,
        location: location || null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: negotiator.userId,
        title: "Nouvelle recommandation",
        message: `${firstName} ${lastName} a soumis une demande via votre lien de parrainage.`,
        type: "SUCCESS",
      },
    });

    return NextResponse.json(lead, { status: 201 });
  }

  return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
}
