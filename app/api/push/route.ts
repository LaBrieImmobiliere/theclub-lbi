import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — Subscribe to push notifications
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { id?: string };
  const body = await req.json();
  const { endpoint, keys } = body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  // Upsert subscription
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: user.id!, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId: user.id!, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ success: true });
}

// DELETE — Unsubscribe
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { endpoint } = body as { endpoint: string };

  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  return NextResponse.json({ success: true });
}
