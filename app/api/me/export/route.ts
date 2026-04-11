import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Export des données personnelles (droit à la portabilité RGPD)
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { id?: string; role?: string };
  if (!user.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Fetch all user data
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!dbUser) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportData: Record<string, any> = {
    informations_personnelles: dbUser,
  };

  // Ambassador-specific data
  if (user.role === "AMBASSADOR") {
    const ambassador = await prisma.ambassador.findUnique({
      where: { userId: user.id },
      include: {
        leads: {
          select: {
            id: true, firstName: true, lastName: true, type: true,
            status: true, createdAt: true,
          },
        },
        contracts: {
          select: {
            id: true, number: true, commissionAmount: true,
            status: true, createdAt: true,
          },
        },
      },
    });
    if (ambassador) {
      exportData.code_ambassadeur = ambassador.code;
      exportData.statut = ambassador.status;
      exportData.recommandations = ambassador.leads;
      exportData.contrats = ambassador.contracts;
    }
  }

  // Negotiator-specific data
  if (user.role === "NEGOTIATOR") {
    const negotiator = await prisma.negotiator.findUnique({
      where: { userId: user.id },
      include: {
        leads: {
          select: {
            id: true, firstName: true, lastName: true, type: true,
            status: true, createdAt: true,
          },
        },
      },
    });
    if (negotiator) {
      exportData.code_negociateur = negotiator.code;
      exportData.recommandations = negotiator.leads;
    }
  }

  // Messages
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    select: {
      id: true, content: true, createdAt: true,
      sender: { select: { name: true, email: true } },
      receiver: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  exportData.messages = messages;

  // Notifications
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, message: true, type: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  exportData.notifications = notifications;

  // Return as downloadable JSON
  const json = JSON.stringify(exportData, null, 2);
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mes-donnees-${dbUser.email}.json"`,
    },
  });
}
