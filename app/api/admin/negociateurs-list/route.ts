import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const negotiators = await prisma.negotiator.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const result = negotiators.map((n) => ({
    id: n.id,
    name: n.user.name || n.code,
  }));

  return NextResponse.json(result);
}
