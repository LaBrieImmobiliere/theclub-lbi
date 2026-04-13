"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Eye, EyeOff, UserPlus, Gift, MessageSquare, TrendingUp, MapPin, Building2, Info, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Agency {
  id: string;
  name: string;
  city: string;
  negotiators: { id: string; name: string | null }[];
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("ref") || searchParams.get("code") || "";

  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    postalCode: "",
    city: "",
    selectedAgencyId: "",
    selectedNegotiatorId: "",
    legalStatus: "PARTICULIER",
    companyName: "",
    companyLegalForm: "",
    companySiret: "",
    companyTva: "",
    companyAddress: "",
    associationName: "",
    associationRna: "",
    associationObject: "",
  });

  // Fetch agencies
  useEffect(() => {
    fetch("/api/public/agences").then(r => r.json()).then(setAgencies).catch(() => {});
  }, []);

  const selectedAgency = agencies.find(a => a.id === form.selectedAgencyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ambassadeurs/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: `${form.firstName} ${form.lastName}`, referralCode: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }

      setDone(true);
    } catch {
      setError("Erreur de connexion. Réessayez.");
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue dans The Club !</h2>
        <p className="text-gray-500 max-w-sm mx-auto mb-6">
          Votre compte ambassadeur a été créé avec succès. Vérifiez votre boîte email pour vos identifiants de connexion.
        </p>
        <a
          href="/auth/connexion"
          className="inline-flex items-center gap-2 bg-[#D1B280] text-white px-8 py-3 font-semibold text-sm uppercase tracking-wider hover:bg-[#b89960] transition-colors"
        >
          Se connecter
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-3 border-red-500 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Prénom *</label>
          <Input
            required
            value={form.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
            placeholder="Jean"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Nom *</label>
          <Input
            required
            value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value.toUpperCase() }))}
            placeholder="DUPONT"
            style={{ textTransform: "uppercase" }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Email *</label>
        <Input
          type="email"
          required
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="jean.dupont@email.com"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Téléphone</label>
        <Input
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="06 12 34 56 78"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Mot de passe *</label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Minimum 6 caractères"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Adresse */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-[#D1B280]" />
          <p className="text-sm font-medium text-gray-700">Votre adresse</p>
        </div>
        <div className="space-y-2">
          <Input
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="Adresse"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={form.postalCode}
              onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
              placeholder="Code postal"
            />
            <Input
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="Ville"
            />
          </div>
        </div>
      </div>

      {/* Statut juridique */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-[#D1B280]" />
          <p className="text-sm font-medium text-gray-700">Vous &ecirc;tes</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "PARTICULIER", label: "Particulier" },
            { value: "SOCIETE", label: "Soci\u00e9t\u00e9" },
            { value: "ASSOCIATION", label: "Association" },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, legalStatus: opt.value }))}
              className={`px-3 py-2.5 text-sm font-medium border transition-colors ${
                form.legalStatus === opt.value
                  ? "border-[#D1B280] bg-[#f9f6f1] text-[#030A24]"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Champs société */}
        {form.legalStatus === "SOCIETE" && (
          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
            <Input
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              placeholder="Raison sociale *"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.companyLegalForm}
                onChange={e => setForm(f => ({ ...f, companyLegalForm: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 bg-white focus:outline-none focus:border-[#D1B280]"
              >
                <option value="">Forme juridique</option>
                <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                <option value="EURL">EURL</option>
                <option value="SARL">SARL</option>
                <option value="SAS">SAS</option>
                <option value="SASU">SASU</option>
                <option value="SCI">SCI</option>
                <option value="Autre">Autre</option>
              </select>
              <Input
                value={form.companySiret}
                onChange={e => setForm(f => ({ ...f, companySiret: e.target.value }))}
                placeholder="N&deg; SIRET"
              />
            </div>
            <Input
              value={form.companyTva}
              onChange={e => setForm(f => ({ ...f, companyTva: e.target.value }))}
              placeholder="N&deg; TVA intracommunautaire (si assujetti)"
            />
            <Input
              value={form.companyAddress}
              onChange={e => setForm(f => ({ ...f, companyAddress: e.target.value }))}
              placeholder="Adresse du si&egrave;ge social"
            />
            <p className="text-xs text-gray-400">
              En tant que soci&eacute;t&eacute;, la TVA (20%) s&apos;appliquera sur vos commissions.
            </p>
          </div>
        )}

        {/* Champs association */}
        {form.legalStatus === "ASSOCIATION" && (
          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
            <Input
              value={form.associationName}
              onChange={e => setForm(f => ({ ...f, associationName: e.target.value }))}
              placeholder="Nom de l&apos;association *"
              required
            />
            <Input
              value={form.associationRna}
              onChange={e => setForm(f => ({ ...f, associationRna: e.target.value }))}
              placeholder="N&deg; RNA (R&eacute;pertoire National des Associations)"
            />
            <Input
              value={form.associationObject}
              onChange={e => setForm(f => ({ ...f, associationObject: e.target.value }))}
              placeholder="Objet social de l&apos;association"
            />
            <p className="text-xs text-gray-400">
              Les associations non assujetties &agrave; la TVA re&ccedil;oivent la commission HT. Si votre association est assujettie, contactez-nous.
            </p>
          </div>
        )}
      </div>

      {/* Choix agence */}
      {!code && agencies.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-[#D1B280]" />
            <p className="text-sm font-medium text-gray-700">Votre agence</p>
          </div>
          <select
            value={form.selectedAgencyId}
            onChange={e => setForm(f => ({ ...f, selectedAgencyId: e.target.value, selectedNegotiatorId: "" }))}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 bg-white focus:outline-none focus:border-[#D1B280]"
          >
            <option value="">Je ne connais pas d&apos;agence</option>
            {agencies.map(a => (
              <option key={a.id} value={a.id}>{a.name} — {a.city}</option>
            ))}
          </select>

          {/* Choix négociateur */}
          {selectedAgency && selectedAgency.negotiators.length > 0 && (
            <select
              value={form.selectedNegotiatorId}
              onChange={e => setForm(f => ({ ...f, selectedNegotiatorId: e.target.value }))}
              className="w-full mt-2 px-3 py-2.5 text-sm border border-gray-300 bg-white focus:outline-none focus:border-[#D1B280]"
            >
              <option value="">Je ne connais pas de conseiller</option>
              {selectedAgency.negotiators.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          )}

          {!form.selectedAgencyId && (
            <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-blue-50 border border-blue-100">
              <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Pas de souci ! Un agent vous sera attribué rapidement en fonction de votre lieu de domicile.
              </p>
            </div>
          )}
        </div>
      )}

      {code && (
        <div className="bg-[#f9f6f1] border-l-3 border-[#D1B280] p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Code parrainage</p>
          <p className="text-sm font-mono font-bold text-[#030A24]">{code}</p>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full gap-2">
        {loading ? "Création en cours..." : (
          <>
            Créer mon compte ambassadeur
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Vous avez déjà un compte ?{" "}
        <a href="/auth/connexion" className="text-[#D1B280] font-medium hover:underline">Se connecter</a>
      </p>
    </form>
  );
}

const advantages = [
  {
    icon: Gift,
    title: "Gagnez 5% de commission",
    desc: "Sur chaque transaction réalisée grâce à votre recommandation.",
  },
  {
    icon: UserPlus,
    title: "Recommandez simplement",
    desc: "Partagez un contact et notre équipe s'occupe du reste.",
  },
  {
    icon: MessageSquare,
    title: "Suivi en temps réel",
    desc: "Suivez l'avancement de vos recommandations depuis votre espace.",
  },
  {
    icon: TrendingUp,
    title: "Sans limite",
    desc: "Plus vous recommandez, plus vous gagnez. Aucun plafond.",
  },
];

export default function RejoindrePublicPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="La Brie Immobilière" style={{ height: 56, width: "auto", objectFit: "contain" }} className="sm:h-14" />
          <a href="/auth/connexion" className="text-xs sm:text-sm text-[#D1B280] font-medium hover:underline">
            Déjà inscrit ? Se connecter
          </a>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-4 md:gap-8">

          {/* Left: Info */}
          <div className="space-y-6">
            <div>
              <p className="text-[#D1B280] text-xs font-semibold uppercase tracking-[0.3em] mb-2">The Club</p>
              <h1 className="text-3xl font-bold text-[#030A24] mb-3" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                Devenez ambassadeur
              </h1>
              <p className="text-gray-500 leading-relaxed">
                Rejoignez le réseau de recommandation de <strong>La Brie Immobilière</strong>.
                Recommandez vos proches ayant un projet immobilier et percevez une commission sur chaque transaction aboutie.
              </p>
            </div>

            <div className="space-y-4">
              {advantages.map((adv) => (
                <div key={adv.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#f9f6f1] flex items-center justify-center flex-shrink-0">
                    <adv.icon className="w-5 h-5 text-[#D1B280]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#030A24] text-sm">{adv.title}</p>
                    <p className="text-gray-500 text-sm">{adv.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#030A24] p-5">
              <p className="text-[#D1B280] text-sm font-style italic leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                &laquo; Chaque recommandation est une marque de confiance.
                Nous nous engageons à offrir le même niveau d&apos;exigence à vos contacts. &raquo;
              </p>
              <p className="text-white/40 text-xs mt-2">— L&apos;équipe La Brie Immobilière, depuis 1969</p>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <div className="bg-white shadow-sm border border-gray-100 p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#030A24]">Créer mon compte</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Inscrivez-vous gratuitement en quelques secondes.
                </p>
              </div>

              <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100" />}>
                <RegisterForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#030A24] px-6 py-4 text-center">
        <p className="text-white/30 text-xs">
          La Brie Immobilière — SIRET 48525508700010 — RCS Créteil 485255087
        </p>
      </footer>
    </div>
  );
}
