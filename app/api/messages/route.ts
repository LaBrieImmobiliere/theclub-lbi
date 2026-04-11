import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json([], { status: 401 });

  const user = session.user as { id?: string; role?: string };
  const userId = user.id!;

  // Fetch all messages where current user is sender or receiver
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      receiver: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  // Group by conversation partner
  const conversationMap = new Map<
    string,
    {
      user: { id: string; name: string | null; email: string; role: string };
      lastMessage: { id: string; content: string; createdAt: Date; senderId: string };
      unreadCount: number;
    }
  >();

  for (const msg of messages) {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;

    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        user: partner,
        lastMessage: {
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt,
          senderId: msg.senderId,
        },
        unreadCount: 0,
      });
    }

    // Count unread messages sent TO current user by this partner
    if (msg.receiverId === userId && !msg.read && msg.senderId === partnerId) {
      const conv = conversationMap.get(partnerId)!;
      conv.unreadCount += 1;
    }
  }

  const conversations = Array.from(conversationMap.values()).sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() -
      new Date(a.lastMessage.createdAt).getTime()
  );

  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { id?: string; name?: string | null };
  const userId = user.id!;

  const body = await req.json();
  const { receiverId, content } = body as { receiverId: string; content: string };

  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: userId,
      receiverId,
      content: content.trim(),
    },
  });

  // Create a notification for the receiver
  await prisma.notification.create({
    data: {
      userId: receiverId,
      title: "Nouveau message",
      message: `${user.name || "Un utilisateur"} vous a envoyé un message`,
      type: "MESSAGE",
    },
  });

  return NextResponse.json(message, { status: 201 });
}
