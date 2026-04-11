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

  // Send notification if status changed
  if (body.status && body.status !== oldStatus) {
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
            type: "LEAD_STATUS",
          },
        });
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
