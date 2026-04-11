import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAcknowledgmentNumber } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { amount, description } = body;

  if (!amount) {
    return NextResponse.json({ error: "Montant requis" }, { status: 400 });
  }

  const ack = await prisma.honoraryAcknowledgment.create({
    data: {
      contractId: id,
      number: generateAcknowledgmentNumber(),
      amount: parseFloat(amount),
      description,
    },
  });

  return NextResponse.json(ack, { status: 201 });
}
