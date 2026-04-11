import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateContractNumber } from "@/lib/utils";
import { createContractSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { role?: string; id?: string };
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  if (user.role === "ADMIN") {
    const contracts = await prisma.contract.findMany({
      where: status ? { status } : undefined,
      include: {
        ambassador: { include: { user: { select: { name: true, email: true } } } },
        lead: true,
        honoraryAcknowledgments: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(contracts);
  }

  const ambassador = await prisma.ambassador.findUnique({ where: { userId: user.id } });
  if (!ambassador) return NextResponse.json([]);

  const contracts = await prisma.contract.findMany({
    where: {
      ambassadorId: ambassador.id,
      ...(status ? { status } : {}),
    },
    include: {
      lead: true,
      honoraryAcknowledgments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contracts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = session.user as { id?: string };
  const rl = rateLimit(`contrats:${user.id}`, 10, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Trop de requ\u00eates" }, { status: 429 });

  const body = await req.json();
  const parsed = createContractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Donn\u00e9es invalides" }, { status: 400 });
  }
  const {
    ambassadorId,
    commissionType,
    commissionValue,
    propertyAddress,
    propertyPrice,
    honoraires,
    notes,
  } = parsed.data;
  const leadId = parsed.data.leadId;

  let commissionAmount: number | null = null;
  if (commissionType === "PERCENTAGE" && honoraires) {
    commissionAmount = (honoraires * commissionValue) / 100;
  } else if (commissionType === "FIXED") {
    commissionAmount = commissionValue;
  }

  const contract = await prisma.contract.create({
    data: {
      number: generateContractNumber(),
      ambassadorId,
      leadId: leadId || null,
      commissionType,
      commissionValue,
      propertyAddress,
      propertyPrice,
      honoraires,
      commissionAmount,
      notes,
    },
    include: {
      ambassador: { include: { user: true } },
      lead: true,
    },
  });

  return NextResponse.json(contract, { status: 201 });
}
