import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // Best-effort file removal
  try {
    if (doc.url.startsWith("/documents/")) {
      const filename = doc.url.replace("/documents/", "");
      const candidates = [
        path.resolve(process.cwd(), "public/documents", filename),
        path.resolve(process.cwd(), "app-lbi/public/documents", filename),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          fs.unlinkSync(p);
          break;
        }
      }
    }
  } catch {
    // ignore filesystem errors
  }

  await prisma.userDocument.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
