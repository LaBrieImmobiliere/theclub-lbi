import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

// This route is called by Vercel Cron (configured in vercel.json)
// or can be triggered manually by an admin via POST /api/cron/relances
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return runRelances();
}

export async function POST(req: NextRequest) {
  // Admin-only manual trigger
  const authHeader = req.headers.get("authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron) {
    // Check session-based admin auth
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  return runRelances();
}

async function runRelances() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find leads stuck at NOUVEAU status for more than 7 days
  const staleLeads = await prisma.lead.findMany({
    where: {
      status: "NOUVEAU",
      createdAt: { lte: sevenDaysAgo },
    },
    include: {
      ambassador: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      negotiator: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (staleLeads.length === 0) {
    return NextResponse.json({ sent: 0, message: "Aucun lead en attente" });
  }

  let emailsSent = 0;
  const errors: string[] = [];

  for (const lead of staleLeads) {
    const leadName = `${lead.firstName} ${lead.lastName}`;
    const daysStale = Math.floor(
      (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Notify negotiator assigned to this lead (or all admins if no negotiator)
    const recipientsToNotify: Array<{ id: string; name: string | null; email: string }> = [];

    if (lead.negotiator?.user) {
      recipientsToNotify.push(lead.negotiator.user);
    } else {
      // Fall back to admins
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, name: true, email: true },
      });
      recipientsToNotify.push(...admins);
    }

    for (const recipient of recipientsToNotify) {
      try {
        await sendNotificationEmail(
          recipient.email,
          recipient.name || "Négociateur",
          `⚠️ Relance : ${leadName} attend depuis ${daysStale} jours`,
          `Le prospect ${leadName}, recommandé par ${lead.ambassador.user.name || "un ambassadeur"}, est au statut "Nouveau" depuis ${daysStale} jours.\n\nPensez à le contacter et à mettre à jour le statut dans l'application.`
        );

        // In-app notification
        await prisma.notification.create({
          data: {
            userId: recipient.id,
            title: `Relance : ${leadName}`,
            message: `Ce prospect est en attente depuis ${daysStale} jours. Pensez à le contacter.`,
            type: "WARNING",
          },
        });

        emailsSent++;
      } catch (err) {
        errors.push(`${recipient.email}: ${String(err)}`);
      }
    }
  }

  return NextResponse.json({
    sent: emailsSent,
    leadsProcessed: staleLeads.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
