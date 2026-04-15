import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reachableUserIds } from "@/lib/messaging-access";

// GET — Search users for new conversation
// Le résultat est filtré selon les règles de messagerie :
//   - ADMIN      : peut chercher tout le monde
//   - NEGOTIATOR : ses ambassadeurs actifs + les admins
//   - AMBASSADOR : son négociateur + les admins
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const user = session.user as { id?: string; role?: string };
  if (!user.id || !user.role) return NextResponse.json([], { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const allowedIds = await reachableUserIds(user.id, user.role);

  // Non-admin sans contact autorisé → liste vide
  if (allowedIds !== null && allowedIds.length === 0) {
    return NextResponse.json([]);
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: user.id, ...(allowedIds !== null ? { in: allowedIds } : {}) },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, role: true },
    take: 10,
  });

  return NextResponse.json(users);
}
