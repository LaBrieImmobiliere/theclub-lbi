import Link from "next/link";
import { Gift, FileText, TrendingUp, Users, CheckCircle2, ArrowRight, Star, Euro, Clock, Shield } from "lucide-react";

export default function LandingPage() {
  const steps = [
    { num: "01", title: "Recommandez", desc: "Transmettez les coordonnées d'un proche qui souhaite acheter, vendre ou louer un bien immobilier." },
    { num: "02", title: "On s'occupe de tout", desc: "Notre équipe prend contact avec votre recommandation et l'accompagne tout au long de son projet." },
    { num: "03", title: "Touchez votre commission", desc: "Dès la signature chez le notaire, votre commission est calculée et versée automatiquement." },
  ];

  const avantages = [
    { icon: Euro, title: "5% des honoraires HT", desc: "Commission attractive sur chaque transaction réalisée grâce à votre recommandation." },
    { icon: Clock, title: "Suivi en temps réel", desc: "Suivez l'avancement de chaque dossier depuis votre espace personnel sécurisé." },
    { icon: FileText, title: "Contrats 100% numériques", desc: "Signez vos contrats et reconnaissances d'honoraires directement en ligne." },
    { icon: Shield, title: "Cadre légal sécurisé", desc: "Contrats d'apporteur d'affaire conformes à la loi Hoguet et au droit immobilier." },
    { icon: Users, title: "Réseau exclusif", desc: "Rejoignez une communauté de prescripteurs sélectionnés par La Brie Immobilière." },
    { icon: Gift, title: "Aucun engagement", desc: "Recommandez quand vous voulez, autant que vous voulez. Aucun objectif ni contrainte." },
  ];

  const temoignages = [
    { name: "Sophie M.", role: "Architecte d'intérieur", text: "J'ai recommandé deux familles de mes clients. En 3 mois, j'ai touché ma première commission. Le processus est simple et transparent.", stars: 5 },
    { name: "Pierre D.", role: "Expert-comptable", text: "Plusieurs de mes clients cherchaient à investir dans l'immobilier. La Brie Immobilière s'en est parfaitement occupé et j'ai été rémunéré rapidement.", stars: 5 },
    { name: "Julie B.", role: "Courtière en financement", text: "Le portail ambassadeur est très pratique. Je soumets une recommandation en 2 minutes et je suis tout depuis mon téléphone.", stars: 5 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="La Brie Immobilière" style={{ height: 36, width: "auto", objectFit: "contain" }} />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/connexion" className="text-sm text-gray-600 hover:text-gray-900">
              Connexion
            </Link>
            <Link
              href="/auth/connexion"
              className="bg-brand-gold text-white text-sm font-medium px-5 py-2.5 hover:bg-brand-gold-dark transition-colors tracking-wide"
            >
              Devenir Ambassadeur
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-brand-deep text-white py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-gold text-xs font-medium tracking-[0.3em] uppercase mb-8">The Club &mdash; La Brie Immobilière</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Recommandez, <br />
            <span className="text-brand-gold">nous récompensons.</span>
          </h1>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Vous connaissez quelqu&apos;un qui cherche à acheter, vendre ou louer ?
            Transmettez-nous ses coordonnées et touchez une commission à la signature.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/connexion"
              className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold px-8 py-4 transition-colors text-lg tracking-wide"
            >
              Rejoindre le programme
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#comment-ca-marche"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-brand-gold text-white font-medium px-8 py-4 transition-colors text-lg"
            >
              Comment ça marche ?
            </a>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { value: "5%", label: "Commission HT" },
              { value: "48h", label: "Délai de contact" },
              { value: "100%", label: "En ligne" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-brand-gold">{value}</div>
                <div className="text-sm text-white/50 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="py-20 px-6 bg-brand-cream">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Comment ça marche ?</h2>
            <p className="text-gray-500 mt-3">Simple, rapide et entièrement digital</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="relative">
                <div className="bg-white p-8 border border-gray-100 h-full">
                  <div className="text-5xl font-black text-brand-gold-light mb-4">{num}</div>
                  <h3 className="text-xl font-bold text-brand-deep mb-3" style={{ fontFamily: "'Fira Sans', sans-serif" }}>{title}</h3>
                  <p className="text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Pourquoi devenir ambassadeur ?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {avantages.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 border border-gray-100 hover:border-brand-gold/30 hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-brand-cream flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-brand-gold" />
                </div>
                <h3 className="font-semibold text-brand-deep mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-20 px-6 bg-brand-cream">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Ce que disent nos ambassadeurs</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {temoignages.map(({ name, role, text, stars }) => (
              <div key={name} className="bg-white p-6 border border-gray-100">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-brand-gold text-brand-gold" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-5 italic">&ldquo;{text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-brand-deep">{name}</p>
                  <p className="text-sm text-gray-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 bg-brand-deep text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Prêt à recommander ?</h2>
          <p className="text-white/60 mb-10 text-lg">
            Rejoignez notre réseau d&apos;ambassadeurs et commencez à être rémunéré pour vos recommandations.
          </p>
          <Link
            href="/auth/connexion"
            className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold px-10 py-4 transition-colors text-lg tracking-wide"
          >
            Créer mon espace ambassadeur
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-white/50">
            {["Gratuit et sans engagement", "Contrat 100% en ligne", "Commission versée rapidement"].map(item => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white/40 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="La Brie Immobilière" style={{ height: 28, width: "auto", objectFit: "contain" }} />
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/auth/connexion" className="hover:text-white transition-colors">Connexion</Link>
            <span>Mentions légales</span>
            <span>Politique de confidentialité</span>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} La Brie Immobilière &mdash; depuis 1969</p>
        </div>
      </footer>
    </div>
  );
}
