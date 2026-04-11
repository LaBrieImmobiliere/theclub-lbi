import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContactShareCard } from "./contact-share-card";
import { ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ParrainagePage() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");

  const user = session.user as { id?: string; role?: string };
  if (user.role === "NEGOTIATOR") redirect("/negociateur/tableau-de-bord");

  const ambassador = await prisma.ambassador.findUnique({
    where: { userId: user.id },
    include: {
      negotiator: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
          agency: true,
        },
      },
      agency: true,
      leads: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          contract: { select: { status: true } },
        },
      },
    },
  });

  if (!ambassador) redirect("/auth/connexion");

  const allLeads = ambassador.leads;
  const totalLeads = allLeads.length;
  const pendingLeads = allLeads.filter(l =>
    ["NOUVEAU", "CONTACTE", "EN_COURS"].includes(l.status)
  ).length;
  const convertedLeads = allLeads.filter(l =>
    ["SIGNE", "PAYE"].includes(l.contract?.status ?? "")
  ).length;

  // Negotiator or agency info (whichever is available)
  const negotiator = ambassador.negotiator;
  const agency = ambassador.agency ?? negotiator?.agency ?? null;

  const contactInfo = {
    negotiatorName: negotiator?.user?.name ?? null,
    negotiatorEmail: negotiator?.user?.email ?? null,
    negotiatorPhone: negotiator?.user?.phone ?? null,
    agencyName: agency?.name ?? "La Brie Immobilière",
    agencyAddress: agency ? `${agency.address}, ${agency.postalCode} ${agency.city}` : "41, av. du Maréchal de Lattre de Tassigny, 94440 Villecresnes",
    agencyPhone: agency?.phone ?? null,
    agencyEmail: agency?.email ?? null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Partager les coordonnées
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Partagez les coordonnées de votre conseiller avec vos proches qui ont un projet immobilier
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{totalLeads}</p>
              <p className="text-xs text-gray-500">Recommandations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{pendingLeads}</p>
              <p className="text-xs text-gray-500">En cours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{convertedLeads}</p>
              <p className="text-xs text-gray-500">Convertis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ContactShareCard contact={contactInfo} />
    </div>
  );
}
