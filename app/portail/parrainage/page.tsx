import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ParrainageLinkCard } from "./parrainage-link-card";
import { Users, TrendingUp, CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParrainagePage() {
  const session = await auth();
  if (!session) redirect("/auth/connexion");

  const user = session.user as { id?: string; role?: string };
  // Négociateurs n'ont pas accès au parrainage ambassadeur
  if (user.role === "NEGOTIATOR") redirect("/portail/tableau-de-bord");

  // Support both ambassadors and negotiators
  let code = "";
  let leads: { id: string; firstName: string; lastName: string; status: string; createdAt: Date; contract: { status: string; commissionAmount: number | null } | null }[] = [];

  if (user.role === "NEGOTIATOR") {
    const negotiator = await prisma.negotiator.findUnique({
      where: { userId: user.id },
      include: {
        leads: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, firstName: true, lastName: true, status: true, createdAt: true,
            contract: { select: { status: true, commissionAmount: true } },
          },
        },
      },
    });
    if (!negotiator) redirect("/auth/connexion");
    code = negotiator.code;
    leads = negotiator.leads;
  } else {
    const ambassador = await prisma.ambassador.findUnique({
      where: { userId: user.id },
      include: {
        leads: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, firstName: true, lastName: true, status: true, createdAt: true,
            contract: { select: { status: true, commissionAmount: true } },
          },
        },
      },
    });
    if (!ambassador) redirect("/auth/connexion");
    code = ambassador.code;
    leads = ambassador.leads;
  }

  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => ["SIGNE", "PAYE"].includes(l.contract?.status ?? "")).length;
  const pendingLeads = leads.filter(l => ["NOUVEAU", "CONTACTE", "EN_COURS"].includes(l.status)).length;
  const totalCommissions = leads.reduce((sum, l) => sum + (l.contract?.commissionAmount ?? 0), 0);

  const roleLabel = user.role === "NEGOTIATOR" ? "négociateur" : "ambassadeur";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Mon lien de parrainage</h1>
        <p className="text-gray-500 mt-1">Partagez votre lien unique et suivez vos recommandations</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Recommandations", value: totalLeads, bg: "bg-brand-cream", color: "text-brand-gold" },
          { icon: Clock, label: "En cours", value: pendingLeads, bg: "bg-amber-50", color: "text-amber-500" },
          { icon: CheckCircle2, label: "Convertis", value: convertedLeads, bg: "bg-green-50", color: "text-green-600" },
          { icon: TrendingUp, label: "Commissions", value: totalCommissions > 0 ? `${(totalCommissions / 1000).toFixed(1)}k\u20AC` : "\u2014", bg: "bg-brand-cream", color: "text-brand-gold" },
        ].map(({ icon: Icon, label, value, bg, color }) => (
          <Card key={label}>
            <CardContent className="py-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ParrainageLinkCard code={code} />

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Comment ça marche ?</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Partagez votre lien", desc: `En tant que ${roleLabel}, envoyez votre lien unique à vos contacts qui souhaitent acheter, vendre ou investir.`, color: "bg-brand-deep" },
              { step: "2", title: "Votre contact est suivi", desc: "Dès que votre contact soumet sa demande, elle apparaît dans vos recommandations et notre équipe le contacte.", color: "bg-brand-gold" },
              { step: "3", title: "Recevez votre commission", desc: "Lorsque la transaction aboutit, vous recevez votre commission conformément à votre contrat.", color: "bg-green-600" },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="flex gap-4">
                <div className={`w-8 h-8 ${color} text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5`}>
                  {step}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {leads.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Dernières recommandations</h2>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Prospect</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.slice(0, 10).map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-gray-900">{lead.firstName} {lead.lastName}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 font-medium ${
                        lead.contract?.status === "PAYE" ? "bg-green-100 text-green-700" :
                        lead.contract?.status === "SIGNE" ? "bg-blue-100 text-blue-700" :
                        lead.status === "PERDU" ? "bg-red-100 text-red-700" :
                        "bg-brand-gold-light text-brand-deep"
                      }`}>
                        {lead.contract?.status === "PAYE" ? "Payé" :
                         lead.contract?.status === "SIGNE" ? "Signé" :
                         lead.status === "NOUVEAU" ? "Nouveau" :
                         lead.status === "CONTACTE" ? "Contacté" :
                         lead.status === "EN_COURS" ? "En cours" :
                         lead.status === "PERDU" ? "Perdu" : lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
