import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewLeadEmail, sendNotificationEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { createLeadSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { role?: string; id?: string };
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  if (user.role === "ADMIN") {
    const leads = await prisma.lead.findMany({
      where: status ? { status } : undefined,
      include: {
        ambassador: { include: { user: { select: { name: true, email: true } } } },
        contract: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leads);
  }

  // Negotiator: leads assigned to their negotiator profile
  if (user.role === "NEGOTIATOR") {
    const negotiator = await prisma.negotiator.findUnique({
      where: { userId: user.id },
    });
    if (!negotiator) return NextResponse.json([]);

    const leads = await prisma.lead.findMany({
      where: {
        negotiatorId: negotiator.id,
        ...(status ? { status } : {}),
      },
      include: {
        ambassador: { include: { user: { select: { name: true, email: true } } } },
        contract: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leads);
  }

  // Ambassador: only their own leads
  const ambassador = await prisma.ambassador.findUnique({
    where: { userId: user.id },
  });
  if (!ambassador) return NextResponse.json([]);

  const leads = await prisma.lead.findMany({
    where: {
      ambassadorId: ambassador.id,
      ...(status ? { status } : {}),
    },
    include: { contract: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { role?: string; id?: string };

  // Rate limiting
  const rl = rateLimit(`leads:${user.id}`, 20, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Trop de requ\u00eates" }, { status: 429 });

  const body = await req.json();
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Donn\u00e9es invalides" }, { status: 400 });
  }
  const { firstName, lastName, email, phone, type, description, budget, location } = parsed.data;

  let ambassadorId = parsed.data.ambassadorId ?? "";

  if (user.role !== "ADMIN") {
    const ambassador = await prisma.ambassador.findUnique({
      where: { userId: user.id },
    });
    if (!ambassador) return NextResponse.json({ error: "Ambassadeur introuvable" }, { status: 404 });
    ambassadorId = ambassador.id;
  }

  if (!ambassadorId) return NextResponse.json({ error: "Ambassadeur requis" }, { status: 400 });

  const lead = await prisma.lead.create({
    data: {
      ambassadorId,
      firstName,
      lastName,
      email,
      phone,
      type,
      description,
      budget,
      location,
    },
  });

  await auditLog("CREATE", "Lead", lead.id, user.id, `Recommandation ${firstName} ${lastName} (${type}) par ambassadeur`);

  // Fetch ambassador details for notifications
  const ambassador = await prisma.ambassador.findUnique({
    where: { id: ambassadorId },
    include: {
      user: { select: { name: true, email: true, id: true } },
      negotiator: { include: { user: { select: { name: true, email: true, id: true } } } },
    },
  });

  const leadFullName = `${firstName} ${lastName}`;
  const ambassadorName = ambassador?.user?.name || "Un ambassadeur";

  // 1. Notify all admins (in-app + email)
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: "Nouvelle recommandation",
        message: `${ambassadorName} a recommandé ${leadFullName} (${type}).`,
        type: "LEAD",
        link: "/admin/recommandations",
      },
    });
    try {
      await sendNotificationEmail(
        admin.email,
        admin.name || "Admin",
        "Nouvelle recommandation reçue",
        `${ambassadorName} vient de recommander ${leadFullName} (${type}). Connectez-vous pour traiter cette recommandation.`
      );
    } catch { /* email failure shouldn't block */ }
    try { await sendPushToUser(admin.id, "Nouvelle recommandation", `${ambassadorName} a recommandé ${leadFullName}`, "/admin/recommandations"); } catch { /* push failure shouldn't block */ }
  }

  // 2. Notify the negotiator linked to this ambassador (in-app + email)
  if (ambassador?.negotiator) {
    const neg = ambassador.negotiator;
    await prisma.notification.create({
      data: {
        userId: neg.user.id,
        title: "Nouvelle recommandation",
        message: `Votre ambassadeur ${ambassadorName} a recommandé ${leadFullName} (${type}).`,
        type: "LEAD",
        link: "/negociateur/mes-recommandations",
      },
    });
    try {
      await sendNotificationEmail(
        neg.user.email,
        neg.user.name || "Négociateur",
        "Nouvelle recommandation d'un ambassadeur",
        `${ambassadorName} vient de recommander ${leadFullName} (${type}). Connectez-vous pour consulter les détails.`
      );
    } catch { /* email failure shouldn't block */ }
    try { await sendPushToUser(neg.user.id, "Nouvelle recommandation", `${ambassadorName} a recommandé ${leadFullName}`, "/negociateur/mes-recommandations"); } catch { /* push failure shouldn't block */ }
  }

  return NextResponse.json(lead, { status: 201 });
}
