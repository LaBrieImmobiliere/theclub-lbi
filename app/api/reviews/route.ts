import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — Public: approved reviews for landing page
export async function GET() {
  const reviews = await prisma.review.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { name: true, role: true } } },
  });

  return NextResponse.json(reviews);
}

// POST — Authenticated: submit a review
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { id?: string };
  const body = await req.json();
  const { rating, comment } = body;

  if (!rating || rating < 1 || rating > 5 || !comment?.trim()) {
    return NextResponse.json({ error: "Note (1-5) et commentaire requis" }, { status: 400 });
  }

  // Check if user already left a review
  const existing = await prisma.review.findFirst({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "Vous avez déjà laissé un avis" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: { userId: user.id!, rating, comment: comment.trim() },
  });

  return NextResponse.json(review, { status: 201 });
}
