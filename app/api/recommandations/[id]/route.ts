import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  CONTACTE: "Contacté",
  EN_COURS: "En cours",
  SIGNE: "Signé",
  PERDU: "Perdu",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userRole = (session?.user as { role?: string })?.role;
  if (!session || (userRole !== "ADMIN" && userRole !== "NEGOTIATOR")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Negotiators can only update status and notes (not other fields)
  if (userRole === "NEGOTIATOR") {
    const userId = (session.user as { id?: string }).id;
    const negotiator = await prisma.negotiator.findUnique({ where: { userId } });
    if (!negotiator) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead || lead.negotiatorId !== negotiator.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  }

  const { id } = await params;
  const body = await req.json();

  // Fetch current lead to detect status change
  const currentLead = await prisma.lead.findUnique({ where: { id } });
  const oldStatus = currentLead?.status;

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      status: body.status,
      notes: body.notes,
    },
  });

  // Record status change history + notifications
  if (body.status && body.status !== oldStatus) {
    const userName = (session.user as { name?: string }).name || "Système";
    const userId = (session.user as { id?: string }).id;

    // Save status history
    await prisma.leadStatusHistory.create({
      data: {
        leadId: id,
        fromStatus: oldStatus || null,
        toStatus: body.status,
        changedBy: userName,
        note: body.notes || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: "STATUS_CHANGE",
        entity: "Lead",
        entityId: id,
        details: `${oldStatus} → ${body.status} par ${userName}`,
      },
    });

    try {
      const leadWithAmbassador = await prisma.lead.findUnique({
        where: { id },
        include: { ambassador: { include: { user: true } } },
      });

      if (leadWithAmbassador?.ambassador?.user) {
        const { user } = leadWithAmbassador.ambassador;
        const leadName = `${leadWithAmbassador.firstName} ${leadWithAmbassador.lastName}`;
        const statusLabel = STATUS_LABELS[body.status] || body.status;

        await sendNotificationEmail(
          user.email!,
          user.name || "Ambassadeur",
          "Votre recommandation a été mise à jour",
          `${leadName} est passé au statut ${statusLabel}.`
        );

        await prisma.notification.create({
          data: {
            userId: user.id,
            title: "Recommandation mise à jour",
            message: `${leadName} est passé au statut ${statusLabel}.`,
            type: "LEAD",
            link: "/portail/mes-recommandations",
          },
        });

        // Check badges for ambassador
        const leadCount = await prisma.lead.count({ where: { ambassadorId: leadWithAmbassador.ambassadorId } });
        const contractCount = await prisma.contract.count({ where: { ambassadorId: leadWithAmbassador.ambassadorId } });
        const existingBadges = await prisma.badge.findMany({ where: { userId: user.id } });
        const badgeTypes = existingBadges.map(b => b.type);

        const badgesToCreate: { type: string; label: string }[] = [];
        if (leadCount >= 1 && !badgeTypes.includes("FIRST_LEAD")) badgesToCreate.push({ type: "FIRST_LEAD", label: "Premier lead" });
        if (leadCount >= 5 && !badgeTypes.includes("5_LEADS")) badgesToCreate.push({ type: "5_LEADS", label: "5 recommandations" });
        if (leadCount >= 10 && !badgeTypes.includes("10_LEADS")) badgesToCreate.push({ type: "10_LEADS", label: "10 recommandations" });
        if (leadCount >= 25 && !badgeTypes.includes("25_LEADS")) badgesToCreate.push({ type: "25_LEADS", label: "25 recommandations" });
        if (contractCount >= 1 && !badgeTypes.includes("FIRST_CONTRACT")) badgesToCreate.push({ type: "FIRST_CONTRACT", label: "Premier contrat" });
        if (contractCount >= 5 && !badgeTypes.includes("5_CONTRACTS")) badgesToCreate.push({ type: "5_CONTRACTS", label: "5 contrats signés" });

        for (const badge of badgesToCreate) {
          await prisma.badge.create({ data: { userId: user.id, ...badge } });
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: `Badge débloqué : ${badge.label}`,
              message: `Félicitations ! Vous avez obtenu le badge "${badge.label}".`,
              type: "SUCCESS",
              link: "/portail/profil",
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to send lead status notification:", error);
    }
  }

  return NextResponse.json(lead);
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
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
