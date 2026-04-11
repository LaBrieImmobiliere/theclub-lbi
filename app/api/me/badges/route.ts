import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const user = session.user as { id?: string };
  const badges = await prisma.badge.findMany({
    where: { userId: user.id },
    orderBy: { earnedAt: "desc" },
  });

  return NextResponse.json(badges);
}
