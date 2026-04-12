import Link from "next/link";
import { Gift, FileText, TrendingUp, Users, CheckCircle2, ArrowRight, Star, Euro, Clock, Shield, Smartphone, Zap, BarChart2, Bell } from "lucide-react";

export default function LandingPage() {
  const steps = [
    { num: "01", title: "Inscrivez-vous", desc: "Cr\u00e9ez votre compte gratuitement en 30 secondes. Aucun justificatif demand\u00e9.", icon: Users, color: "bg-blue-500" },
    { num: "02", title: "Recommandez", desc: "Transmettez les coordonn\u00e9es d\u2019un proche qui souhaite acheter, vendre ou louer un bien.", icon: Gift, color: "bg-[#D1B280]" },
    { num: "03", title: "Suivez en direct", desc: "Suivez l\u2019avancement de votre recommandation \u00e9tape par \u00e9tape depuis votre app.", icon: BarChart2, color: "bg-purple-500" },
    { num: "04", title: "Touchez votre commission", desc: "D\u00e8s la signature chez le notaire, votre commission de 5% est vers\u00e9e.", icon: Euro, color: "bg-green-500" },
  ];

  const avantages = [
    { icon: Euro, title: "5% des honoraires HT", desc: "Commission attractive sur chaque transaction r\u00e9alis\u00e9e gr\u00e2ce \u00e0 votre recommandation." },
    { icon: Clock, title: "Suivi en temps r\u00e9el", desc: "10 \u00e9tapes de suivi avec notifications fun \u00e0 chaque changement de statut." },
    { icon: FileText, title: "Contrats 100% num\u00e9riques", desc: "Signez vos contrats et reconnaissances d\u2019honoraires directement en ligne." },
    { icon: Shield, title: "Cadre l\u00e9gal s\u00e9curis\u00e9", desc: "Contrats conformes \u00e0 la loi Hoguet et au droit immobilier fran\u00e7ais." },
    { icon: Bell, title: "Notifications push", desc: "Soyez alert\u00e9 imm\u00e9diatement d\u00e8s qu\u2019une \u00e9tape franchie, m\u00eame app ferm\u00e9e." },
    { icon: Gift, title: "Z\u00e9ro engagement", desc: "Recommandez quand vous voulez, autant que vous voulez. 100% gratuit." },
  ];

  const temoignages = [
    { name: "Sophie M.", role: "Architecte d\u2019int\u00e9rieur", text: "J\u2019ai recommand\u00e9 deux familles de mes clients. En 3 mois, j\u2019ai touch\u00e9 ma premi\u00e8re commission. Le processus est simple et transparent.", stars: 5, amount: "2 400 \u20AC" },
    { name: "Pierre D.", role: "Expert-comptable", text: "Plusieurs de mes clients cherchaient \u00e0 investir. La Brie Immobili\u00e8re s\u2019en est parfaitement occup\u00e9 et j\u2019ai \u00e9t\u00e9 r\u00e9mun\u00e9r\u00e9 rapidement.", stars: 5, amount: "4 800 \u20AC" },
    { name: "Julie B.", role: "Courti\u00e8re en financement", text: "Le portail ambassadeur est tr\u00e8s pratique. Je soumets une recommandation en 2 minutes et je suis tout depuis mon t\u00e9l\u00e9phone.", stars: 5, amount: "1 200 \u20AC" },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="La Brie Immobili\u00e8re" style={{ height: 36, width: "auto", objectFit: "contain" }} />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/auth/connexion" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:inline">
              Connexion
            </Link>
            <Link
              href="/auth/connexion"
              className="bg-[#D1B280] text-white text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 hover:bg-[#b89a65] transition-colors tracking-wide"
            >
              Devenir Ambassadeur
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#030A24] text-white py-16 sm:py-24 lg:py-28 px-4 sm:px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D1B280]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D1B280]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-5xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <div className="text-center lg:text-left">
              <p className="text-[#D1B280] text-xs font-medium tracking-[0.3em] uppercase mb-6">The Club &mdash; La Brie Immobili&egrave;re</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                Recommandez,<br />
                <span className="text-[#D1B280]">nous r&eacute;compensons.</span>
              </h1>
              <p className="text-base sm:text-lg text-white/60 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Vous connaissez quelqu&apos;un qui cherche &agrave; acheter, vendre ou louer ? Transmettez-nous ses coordonn&eacute;es et touchez <strong className="text-[#D1B280]">5% de commission</strong> &agrave; la signature.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/auth/connexion"
                  className="inline-flex items-center justify-center gap-2 bg-[#D1B280] hover:bg-[#b89a65] text-white font-semibold px-6 sm:px-8 py-3.5 transition-colors text-sm sm:text-base tracking-wide"
                >
                  Rejoindre le programme
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#comment-ca-marche"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-[#D1B280] text-white font-medium px-6 sm:px-8 py-3.5 transition-colors text-sm sm:text-base"
                >
                  Comment &ccedil;a marche ?
                </a>
              </div>
            </div>

            {/* Right - Stats card */}
            <div className="hidden lg:block">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 space-y-6">
                <p className="text-[#D1B280] text-xs font-medium tracking-widest uppercase">En moyenne, nos ambassadeurs gagnent</p>
                <div className="text-center">
                  <p className="text-6xl font-black text-white" style={{ fontFamily: "'Fira Sans', sans-serif" }}>700&euro;</p>
                  <p className="text-white/40 mt-2">par transaction r&eacute;alis&eacute;e</p>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#D1B280]">5%</p>
                    <p className="text-[10px] text-white/40 mt-1">Commission</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">48h</p>
                    <p className="text-[10px] text-white/40 mt-1">D&eacute;lai contact</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">100%</p>
                    <p className="text-[10px] text-white/40 mt-1">En ligne</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile stats */}
          <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-6 lg:hidden">
            {[
              { value: "5%", label: "Commission" },
              { value: "48h", label: "D\u00e9lai contact" },
              { value: "100%", label: "En ligne" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center bg-white/5 py-4 px-2">
                <div className="text-2xl sm:text-3xl font-bold text-[#D1B280]">{value}</div>
                <div className="text-[10px] sm:text-xs text-white/40 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simulation gains */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-[#D1B280]/10 to-[#D1B280]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#030A24] mb-2" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Simulez vos gains
          </h2>
          <p className="text-sm text-gray-500 mb-8">Combien pourriez-vous gagner en recommandant ?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { recos: 1, amount: "700 \u20AC", label: "1 recommandation", sub: "1 vente conclue" },
              { recos: 3, amount: "2 100 \u20AC", label: "3 recommandations", sub: "Un bon d\u00e9but !" },
              { recos: 5, amount: "3 500 \u20AC", label: "5 recommandations", sub: "Objectif atteignable", highlight: true },
            ].map(({ recos, amount, label, sub, highlight }) => (
              <div key={recos} className={`p-6 ${highlight ? "bg-[#030A24] text-white" : "bg-white border border-gray-100"}`}>
                <p className={`text-3xl sm:text-4xl font-black ${highlight ? "text-[#D1B280]" : "text-[#030A24]"}`} style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                  {amount}
                </p>
                <p className={`font-medium mt-2 ${highlight ? "text-white" : "text-gray-900"}`}>{label}</p>
                <p className={`text-xs mt-1 ${highlight ? "text-white/50" : "text-gray-400"}`}>{sub}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-4">*Estimation bas&eacute;e sur un prix de vente moyen de 280 000&euro; et des honoraires de 5%</p>
        </div>
      </section>

      {/* Comment &ccedil;a marche */}
      <section id="comment-ca-marche" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#030A24]" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Comment &ccedil;a marche ?</h2>
            <p className="text-gray-500 mt-3 text-sm sm:text-base">Simple, rapide et enti&egrave;rement digital</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {steps.map(({ num, title, desc, icon: Icon, color }) => (
              <div key={num} className="relative">
                <div className="bg-white p-6 border border-gray-100 h-full hover:border-[#D1B280]/30 hover:shadow-sm transition-all">
                  <div className={`w-10 h-10 ${color} text-white flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-gray-400 font-medium mb-2">&Eacute;tape {num}</div>
                  <h3 className="text-base font-bold text-[#030A24] mb-2" style={{ fontFamily: "'Fira Sans', sans-serif" }}>{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App PWA section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#030A24] text-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-[#D1B280]" />
                <p className="text-[#D1B280] text-xs font-medium tracking-widest uppercase">Application mobile</p>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                Votre espace ambassadeur<br />dans votre poche
              </h2>
              <p className="text-white/60 mb-8 leading-relaxed">
                Installez The Club sur votre t&eacute;l&eacute;phone en un clic. Acc&eacute;dez &agrave; votre tableau de bord, recommandez un contact et suivez vos commissions — tout depuis votre &eacute;cran d&apos;accueil.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Zap, text: "Recommander en 30 secondes" },
                  { icon: Bell, text: "Notifications push \u00e0 chaque \u00e9tape" },
                  { icon: TrendingUp, text: "Jauge de gains en temps r\u00e9el" },
                  { icon: Shield, text: "Signature \u00e9lectronique int\u00e9gr\u00e9e" },
                ].map(({ icon: I, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#D1B280]/20 flex items-center justify-center flex-shrink-0">
                      <I className="w-4 h-4 text-[#D1B280]" />
                    </div>
                    <p className="text-sm text-white/80">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="bg-white/5 border border-white/10 p-8 w-64 text-center">
                <div className="w-16 h-16 bg-[#D1B280]/20 mx-auto mb-4 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-[#D1B280]" />
                </div>
                <p className="font-bold text-white mb-1">The Club LBI</p>
                <p className="text-xs text-white/40 mb-6">Progressive Web App</p>
                <div className="space-y-2 text-xs text-white/60">
                  <p>iPhone : Safari &rarr; Partager &rarr; &Eacute;cran d&apos;accueil</p>
                  <p>Android : Chrome &rarr; Installer l&apos;application</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#030A24]" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Pourquoi devenir ambassadeur ?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {avantages.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 sm:p-6 border border-gray-100 hover:border-[#D1B280]/30 hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-[#f9f6f1] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#D1B280]" />
                </div>
                <h3 className="font-semibold text-[#030A24] mb-2 text-sm">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* T&eacute;moignages */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#f9f6f1]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#030A24]" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Ce que disent nos ambassadeurs</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {temoignages.map(({ name, role, text, stars, amount }) => (
              <div key={name} className="bg-white p-5 sm:p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#D1B280] text-[#D1B280]" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-green-600">{amount}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">&ldquo;{text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-[#030A24] text-sm">{name}</p>
                  <p className="text-xs text-gray-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#030A24] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Pr&ecirc;t &agrave; recommander ?</h2>
          <p className="text-white/50 mb-8 sm:mb-10 text-sm sm:text-lg">
            Rejoignez notre r&eacute;seau d&apos;ambassadeurs et commencez &agrave; &ecirc;tre r&eacute;mun&eacute;r&eacute; pour vos recommandations.
          </p>
          <Link
            href="/auth/connexion"
            className="inline-flex items-center gap-2 bg-[#D1B280] hover:bg-[#b89a65] text-white font-bold px-8 sm:px-10 py-3.5 sm:py-4 transition-colors text-sm sm:text-lg tracking-wide"
          >
            Cr&eacute;er mon espace ambassadeur
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="mt-6 sm:mt-8 flex flex-wrap gap-4 sm:gap-6 justify-center text-xs sm:text-sm text-white/40">
            {["Gratuit et sans engagement", "Contrat 100% en ligne", "Commission vers\u00e9e rapidement"].map(item => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D1B280]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white/40 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="La Brie Immobili\u00e8re" style={{ height: 28, width: "auto", objectFit: "contain" }} />
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <Link href="/auth/connexion" className="hover:text-white transition-colors">Connexion</Link>
            <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions l&eacute;gales</Link>
            <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialit&eacute;</Link>
            <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} La Brie Immobili&egrave;re &mdash; depuis 1969</p>
        </div>
      </footer>
    </div>
  );
}
