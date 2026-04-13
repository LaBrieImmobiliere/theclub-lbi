import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { sendNotificationEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ackId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, ackId } = await params;
  const body = await req.json();
  const user = session.user as { role?: string; id?: string; name?: string };

  const ack = await prisma.honoraryAcknowledgment.findUnique({
    where: { id: ackId },
    include: {
      contract: {
        include: {
          ambassador: { include: { user: true } },
          lead: true,
        },
      },
    },
  });
  if (!ack) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // ── AMBASSADOR signs ──
  if (user.role !== "ADMIN" && user.role !== "NEGOTIATOR") {
    const ambassador = await prisma.ambassador.findUnique({ where: { userId: user.id } });
    if (!ambassador || ack.contract.ambassadorId !== ambassador.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (!body.ambassadorSignature) {
      return NextResponse.json({ error: "Signature requise" }, { status: 400 });
    }

    const updated = await prisma.honoraryAcknowledgment.update({
      where: { id: ackId },
      data: {
        ambassadorSignature: body.ambassadorSignature,
        signedAt: new Date(),
        status: "SIGNEE_AMBASSADEUR",
      },
    });

    // Notify all admins that the ambassador has signed
    try {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      const ambassadorName = ack.contract.ambassador.user.name || "Un ambassadeur";
      const leadName = ack.contract.lead
        ? `${ack.contract.lead.firstName} ${ack.contract.lead.lastName}`
        : ack.number;

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: "Reconnaissance signée ✍️",
            message: `${ambassadorName} a signé la reconnaissance d'honoraires ${ack.number} (${leadName}). Contresignez-la pour finaliser.`,
            type: "LEAD",
            link: `/admin/contrats/${id}`,
          },
        });
        await sendPushToUser(
          admin.id,
          "Reconnaissance signée ✍️",
          `${ambassadorName} a signé la reconnaissance ${ack.number}. À vous de contresigner !`,
          `/admin/contrats/${id}`
        );
        await sendNotificationEmail(
          admin.email,
          admin.name || "Admin",
          "Reconnaissance d'honoraires signée ✍️",
          `${ambassadorName} a signé la reconnaissance d'honoraires ${ack.number} pour ${leadName}. Connectez-vous pour la contresigner.`
        );
      }
    } catch (err) {
      console.error("Failed to notify admins:", err);
    }

    return NextResponse.json(updated);
  }

  // ── ADMIN / NEGOTIATOR actions ──

  // Admin countersigns
  if (body.adminSignature) {
    if (ack.status !== "SIGNEE_AMBASSADEUR") {
      return NextResponse.json(
        { error: "L'ambassadeur doit signer en premier" },
        { status: 400 }
      );
    }

    const updated = await prisma.honoraryAcknowledgment.update({
      where: { id: ackId },
      data: {
        adminSignature: body.adminSignature,
        countersignedAt: new Date(),
        status: "CONTRESIGNEE",
      },
    });

    // Notify ambassador that the acknowledgment is fully signed
    try {
      const ambUser = ack.contract.ambassador.user;
      const leadName = ack.contract.lead
        ? `${ack.contract.lead.firstName} ${ack.contract.lead.lastName}`
        : ack.number;

      await prisma.notification.create({
        data: {
          userId: ambUser.id,
          title: "Reconnaissance contresignée ✅",
          message: `Votre reconnaissance d'honoraires ${ack.number} (${leadName}) a été contresignée par l'agence. Le versement de votre commission est en cours.`,
          type: "SUCCESS",
          link: `/portail/mes-contrats/${id}`,
        },
      });
      await sendPushToUser(
        ambUser.id,
        "Reconnaissance contresignée ✅",
        `La reconnaissance ${ack.number} est signée par les deux parties !`,
        `/portail/mes-contrats/${id}`
      );
      await sendNotificationEmail(
        ambUser.email!,
        ambUser.name || "Ambassadeur",
        "Reconnaissance d'honoraires contresignée ✅",
        `Bonne nouvelle ! Votre reconnaissance d'honoraires ${ack.number} pour ${leadName} a été contresignée par l'agence. Le versement de votre commission est en cours.`
      );
    } catch (err) {
      console.error("Failed to notify ambassador of countersignature:", err);
    }

    return NextResponse.json(updated);
  }

  // Admin status update (validate, mark paid, etc.)
  const updateData: Record<string, unknown> = {};
  if (body.status) updateData.status = body.status;
  if (body.amount) updateData.amount = parseFloat(body.amount);
  if (body.description !== undefined) updateData.description = body.description;
  if (body.paymentRef) updateData.paymentRef = body.paymentRef;
  if (body.status === "PAYEE") updateData.paidAt = new Date();

  const updated = await prisma.honoraryAcknowledgment.update({
    where: { id: ackId },
    data: updateData,
  });

  return NextResponse.json(updated);
}
