import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { rateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

// Schéma allégé: formulaire public, 3 champs obligatoires
const publicLeadSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  email: z.string().email().optional().or(z.literal("")),
  type: z.enum(["ACHAT", "VENTE", "LOCATION", "INVESTISSEMENT", "AUTRE"]),
});

type RouteCtx = { params: Promise<{ code: string }> };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const { code } = await ctx.params;
  if (!code) return NextResponse.json({ error: "Code requis" }, { status: 400 });

  const ambassador = await prisma.ambassador.findUnique({
    where: { code },
    include: {
      user: { select: { name: true } },
      agency: { select: { name: true, city: true } },
      negotiator: { include: { agency: { select: { name: true, city: true } } } },
    },
  });

  if (!ambassador || ambassador.status !== "ACTIVE") {
    return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
  }

  const agency = ambassador.agency ?? ambassador.negotiator?.agency ?? null;

  return NextResponse.json({
    name: ambassador.user?.name ?? null,
    agencyName: agency?.name ?? "La Brie Immobilière",
    agencyCity: agency?.city ?? "Villecresnes",
  });
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { code } = await ctx.params;
  if (!code) return NextResponse.json({ error: "Code requis" }, { status: 400 });

  // Rate limit par IP: 5 submissions / 10 min pour éviter spam
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`public-lead:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = publicLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Données invalides" },
      { status: 400 }
    );
  }

  const ambassador = await prisma.ambassador.findUnique({
    where: { code },
    include: {
      user: { select: { id: true, name: true, email: true } },
      negotiator: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!ambassador || ambassador.status !== "ACTIVE") {
    return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
  }

  const { firstName, lastName, phone, email, type } = parsed.data;

  const lead = await prisma.lead.create({
    data: {
      ambassadorId: ambassador.id,
      negotiatorId: ambassador.negotiatorId ?? null,
      agencyId: ambassador.agencyId ?? null,
      firstName,
      lastName,
      phone,
      email: email || undefined,
      type,
      description: "Recommandation reçue via le lien partagé par l'ambassadeur.",
    },
  });

  await auditLog(
    "CREATE",
    "Lead",
    lead.id,
    ambassador.userId,
    `Recommandation ${firstName} ${lastName} (${type}) via lien public /r/${code}`
  );

  const leadFullName = `${firstName} ${lastName}`;
  const ambassadorName = ambassador.user?.name ?? "Un ambassadeur";

  // Notifier l'ambassadeur: sa reco est bien enregistrée
  await prisma.notification.create({
    data: {
      userId: ambassador.userId,
      title: "Nouvelle recommandation via votre lien",
      message: `${leadFullName} vient de laisser ses coordonnées via votre lien de partage.`,
      type: "LEAD",
      link: "/portail/mes-recommandations",
    },
  });
  try {
    await sendPushToUser(
      ambassador.userId,
      "Nouvelle recommandation",
      `${leadFullName} vient de s'inscrire via votre lien.`,
      "/portail/mes-recommandations"
    );
  } catch {
    /* push failure non bloquant */
  }

  // Notifier le conseiller lié à cet ambassadeur
  if (ambassador.negotiator) {
    const neg = ambassador.negotiator;
    await prisma.notification.create({
      data: {
        userId: neg.user.id,
        title: "Nouvelle recommandation",
        message: `${ambassadorName} vient de vous transmettre ${leadFullName} (${type}) via son lien.`,
        type: "LEAD",
        link: "/negociateur/mes-recommandations",
      },
    });
    try {
      await sendNotificationEmail(
        neg.user.email,
        neg.user.name || "Conseiller",
        "Nouvelle recommandation (lien ambassadeur)",
        `${ambassadorName} vient de vous transmettre ${leadFullName} (${type}) via son lien de partage. Connectez-vous pour consulter les détails.`
      );
    } catch {
      /* email failure non bloquant */
    }
    try {
      await sendPushToUser(
        neg.user.id,
        "Nouvelle recommandation",
        `${ambassadorName} a transmis ${leadFullName}`,
        "/negociateur/mes-recommandations"
      );
    } catch {
      /* push failure non bloquant */
    }
  }

  // Notifier les admins
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: "Nouvelle recommandation (lien)",
        message: `${ambassadorName} a transmis ${leadFullName} via son lien de partage.`,
        type: "LEAD",
        link: "/admin/recommandations",
      },
    });
  }

  return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
}
