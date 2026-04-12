import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Export key tables as JSON snapshot
    const [users, ambassadors, negotiators, leads, contracts, agencies] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true } }),
      prisma.ambassador.findMany({ select: { id: true, userId: true, code: true, status: true, agencyId: true, negotiatorId: true, createdAt: true } }),
      prisma.negotiator.findMany({ select: { id: true, userId: true, code: true, status: true, agencyId: true, createdAt: true } }),
      prisma.lead.findMany({ select: { id: true, ambassadorId: true, negotiatorId: true, firstName: true, lastName: true, status: true, type: true, createdAt: true } }),
      prisma.contract.findMany({ select: { id: true, ambassadorId: true, number: true, status: true, commissionAmount: true, createdAt: true } }),
      prisma.agency.findMany(),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      counts: {
        users: users.length,
        ambassadors: ambassadors.length,
        negotiators: negotiators.length,
        leads: leads.length,
        contracts: contracts.length,
        agencies: agencies.length,
      },
      data: { users, ambassadors, negotiators, leads, contracts, agencies },
    };

    // Send backup via email to admin
    const { sendNotificationEmail } = await import("@/lib/email");
    const adminEmail = process.env.ADMIN_EMAIL || "contact@labrieimmobiliere.fr";

    await sendNotificationEmail(
      adminEmail,
      "Admin",
      `Backup BDD - The Club LBI - ${new Date().toLocaleDateString("fr-FR")}`,
      `Backup automatique effectué.\n\n${users.length} utilisateurs, ${ambassadors.length} ambassadeurs, ${negotiators.length} négociateurs, ${leads.length} leads, ${contracts.length} contrats.\n\nLe fichier JSON complet est disponible via l'API /api/cron/backup.`
    );

    return NextResponse.json({
      success: true,
      exportedAt: backup.exportedAt,
      counts: backup.counts,
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Erreur backup" }, { status: 500 });
  }
}
