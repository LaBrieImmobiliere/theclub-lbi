import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const ambassadors = await prisma.ambassador.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      _count: { select: { leads: true, contracts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ambassadors);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { email, phone, notes } = body;
  const firstName: string | undefined = body.firstName;
  const lastName: string | undefined = body.lastName;
  // Compute name from firstName + lastName if provided, otherwise fall back to body.name
  const name: string | undefined = firstName && lastName
    ? firstName + " " + lastName
    : body.name;

  if (!name || !email) {
    return NextResponse.json({ error: "Nom et email requis" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });
  }

  // Generate cryptographically secure temporary password
  const tempPassword = randomBytes(6).toString("base64url").slice(0, 10);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  const code = generateCode("AMB");

  const user = await prisma.user.create({
    data: {
      name,
      firstName: firstName || null,
      lastName: lastName || null,
      email,
      phone,
      password: hashedPassword,
      role: "AMBASSADOR",
      ambassador: {
        create: { code, notes },
      },
    },
    include: { ambassador: true },
  });

  // Send welcome email
  await sendWelcomeEmail(email, name, tempPassword, "AMBASSADOR");

  return NextResponse.json({ ...user, tempPassword }, { status: 201 });
}
