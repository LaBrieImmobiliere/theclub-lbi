import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const agency = await prisma.agency.findUnique({
    where: { id },
    include: {
      negotiators: true,
      _count: { select: { ambassadors: true, negotiators: true, leads: true } },
    },
  });

  if (!agency) {
    return NextResponse.json({ error: "Agence introuvable" }, { status: 404 });
  }

  const url = new URL(req.url);
  const reassignTo = url.searchParams.get("reassignTo");

  if (reassignTo) {
    // Verify target agency exists
    const target = await prisma.agency.findUnique({ where: { id: reassignTo } });
    if (!target) {
      return NextResponse.json({ error: "Agence de destination introuvable" }, { status: 400 });
    }

    // Reassign negotiators to the new agency
    await prisma.negotiator.updateMany({
      where: { agencyId: id },
      data: { agencyId: reassignTo },
    });

    // Reassign ambassadors to the new agency
    await prisma.ambassador.updateMany({
      where: { agencyId: id },
      data: { agencyId: reassignTo },
    });

    // Reassign leads to the new agency
    await prisma.lead.updateMany({
      where: { agencyId: id },
      data: { agencyId: reassignTo },
    });
  } else {
    // Detach ambassadors and leads
    await prisma.ambassador.updateMany({
      where: { agencyId: id },
      data: { agencyId: null },
    });
    await prisma.lead.updateMany({
      where: { agencyId: id },
      data: { agencyId: null },
    });

    // Delete negotiators (and their users via cascade)
    for (const neg of agency.negotiators) {
      await prisma.user.delete({ where: { id: neg.userId } });
    }
  }

  // Delete the agency
  await prisma.agency.delete({ where: { id } });

  return NextResponse.json({ success: true, reassignedTo: reassignTo || null });
}
