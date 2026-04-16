import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

// POST — Create an apporteur d'affaire contract for an existing ambassador
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { ambassadorId, commissionValue } = body;

  if (!ambassadorId) {
    return NextResponse.json({ error: "ID ambassadeur requis" }, { status: 400 });
  }

  const ambassador = await prisma.ambassador.findUnique({
    where: { id: ambassadorId },
    include: { user: true },
  });

  if (!ambassador) {
    return NextResponse.json({ error: "Ambassadeur introuvable" }, { status: 404 });
  }

  // Check if a contract already exists for this ambassador (without a lead = apporteur contract)
  const existingContract = await prisma.contract.findFirst({
    where: { ambassadorId, leadId: null },
  });

  if (existingContract) {
    return NextResponse.json({
      error: "Un contrat d'apporteur d'affaire existe déjà pour cet ambassadeur",
      contractId: existingContract.id,
    }, { status: 400 });
  }

  // Create the contract
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const contractNumber = `CAA-${year}-${random}`;

  const contract = await prisma.contract.create({
    data: {
      ambassadorId,
      number: contractNumber,
      commissionType: "PERCENTAGE",
      commissionValue: commissionValue || 5,
      // ENVOYE : le bouton "Envoyer contrat" doit effectivement le rendre
      // signable par l'ambassadeur (status === "ENVOYE" est la condition
      // de signature côté portail).
      status: "ENVOYE",
      notes: "Contrat d'apporteur d'affaire envoyé manuellement par l'admin.",
    },
  });

  // Notify the ambassador
  await prisma.notification.create({
    data: {
      userId: ambassador.userId,
      title: "Contrat à signer ✍️",
      message: "Votre contrat d'apporteur d'affaire est prêt. Signez-le depuis votre espace.",
      type: "WARNING",
      link: "/portail/mes-contrats",
    },
  });

  // Send email notification
  try {
    await sendNotificationEmail(
      ambassador.user.email,
      ambassador.user.name || "Ambassadeur",
      "Contrat d'apporteur d'affaire à signer ✍️",
      `Votre contrat d'apporteur d'affaire (${contractNumber}) est prêt.\n\nConnectez-vous à votre espace pour le consulter et le signer électroniquement.\n\nCe contrat définit les conditions de votre commission de ${commissionValue || 5}% sur les transactions réalisées.`
    );
  } catch { /* email failure shouldn't block */ }

  return NextResponse.json({ success: true, contract });
}
