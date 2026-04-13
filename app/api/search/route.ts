import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = session.user as { role?: string; id?: string };
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ leads: [], contracts: [], ambassadors: [] });

  const search = `%${q}%`;

  // Search leads
  const leadsWhere: any = {
    OR: [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ],
  };
  if (user.role === "NEGOTIATOR") {
    const neg = await prisma.negotiator.findUnique({ where: { userId: user.id } });
    if (neg) leadsWhere.negotiatorId = neg.id;
  }
  const leads = await prisma.lead.findMany({
    where: leadsWhere,
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, firstName: true, lastName: true, status: true, phone: true, createdAt: true },
  });

  // Search contracts
  const contracts = user.role === "ADMIN" ? await prisma.contract.findMany({
    where: {
      OR: [
        { number: { contains: q, mode: "insensitive" } },
        { propertyAddress: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, number: true, status: true, createdAt: true },
  }) : [];

  // Search ambassadors
  const ambassadors = user.role === "ADMIN" ? await prisma.user.findMany({
    where: {
      role: "AMBASSADOR",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    },
    take: 5,
    select: { id: true, name: true, email: true, phone: true },
  }) : [];

  return NextResponse.json({ leads, contracts, ambassadors });
}
