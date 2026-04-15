import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const sessionUser = session.user as { id?: string };
  if (!sessionUser.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const doc = await prisma.userDocument.findUnique({ where: { id } });
  if (!doc || doc.userId !== sessionUser.id) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  // Best-effort file removal (Blob ou filesystem selon env)
  await deleteFile(doc.url);

  await prisma.userDocument.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
