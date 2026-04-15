import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";

const ALLOWED_TYPES = ["RIB", "ID", "JUSTIFICATIF"];
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const sessionUser = session.user as { id?: string };
  if (!sessionUser.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("document") as File | null;
  const type = (formData.get("type") as string | null) || "JUSTIFICATIF";
  const customName = (formData.get("name") as string | null)?.trim();

  if (!file) {
    return NextResponse.json({ error: "Document requis" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: "Type de document invalide" }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (PDF, JPG, PNG)" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = (file.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filename = `${sessionUser.id}-${type}-${Date.now()}.${ext}`;

  const url = await uploadFile("documents", filename, buffer, file.type);
  const displayName = customName || file.name;

  const doc = await prisma.userDocument.create({
    data: {
      userId: sessionUser.id,
      name: displayName,
      url,
      type,
    },
  });

  return NextResponse.json({ success: true, document: doc });
}
