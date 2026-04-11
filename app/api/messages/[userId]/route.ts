import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json([], { status: 401 });

  const user = session.user as { id?: string };
  const currentUserId = user.id!;
  const { userId: partnerId } = await params;

  // Fetch all messages between the two users
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUserId, receiverId: partnerId },
        { senderId: partnerId, receiverId: currentUserId },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      receiver: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  // Mark unread messages from the partner as read
  await prisma.message.updateMany({
    where: {
      senderId: partnerId,
      receiverId: currentUserId,
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json(messages);
}
