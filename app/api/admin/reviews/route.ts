import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, role: true } } },
  });

  return NextResponse.json(reviews);
}

// Approve a review
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id, approved } = await req.json();
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const review = await prisma.review.update({
    where: { id },
    data: { approved },
  });

  return NextResponse.json(review);
}

// Delete a review
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  await prisma.review.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
