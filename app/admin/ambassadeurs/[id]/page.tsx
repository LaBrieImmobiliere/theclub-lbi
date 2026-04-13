import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AmbassadeurDetailClient } from "./detail-client";

export const dynamic = "force-dynamic";

export default async function AmbassadeurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ambassador = await prisma.ambassador.findUnique({
    where: { id },
    include: {
      user: true,
      agency: true,
      negotiator: { include: { user: { select: { name: true } } } },
      leads: { orderBy: { createdAt: "desc" } },
      contracts: {
        include: { honoraryAcknowledgments: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ambassador) notFound();

  const totalCommissions = ambassador.contracts.reduce(
    (sum, c) => sum + (c.commissionAmount || 0),
    0
  );
  const paidCommissions = ambassador.contracts
    .filter((c) => c.status === "PAYE")
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

  // Serialize for client component
  const data = {
    id: ambassador.id,
    code: ambassador.code,
    status: ambassador.status,
    notes: ambassador.notes ?? "",
    legalStatus: ambassador.legalStatus ?? "PARTICULIER",
    companyName: ambassador.companyName ?? "",
    companyLegalForm: ambassador.companyLegalForm ?? "",
    companySiret: ambassador.companySiret ?? "",
    companyTva: ambassador.companyTva ?? "",
    companyRcs: ambassador.companyRcs ?? "",
    companyCapital: ambassador.companyCapital ?? "",
    companyAddress: ambassador.companyAddress ?? "",
    associationName: ambassador.associationName ?? "",
    associationRna: ambassador.associationRna ?? "",
    associationObject: ambassador.associationObject ?? "",
    user: {
      name: ambassador.user.name ?? "",
      email: ambassador.user.email,
      phone: ambassador.user.phone ?? "",
    },
    agency: ambassador.agency?.name ?? null,
    negotiator: ambassador.negotiator?.user?.name ?? null,
    totalCommissions,
    paidCommissions,
    leadsCount: ambassador.leads.length,
    contractsCount: ambassador.contracts.length,
    leads: ambassador.leads.map((l) => ({
      id: l.id,
      firstName: l.firstName,
      lastName: l.lastName,
      type: l.type,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
    })),
    contracts: ambassador.contracts.map((c) => ({
      id: c.id,
      number: c.number,
      commissionAmount: c.commissionAmount,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  return <AmbassadeurDetailClient data={data} />;
}
