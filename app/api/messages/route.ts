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

  // Add linked contacts who have no existing conversation
  // Ambassador → show their negotiator
  // Negotiator → show their ambassadors
  if (user.role === "AMBASSADOR") {
    const ambassador = await prisma.ambassador.findUnique({
      where: { userId },
      include: {
        negotiator: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });
    if (ambassador?.negotiator && !conversationMap.has(ambassador.negotiator.userId)) {
      conversationMap.set(ambassador.negotiator.userId, {
        user: ambassador.negotiator.user,
        lastMessage: null,
        unreadCount: 0,
      });
    }
  } else if (user.role === "NEGOTIATOR") {
    const negotiator = await prisma.negotiator.findUnique({
      where: { userId },
      include: {
        ambassadors: {
          where: { status: "ACTIVE" },
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });
    if (negotiator?.ambassadors) {
      for (const amb of negotiator.ambassadors) {
        if (!conversationMap.has(amb.userId)) {
          conversationMap.set(amb.userId, {
            user: amb.user,
            lastMessage: null,
            unreadCount: 0,
          });
        }
      }
    }
  }

  // Also add admins for everyone if no admin conversation exists
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", id: { not: userId } },
    select: { id: true, name: true, email: true, role: true },
    take: 3,
  });
  for (const admin of admins) {
    if (!conversationMap.has(admin.id)) {
      conversationMap.set(admin.id, {
        user: admin,
        lastMessage: null,
        unreadCount: 0,
      });
    }
  }

  const conversations = Array.from(conversationMap.values()).sort((a, b) => {
    // Conversations with messages first, sorted by date
    if (a.lastMessage && b.lastMessage) {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    }
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    // Contacts without messages: sort by name
    return (a.user.name ?? a.user.email).localeCompare(b.user.name ?? b.user.email);
  });

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
