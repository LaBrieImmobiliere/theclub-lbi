import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API — list agencies with their negotiators (for registration)
export async function GET() {
  const agencies = await prisma.agency.findMany({
    orderBy: { name: "asc" },
    include: {
      negotiators: {
        where: { status: "ACTIVE" },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json(
    agencies.map((a) => ({
      id: a.id,
      name: a.name,
      city: a.city,
      negotiators: a.negotiators.map((n) => ({
        id: n.id,
        name: n.user.name,
      })),
    }))
  );
}
