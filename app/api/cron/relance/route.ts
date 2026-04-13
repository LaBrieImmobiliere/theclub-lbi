import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Find ambassadors with no leads in the last 30 days
  const inactiveAmbassadors = await prisma.ambassador.findMany({
    where: {
      status: "ACTIVE",
      leads: { none: { createdAt: { gte: thirtyDaysAgo } } },
    },
    include: { user: { select: { name: true, email: true, id: true } } },
  });

  let sent = 0;
  for (const amb of inactiveAmbassadors) {
    try {
      await sendNotificationEmail(
        amb.user.email,
        amb.user.name || "Ambassadeur",
        "Vous nous manquez ! \u{1F44B}",
        `Bonjour ${amb.user.name || ""},\n\nCela fait un moment que vous n'avez pas recommand\u00e9 de contact sur The Club.\n\nVous connaissez quelqu'un qui cherche \u00e0 acheter, vendre ou louer un bien immobilier ? Partagez ses coordonn\u00e9es et touchez 5% de commission sur les honoraires !\n\nVotre prochaine recommandation est peut-\u00eatre celle qui vous rapportera gros \u{1F4B0}`
      );

      await prisma.notification.create({
        data: {
          userId: amb.user.id,
          title: "Vous nous manquez ! \u{1F44B}",
          message:
            "Cela fait un moment que vous n'avez pas recommand\u00e9. Votre prochaine recommandation est peut-\u00eatre la bonne !",
          type: "INFO",
          link: "/portail/recommander",
        },
      });

      sent++;
    } catch (err) {
      console.error(`Failed to send reminder to ${amb.user.email}:`, err);
    }
  }

  return NextResponse.json({ sent, total: inactiveAmbassadors.length });
}
