import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get all active ambassadors
  const ambassadors = await prisma.ambassador.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      leads: { select: { id: true, status: true, createdAt: true } },
      contracts: { select: { id: true, commissionAmount: true, status: true, createdAt: true } },
    },
  });

  // Get total ambassador count for ranking
  const allRanked = ambassadors
    .map((a) => ({
      id: a.id,
      userId: a.user.id,
      totalCommissions: a.contracts.reduce((s, c) => s + (c.commissionAmount || 0), 0),
    }))
    .sort((a, b) => b.totalCommissions - a.totalCommissions);

  let sent = 0;

  for (const amb of ambassadors) {
    const weekLeads = amb.leads.filter((l) => new Date(l.createdAt) >= oneWeekAgo).length;
    const weekContracts = amb.contracts.filter((c) => new Date(c.createdAt) >= oneWeekAgo).length;
    const totalLeads = amb.leads.length;
    const totalContracts = amb.contracts.length;
    const totalCommissions = amb.contracts.reduce((s, c) => s + (c.commissionAmount || 0), 0);
    const rank = allRanked.findIndex((r) => r.id === amb.id) + 1;

    const message = `Voici votre récap de la semaine :\n\n` +
      `📊 Cette semaine : ${weekLeads} nouvelle${weekLeads !== 1 ? "s" : ""} recommandation${weekLeads !== 1 ? "s" : ""}` +
      (weekContracts > 0 ? `, ${weekContracts} contrat${weekContracts !== 1 ? "s" : ""}` : "") + `\n\n` +
      `📈 Total : ${totalLeads} recommandation${totalLeads !== 1 ? "s" : ""}, ${totalContracts} contrat${totalContracts !== 1 ? "s" : ""}\n` +
      `💰 Commissions cumulées : ${totalCommissions.toLocaleString("fr-FR")} €\n` +
      `🏆 Classement : ${rank}${rank === 1 ? "er" : "ème"} sur ${allRanked.length} ambassadeur${allRanked.length !== 1 ? "s" : ""}\n\n` +
      `Connectez-vous pour voir vos détails et continuer à recommander !`;

    try {
      await sendNotificationEmail(
        amb.user.email,
        amb.user.name || "Ambassadeur",
        "Votre récap hebdomadaire — The Club LBI",
        message
      );
      sent++;
    } catch {
      // Continue with next ambassador
    }
  }

  return NextResponse.json({ success: true, sent, total: ambassadors.length });
}
