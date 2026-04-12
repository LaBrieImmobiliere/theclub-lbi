import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNegotiatorWelcomeEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

function generateNegCode(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1][0].toUpperCase();
    return `NEG-${firstName}${lastInitial}`;
  }
  return `NEG-${parts[0]}`;
}

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const negotiators = await prisma.negotiator.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
      },
      agency: true,
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(negotiators);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, phone, password, agencyId } = body;

  if (!name || !email || !password || !agencyId) {
    return NextResponse.json(
      { error: "Nom, email, mot de passe et agence requis" },
      { status: 400 }
    );
  }

  // Verify agency exists
  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) {
    return NextResponse.json({ error: "Agence introuvable" }, { status: 404 });
  }

  // Check for existing user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate unique code (NEG-PrénomP)
  let code = generateNegCode(name);
  let codeExists = await prisma.negotiator.findUnique({ where: { code } });
  let suffix = 2;
  while (codeExists) {
    code = `${generateNegCode(name)}${suffix}`;
    codeExists = await prisma.negotiator.findUnique({ where: { code } });
    suffix++;
  }

  const user = await prisma.user.create({
    data: {
      name: body.firstName && body.lastName ? `${body.firstName} ${body.lastName}` : name,
      firstName: body.firstName || null,
      lastName: body.lastName || null,
      email,
      phone,
      password: hashedPassword,
      role: "NEGOTIATOR",
      negotiator: {
        create: {
          code,
          agencyId,
        },
      },
    },
    include: {
      negotiator: {
        include: { agency: true },
      },
    },
  });

  // Send negotiator welcome email with agency info and QR code
  await sendNegotiatorWelcomeEmail(email, name, password, code, {
    name: agency.name,
    address: agency.address,
    city: agency.city || "",
    phone: agency.phone || undefined,
    email: agency.email || undefined,
  });

  return NextResponse.json(user, { status: 201 });
}
