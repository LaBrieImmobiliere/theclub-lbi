import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail, sendRibReminderEmail, sendContractEmail } from "@/lib/email";
import { generateContractPDFBuffer } from "@/lib/pdf-server";
import { auditLog } from "@/lib/audit";

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
      include: { ambassador: { include: { user: true } } },
    });

    // Send RIB reminder if ambassador signed and has no RIB
    if (body.ambassadorSignature && updated.ambassador?.user) {
      const ambUser = updated.ambassador.user;
      if (!ambUser.rib) {
        try {
          await sendRibReminderEmail(
            ambUser.email!,
            ambUser.name || "Ambassadeur",
            updated.number || id,
          );
        } catch (error) {
          console.error("Failed to send RIB reminder:", error);
        }
      }
    }

    return NextResponse.json(updated);
  }

  // Admin full update — auto-calculate commission
  const cType = body.commissionType || contract.commissionType;
  const cValue = body.commissionValue ?? contract.commissionValue;
  const cHonoraires = body.honoraires ?? contract.honoraires;
  let commissionAmount = contract.commissionAmount;
  if (cType === "PERCENTAGE" && cHonoraires && cValue) {
    commissionAmount = (cHonoraires * cValue) / 100;
  } else if (cType === "FIXED" && cValue) {
    commissionAmount = cValue;
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

  await auditLog("UPDATE", "Contract", id, user.id, body.status !== contract.status ? `Statut: ${contract.status} → ${body.status}` : "Contrat mis à jour");

  // Sync: when contract → PAYE, also set the associated lead to COMMISSION_VERSEE
  if (body.status === "PAYE" && updated.lead && updated.lead.status !== "COMMISSION_VERSEE") {
    await prisma.lead.update({
      where: { id: updated.lead.id },
      data: { status: "COMMISSION_VERSEE" },
    });
  }

  // Send notification if status changed
  if (body.status && body.status !== contract.status) {
    try {
      const ambassadorUser = updated.ambassador?.user;
      if (ambassadorUser) {
        const contractNumber = updated.number || id;
        let subject = "";
        let message = "";
        let notifTitle = "";

        const fmtAmount = (amt: number) =>
          new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amt);
        const displayAmount = updated.commissionAmount || commissionAmount;

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
            if (displayAmount) {
              const ambLegalStatus = updated.ambassador?.legalStatus;
              const isSociete = ambLegalStatus === "SOCIETE";
              if (isSociete) {
                const ttc = displayAmount * 1.20;
                subject = `Votre commission de ${fmtAmount(ttc)} TTC a été versée`;
                message = `Votre commission pour le contrat ${contractNumber} a été versée.\n\nCommission HT : ${fmtAmount(displayAmount)}\nTVA (20%) : ${fmtAmount(displayAmount * 0.20)}\nCommission TTC : ${fmtAmount(ttc)}`;
              } else {
                subject = `Votre commission de ${fmtAmount(displayAmount)} a été versée`;
                message = `Votre commission de ${fmtAmount(displayAmount)} pour le contrat ${contractNumber} a été versée.`;
              }
            } else {
              subject = `Votre commission pour le contrat ${contractNumber} a été versée`;
              message = `Votre commission pour le contrat ${contractNumber} a été versée. Consultez votre espace pour plus de détails.`;
            }
            notifTitle = "Commission versée 💰";
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

          // Send contract PDF when status → ENVOYE (admin signed and sent)
          if (body.status === "ENVOYE") {
            try {
              const pdfBuffer = generateContractPDFBuffer(updated);
              await sendContractEmail(
                ambassadorUser.email!,
                ambassadorUser.name || "Ambassadeur",
                contractNumber,
                pdfBuffer
              );
            } catch (pdfErr) {
              console.error("Failed to send contract PDF:", pdfErr);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send contract status notification:", error);
    }
  }

  return NextResponse.json(updated);
}
