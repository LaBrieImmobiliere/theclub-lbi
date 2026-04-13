import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NegociateurParrainagePage } from "./parrainage-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");

  const user = session.user as { id?: string; role?: string };
  if (user.role !== "NEGOTIATOR") redirect("/portail/tableau-de-bord");

  const negotiator = await prisma.negotiator.findUnique({
    where: { userId: user.id },
    include: {
      _count: { select: { ambassadors: true } },
      ambassadors: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { name: true, email: true, createdAt: true } },
          _count: { select: { leads: true } },
        },
      },
    },
  });

  if (!negotiator) redirect("/auth/connexion");

  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";
  const inscriptionUrl = `${appUrl}/rejoindre?code=${negotiator.code}`;

  return (
    <NegociateurParrainagePage
      code={negotiator.code}
      inscriptionUrl={inscriptionUrl}
      ambassadorCount={negotiator._count.ambassadors}
      recentAmbassadors={negotiator.ambassadors.map((a) => ({
        name: a.user.name,
        email: a.user.email,
        leadsCount: a._count.leads,
        createdAt: a.user.createdAt.toISOString(),
      }))}
    />
  );
}
