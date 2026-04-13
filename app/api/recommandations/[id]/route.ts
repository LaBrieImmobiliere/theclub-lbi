import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  PRIS_EN_CHARGE: "Pris en charge",
  CONTACTE: "Contacté",
  RDV_PLANIFIE: "RDV planifié",
  EN_NEGOCIATION: "En négociation",
  MANDAT_SIGNE: "Mandat signé",
  SOUS_OFFRE: "Sous offre",
  COMPROMIS_SIGNE: "Compromis signé",
  ACTE_SIGNE: "Acte signé",
  COMMISSION_VERSEE: "Commission versée",
  EN_PAUSE: "En pause",
  PERDU: "Perdu",
  EN_COURS: "En cours",
  SIGNE: "Signé",
};

// Fun notification messages like mareco by BSK
const STATUS_NOTIFICATIONS: Record<string, { title: string; message: (name: string) => string }> = {
  PRIS_EN_CHARGE: {
    title: "Reco acceptée ! \u2705",
    message: (name) => `Bonne nouvelle ! Votre recommandation ${name} a été prise en charge par un négociateur.`,
  },
  CONTACTE: {
    title: "Premier contact ! \uD83D\uDCDE",
    message: (name) => `Votre recommandation ${name} a été contactée. Le dossier avance !`,
  },
  RDV_PLANIFIE: {
    title: "RDV programmé ! \uD83D\uDCC5",
    message: (name) => `Super ! Un rendez-vous est planifié pour ${name}. On avance bien !`,
  },
  EN_NEGOCIATION: {
    title: "Négociation en cours ! \uD83E\uDD1D",
    message: (name) => `Le dossier ${name} entre en négociation. Croisons les doigts !`,
  },
  MANDAT_SIGNE: {
    title: "Le mandat est signé ! \uD83D\uDC90",
    message: (name) => `Suuuuper nouvelle : un mandat de vente a été signé grâce à votre reco ${name} !`,
  },
  SOUS_OFFRE: {
    title: "Sous offre ! \uD83D\uDCB0",
    message: (name) => `Une offre a été acceptée pour ${name} ! Le dossier est bien engagé.`,
  },
  COMPROMIS_SIGNE: {
    title: "Champagne ! Le compromis est signé \uD83C\uDF7E",
    message: (name) => `Pssst, la vente du bien que vous avez recommandé (${name}) avance super bien ! Le compromis a été signé \u270D\uFE0F`,
  },
  ACTE_SIGNE: {
    title: "Transaction réussie ! \uD83C\uDFE0",
    message: (name) => `Tout est bon ! L'acte de vente pour ${name} est signé chez le notaire.`,
  },
  COMMISSION_VERSEE: {
    title: "Votre gain vous attend ! \uD83E\uDD11",
    message: (name) => `Tout est bon ! La transaction ${name} est finalisée et votre reco vous a rapporté un joli gain \uD83E\uDD29`,
  },
  PERDU: {
    title: "Dossier non abouti",
    message: (name) => `Le dossier ${name} n'a malheureusement pas abouti. Ne vous découragez pas, continuez à recommander !`,
  },
  EN_PAUSE: {
    title: "Dossier en pause \u23F8\uFE0F",
    message: (name) => `Le dossier ${name} est temporairement en pause. On vous tiendra informé de la suite.`,
  },
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
    include: { contract: true },
  });

  // Sync: when lead → COMMISSION_VERSEE, also set contract to PAYE
  if (body.status === "COMMISSION_VERSEE" && lead.contract && lead.contract.status !== "PAYE") {
    await prisma.contract.update({
      where: { id: lead.contract.id },
      data: { status: "PAYE", paidAt: new Date() },
    });
  }

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

        const funNotif = STATUS_NOTIFICATIONS[body.status];
        const notifTitle = funNotif?.title || `Recommandation mise à jour`;
        const notifMessage = funNotif?.message(leadName) || `${leadName} est passé au statut ${statusLabel}.`;

        await sendNotificationEmail(
          user.email!,
          user.name || "Ambassadeur",
          notifTitle,
          notifMessage
        );

        await prisma.notification.create({
          data: {
            userId: user.id,
            title: notifTitle,
            message: notifMessage,
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
