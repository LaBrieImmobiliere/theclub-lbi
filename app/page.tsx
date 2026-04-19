import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Gift, Users, Shield, ArrowRight, CheckCircle2 } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (session) {
    const role = (session.user as { role?: string }).role;
    if (role === "ADMIN") redirect("/admin/dashboard");
    if (role === "NEGOTIATOR") redirect("/negociateur/tableau-de-bord");
    redirect("/portail/tableau-de-bord");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="La Brie Immobilière" width={120} height={40} className="h-10 w-auto" />
            <span className="text-xs font-semibold text-[#D1B280] tracking-widest uppercase hidden sm:block">The Club</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/connexion" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              Connexion
            </Link>
            <Link href="/rejoindre" className="bg-[#030A24] text-white px-5 py-2 text-sm font-semibold rounded-lg hover:bg-[#1a2744] transition-colors">
              Devenir ambassadeur
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-[#D1B280] text-sm font-semibold uppercase tracking-[0.3em] mb-4">Programme de parrainage immobilier</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#030A24] leading-tight mb-6" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Recommandez.<br />
            <span className="text-[#D1B280]">Gagnez.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Partagez un contact ayant un projet immobilier et percevez <strong className="text-[#030A24]">5% de commission</strong> sur les honoraires de chaque transaction aboutie.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rejoindre" className="inline-flex items-center justify-center gap-2 bg-[#D1B280] text-[#030A24] px-8 py-4 text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-[#b89a65] transition-colors">
              Rejoindre The Club <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/connexion" className="inline-flex items-center justify-center gap-2 border-2 border-[#030A24] text-[#030A24] px-8 py-4 text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-[#030A24] hover:text-white transition-colors">
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#030A24]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { value: "5%", label: "Commission sur honoraires" },
              { value: "100%", label: "Gratuit, sans engagement" },
              { value: "48h", label: "Prise de contact garantie" },
              { value: "1969", label: "Depuis plus de 55 ans" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl sm:text-4xl font-bold text-[#D1B280]">{stat.value}</p>
                <p className="text-sm text-white/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#D1B280] text-sm font-semibold uppercase tracking-[0.3em] mb-3">Comment ça marche</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#030A24]">Simple comme bonjour</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Recommandez", desc: "Transmettez les coordonnées d'un proche qui a un projet immobilier (achat, vente, location).", icon: Users },
              { step: "02", title: "On s'en occupe", desc: "Notre équipe contacte votre recommandation sous 48h et l'accompagne dans son projet.", icon: Shield },
              { step: "03", title: "Gagnez", desc: "Dès que la transaction aboutit, vous percevez 5% des honoraires. Simple et transparent.", icon: Gift },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="w-16 h-16 bg-[#f9f6f1] rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-[#D1B280]/20 transition-colors">
                  <item.icon className="w-7 h-7 text-[#D1B280]" />
                </div>
                <p className="text-xs text-[#D1B280] font-bold tracking-widest mb-2">ÉTAPE {item.step}</p>
                <h3 className="text-xl font-bold text-[#030A24] mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#D1B280] text-sm font-semibold uppercase tracking-[0.3em] mb-3">Vos avantages</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#030A24]">Pourquoi rejoindre The Club ?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              "Commissions versées rapidement par virement",
              "Suivi en temps réel depuis votre application",
              "Notifications à chaque étape du dossier",
              "Aucun engagement, recommandez quand vous voulez",
              "Application mobile installable sur votre téléphone",
              "Support dédié par votre conseiller référent",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-[#D1B280] mt-0.5 flex-shrink-0" />
                <p className="text-[#030A24] font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-[#030A24]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Prêt à recommander ?</h2>
          <p className="text-lg text-white/60 mb-8">
            Inscrivez-vous gratuitement et commencez à gagner dès votre première recommandation.
          </p>
          <Link href="/rejoindre" className="inline-flex items-center gap-2 bg-[#D1B280] text-[#030A24] px-10 py-4 text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-[#b89a65] transition-colors">
            Créer mon compte <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#030A24] border-t border-white/10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo-white.png" alt="La Brie Immobilière" width={96} height={32} className="h-8 w-auto opacity-50" />
          </div>
          <div className="flex gap-6 text-xs text-white/30">
            <Link href="/mentions-legales" className="hover:text-white/60">Mentions légales</Link>
            <Link href="/politique-confidentialite" className="hover:text-white/60">Confidentialité</Link>
            <Link href="/cgu" className="hover:text-white/60">CGU</Link>
          </div>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} La Brie Immobilière</p>
        </div>
      </footer>
    </div>
  );
}
