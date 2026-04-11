import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ackId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { ackId } = await params;
  const body = await req.json();
  const user = session.user as { role?: string; id?: string };

  const ack = await prisma.honoraryAcknowledgment.findUnique({
    where: { id: ackId },
    include: { contract: true },
  });
  if (!ack) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (user.role !== "ADMIN") {
    const ambassador = await prisma.ambassador.findUnique({ where: { userId: user.id } });
    if (!ambassador || ack.contract.ambassadorId !== ambassador.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    // Ambassador can only add their signature
    const updated = await prisma.honoraryAcknowledgment.update({
      where: { id: ackId },
      data: { ambassadorSignature: body.ambassadorSignature },
    });
    return NextResponse.json(updated);
  }

  // Admin full update
  const updated = await prisma.honoraryAcknowledgment.update({
    where: { id: ackId },
    data: {
      status: body.status,
      amount: body.amount ? parseFloat(body.amount) : undefined,
      description: body.description,
      paymentRef: body.paymentRef,
      paidAt: body.status === "PAYEE" ? new Date() : ack.paidAt,
    },
  });

  return NextResponse.json(updated);
}
