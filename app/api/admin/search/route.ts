import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ ambassadors: [], leads: [], contracts: [] });

  const search = `%${q}%`;

  const [ambassadors, leads, contracts] = await Promise.all([
    prisma.ambassador.findMany({
      where: {
        OR: [
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { user: { select: { name: true, email: true } } },
      take: 5,
    }),
    prisma.lead.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { ambassador: { include: { user: { select: { name: true } } } } },
      take: 5,
    }),
    prisma.contract.findMany({
      where: {
        OR: [
          { number: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { ambassador: { include: { user: { select: { name: true } } } } },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    ambassadors: ambassadors.map((a) => ({
      id: a.id, name: a.user.name, email: a.user.email, code: a.code,
    })),
    leads: leads.map((l) => ({
      id: l.id, name: `${l.firstName} ${l.lastName}`, status: l.status,
      ambassador: l.ambassador.user.name,
    })),
    contracts: contracts.map((c) => ({
      id: c.id, number: c.number, status: c.status,
      ambassador: c.ambassador.user.name,
    })),
  });
}
