import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 attempts per 15 minutes
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = rateLimit(`new-password:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
    }

    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Mot de passe trop court (8 caractères min.)" }, { status: 400 });

    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: "Lien expiré. Recommencez la procédure." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { email: record.identifier }, data: { password: hashed } });
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
