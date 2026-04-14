import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const sessionUser = session.user as { id?: string };
  if (!sessionUser.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const documents = await prisma.userDocument.findMany({
    where: { userId: sessionUser.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}
