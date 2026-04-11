import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const user = session.user as { role?: string; id?: string };

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      ambassador: { include: { user: true } },
      lead: true,
      honoraryAcknowledgments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!contract) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Ambassador can only see their own contracts
  if (user.role !== "ADMIN") {
    const ambassador = await prisma.ambassador.findUnique({ where: { userId: user.id } });
    if (!ambassador || contract.ambassadorId !== ambassador.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  }

  return NextResponse.json(contract);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const user = session.user as { role?: string; id?: string };

  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Admin can update anything; ambassador can only add their signature
  if (user.role !== "ADMIN") {
    const ambassador = await prisma.ambassador.findUnique({ where: { userId: user.id } });
    if (!ambassador || contract.ambassadorId !== ambassador.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    // Ambassador can only sign
    const updated = await prisma.contract.update({
      where: { id },
      data: {
        ambassadorSignature: body.ambassadorSignature,
        status: body.ambassadorSignature ? "SIGNE" : contract.status,
        signedAt: body.ambassadorSignature ? new Date() : contract.signedAt,
      },
    });
    return NextResponse.json(updated);
  }

  // Admin full update
  let commissionAmount = contract.commissionAmount;
  if (body.commissionType === "PERCENTAGE" && body.honoraires) {
    commissionAmount = (body.honoraires * body.commissionValue) / 100;
  } else if (body.commissionType === "FIXED" && body.commissionValue) {
    commissionAmount = body.commissionValue;
  }

  const updated = await prisma.contract.update({
    where: { id },
    data: {
      status: body.status,
      commissionType: body.commissionType,
      commissionValue: body.commissionValue,
      propertyAddress: body.propertyAddress,
      propertyPrice: body.propertyPrice,
      honoraires: body.honoraires,
      commissionAmount,
      adminSignature: body.adminSignature,
      notes: body.notes,
      paidAt: body.status === "PAYE" ? new Date() : contract.paidAt,
    },
    include: {
      ambassador: { include: { user: true } },
      lead: true,
      honoraryAcknowledgments: true,
    },
  });

  // Send notification if status changed
  if (body.status && body.status !== contract.status) {
    try {
      const ambassadorUser = updated.ambassador?.user;
      if (ambassadorUser) {
        const contractNumber = updated.number || id;
        let subject = "";
        let message = "";
        let notifTitle = "";

        switch (body.status) {
          case "ENVOYE":
            subject = `Votre contrat ${contractNumber} est prêt à signer`;
            message = `Votre contrat ${contractNumber} a été envoyé et est prêt à être signé.`;
            notifTitle = "Contrat prêt à signer";
            break;
          case "SIGNE":
            subject = `Votre contrat ${contractNumber} a été validé`;
            message = `Votre contrat ${contractNumber} a été signé et validé.`;
            notifTitle = "Contrat validé";
            break;
          case "PAYE":
            subject = `Votre commission de ${commissionAmount}€ a été versée`;
            message = `Votre commission de ${commissionAmount}€ pour le contrat ${contractNumber} a été versée.`;
            notifTitle = "Commission versée";
            break;
          case "ANNULE":
            subject = `Votre contrat ${contractNumber} a été annulé`;
            message = `Votre contrat ${contractNumber} a été annulé.`;
            notifTitle = "Contrat annulé";
            break;
        }

        if (subject) {
          await sendNotificationEmail(
            ambassadorUser.email!,
            ambassadorUser.name || "Ambassadeur",
            subject,
            message
          );

          await prisma.notification.create({
            data: {
              userId: ambassadorUser.id,
              title: notifTitle,
              message,
              type: "CONTRACT_STATUS",
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to send contract status notification:", error);
    }
  }

  return NextResponse.json(updated);
}
