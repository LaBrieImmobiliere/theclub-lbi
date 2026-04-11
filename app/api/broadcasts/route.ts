import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const broadcasts = await prisma.broadcast.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
    include: {
      author: { select: { name: true, role: true } },
    },
  });

  return NextResponse.json(broadcasts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { id?: string; role?: string };
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, target, sendEmail } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 });
  }

  // Create the broadcast
  const broadcast = await prisma.broadcast.create({
    data: {
      authorId: user.id!,
      title,
      content,
      target: target || "ALL",
      emailSent: !!sendEmail,
    },
  });

  // Determine recipients based on target
  let whereClause: Record<string, unknown> = {};
  if (target === "AMBASSADORS") {
    whereClause = { role: "AMBASSADOR" };
  } else if (target === "NEGOTIATORS") {
    whereClause = { role: "NEGOTIATOR" };
  } else {
    // ALL: ambassadors + negotiators (not admin)
    whereClause = { role: { in: ["AMBASSADOR", "NEGOTIATOR"] } };
  }

  const recipients = await prisma.user.findMany({
    where: whereClause,
    select: { id: true, name: true, email: true },
  });

  // Create in-app notifications for all recipients
  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      userId: r.id,
      title: `📢 ${title}`,
      message: content.length > 200 ? content.substring(0, 200) + "..." : content,
      type: "INFO",
    })),
  });

  // Send emails if requested
  if (sendEmail) {
    const emailPromises = recipients.map((r) =>
      sendNotificationEmail(
        r.email,
        r.name || "Membre",
        title,
        content
      ).catch(() => {
        /* Individual email failures shouldn't block */
      })
    );
    // Send in batches of 5 to avoid overwhelming the SMTP server
    for (let i = 0; i < emailPromises.length; i += 5) {
      await Promise.all(emailPromises.slice(i, i + 5));
    }
  }

  return NextResponse.json(
    {
      ...broadcast,
      recipientCount: recipients.length,
    },
    { status: 201 }
  );
}
