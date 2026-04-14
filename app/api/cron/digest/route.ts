import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get all active ambassadors
  const ambassadors = await prisma.ambassador.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { name: true, email: true, id: true } },
      leads: {
        where: { createdAt: { gte: oneWeekAgo } },
        select: { status: true, firstName: true, lastName: true, createdAt: true },
      },
      contracts: {
        where: { paidAt: { gte: oneWeekAgo }, status: "PAYE" },
        select: { commissionAmount: true, number: true },
      },
    },
  });

  let sent = 0;
  for (const amb of ambassadors) {
    const newLeads = amb.leads.length;
    const paidCommissions = amb.contracts.reduce((s, c) => s + (c.commissionAmount || 0), 0);

    // Only send digest if there's activity
    if (newLeads === 0 && paidCommissions === 0) continue;

    const fmt = (n: number) =>
      new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

    let message = `Voici votre récapitulatif de la semaine :\n\n`;
    if (newLeads > 0) {
      message += `📝 ${newLeads} nouvelle${newLeads > 1 ? "s" : ""} recommandation${newLeads > 1 ? "s" : ""}\n`;
    }
    if (paidCommissions > 0) {
      message += `💰 ${fmt(paidCommissions)} de commissions versées cette semaine !\n`;
    }
    message += `\nContinuez comme ça 🚀`;

    try {
      await sendNotificationEmail(
        amb.user.email,
        amb.user.name || "Ambassadeur",
        "📊 Votre récap The Club de la semaine",
        message
      );
      sent++;
    } catch (err) {
      console.error(`Failed to send digest to ${amb.user.email}:`, err);
    }
  }

  return NextResponse.json({ sent, total: ambassadors.length });
}
