import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { canMessage } from "@/lib/messaging-access";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json([], { status: 401 });

  const user = session.user as { id?: string; role?: string };
  const userId = user.id!;

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      receiver: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  const conversationMap = new Map<
    string,
    {
      user: { id: string; name: string | null; email: string; role: string };
      lastMessage: { id: string; content: string; createdAt: Date; senderId: string } | null;
      unreadCount: number;
    }
  >();

  for (const msg of messages) {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;

    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        user: partner,
        lastMessage: { id: msg.id, content: msg.content, createdAt: msg.createdAt, senderId: msg.senderId },
        unreadCount: 0,
      });
    }

    if (msg.receiverId === userId && !msg.read && msg.senderId === partnerId) {
      const conv = conversationMap.get(partnerId)!;
      conv.unreadCount += 1;
    }
  }

  // Add linked contacts without existing conversation
  if (user.role === "AMBASSADOR") {
    const ambassador = await prisma.ambassador.findUnique({
      where: { userId },
      include: { negotiator: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
    });
    if (ambassador?.negotiator && !conversationMap.has(ambassador.negotiator.userId)) {
      conversationMap.set(ambassador.negotiator.userId, { user: ambassador.negotiator.user, lastMessage: null, unreadCount: 0 });
    }
  } else if (user.role === "NEGOTIATOR") {
    const negotiator = await prisma.negotiator.findUnique({
      where: { userId },
      include: { ambassadors: { where: { status: "ACTIVE" }, include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
    });
    if (negotiator?.ambassadors) {
      for (const amb of negotiator.ambassadors) {
        if (!conversationMap.has(amb.userId)) {
          conversationMap.set(amb.userId, { user: amb.user, lastMessage: null, unreadCount: 0 });
        }
      }
    }
  }

  // Add admins for everyone
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", id: { not: userId } },
    select: { id: true, name: true, email: true, role: true },
    take: 3,
  });
  for (const admin of admins) {
    if (!conversationMap.has(admin.id)) {
      conversationMap.set(admin.id, { user: admin, lastMessage: null, unreadCount: 0 });
    }
  }

  const conversations = Array.from(conversationMap.values()).sort((a, b) => {
    if (a.lastMessage && b.lastMessage) return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    return (a.user.name ?? a.user.email).localeCompare(b.user.name ?? b.user.email);
  });

  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { id?: string; name?: string | null; role?: string };
  const userId = user.id!;

  const body = await req.json();
  const { receiverId, content } = body as { receiverId: string; content: string };

  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  // Contrôle d'accès : on ne peut envoyer qu'aux contacts autorisés selon le rôle
  const allowed = await canMessage(userId, user.role ?? "", receiverId);
  if (!allowed) {
    return NextResponse.json({ error: "Destinataire non autorisé" }, { status: 403 });
  }

  const trimmedContent = content.trim();

  // Dédup: si le même user envoie le même contenu au même destinataire
  // dans les 10 dernières secondes, on renvoie le message existant sans rien
  // refaire (pas de nouvelle notif, pas de nouveau push, pas de nouvel email).
  // Ça neutralise les doubles submissions (Enter tapé 2x, double-clic, replay
  // réseau, etc.) qui provoquaient les emails en double côté destinataire.
  const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
  const existing = await prisma.message.findFirst({
    where: {
      senderId: userId,
      receiverId,
      content: trimmedContent,
      createdAt: { gte: tenSecondsAgo },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const message = await prisma.message.create({
    data: { senderId: userId, receiverId, content: trimmedContent },
  });

  // Determine the right messagerie link based on receiver's role
  const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { name: true, email: true, role: true } });
  let messageLink = "/portail/messagerie";
  if (receiver?.role === "NEGOTIATOR") messageLink = "/negociateur/messagerie";
  else if (receiver?.role === "ADMIN") messageLink = "/admin/messagerie";

  // Create in-app notification with link
  await prisma.notification.create({
    data: {
      userId: receiverId,
      title: "Nouveau message",
      message: `${user.name || "Un utilisateur"} vous a envoyé un message`,
      type: "MESSAGE",
      link: messageLink,
    },
  });

  // Send push notification
  try {
    await sendPushToUser(
      receiverId,
      "Nouveau message",
      `${user.name || "Un utilisateur"} vous a envoyé un message`,
      messageLink
    );
  } catch { /* push failure should not block */ }

  // Send email notification
  if (receiver?.email) {
    try {
      await sendNotificationEmail(
        receiver.email,
        receiver.name || "Utilisateur",
        "Nouveau message - The Club LBI",
        `${user.name || "Un utilisateur"} vous a envoyé un message sur la plateforme The Club.\n\nConnectez-vous pour le lire et y répondre.`
      );
    } catch {
      // Email failure should not block the message
    }
  }

  return NextResponse.json(message, { status: 201 });
}
