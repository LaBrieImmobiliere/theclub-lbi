import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("photo") as File;
  const userId = formData.get("userId") as string;

  if (!file || !userId) {
    return NextResponse.json({ error: "Photo et userId requis" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${userId}.${ext}`;

  // Find public/photos directory
  const candidates = [
    path.resolve(process.cwd(), "public/photos"),
    path.resolve(process.cwd(), "app-lbi/public/photos"),
  ];

  let photosDir = candidates[0];
  for (const p of candidates) {
    if (fs.existsSync(p)) { photosDir = p; break; }
  }

  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }

  const filePath = path.join(photosDir, filename);
  fs.writeFileSync(filePath, buffer);

  const imageUrl = `/photos/${filename}`;

  await prisma.user.update({
    where: { id: userId },
    data: { image: imageUrl },
  });

  return NextResponse.json({ success: true, imageUrl });
}
