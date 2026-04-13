import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Fetch user names for logs that have userId
  const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))] as string[];
  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : [];

  const userMap = new Map(users.map(u => [u.id, u]));

  return NextResponse.json(
    logs.map(log => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) || null : null,
    }))
  );
}
