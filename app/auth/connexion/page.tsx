"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, KeyRound, ArrowRight, Star, TrendingUp, Users } from "lucide-react";
import { PwaInstallButton } from "@/components/pwa-install-button";

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/me");
    const user = await res.json();
    const defaultUrl = user?.role === "ADMIN" ? "/admin/dashboard" : user?.role === "NEGOTIATOR" ? "/negociateur/tableau-de-bord" : "/portail/tableau-de-bord";
    router.push(callbackUrl === "/" ? defaultUrl : callbackUrl);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) setMagicSent(true);
    else setError("Une erreur est survenue. Réessayez.");
    setLoading(false);
  };

  return (
    <div className="bg-white overflow-hidden shadow-2xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => { setTab("password"); setError(""); setMagicSent(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-medium tracking-wide uppercase transition-colors ${
            tab === "password" ? "text-[#030A24] border-b-2 border-[#D1B280] bg-[#f9f6f1]/30" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Mot de passe
        </button>
        <button
          onClick={() => { setTab("magic"); setError(""); setMagicSent(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-medium tracking-wide uppercase transition-colors ${
            tab === "magic" ? "text-[#030A24] border-b-2 border-[#D1B280] bg-[#f9f6f1]/30" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Lien magique
        </button>
      </div>

      <div className="p-6 sm:p-8">
        {tab === "password" && (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="votre@email.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-[#D1B280] focus:ring-1 focus:ring-[#D1B280] transition-colors"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-[#D1B280] focus:ring-1 focus:ring-[#D1B280] transition-colors pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D1B280] hover:bg-[#b89a65] text-white font-medium text-sm tracking-wide uppercase transition-colors disabled:opacity-50"
            >
              {loading ? "Connexion..." : "SE CONNECTER"}
            </button>
            <div className="text-center">
              <Link href="/auth/mot-de-passe-oublie" className="text-xs text-gray-400 hover:text-[#D1B280] transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>
          </form>
        )}

        {tab === "magic" && (
          <>
            {magicSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-[#f9f6f1] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-[#D1B280]" />
                </div>
                <h3 className="text-base font-semibold text-[#030A24] mb-2">Email envoyé !</h3>
                <p className="text-sm text-gray-500">
                  Un lien de connexion a été envoyé à <strong>{email}</strong>.<br />
                  Cliquez dessus pour accéder à votre espace.
                </p>
                <p className="text-xs text-gray-400 mt-3">Valable 15 minutes</p>
                <button onClick={() => { setMagicSent(false); setEmail(""); }} className="mt-4 text-xs text-[#D1B280] hover:underline">
                  Utiliser un autre email
                </button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">
                  Recevez un lien par email pour vous connecter sans mot de passe.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="votre@email.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-[#D1B280] focus:ring-1 focus:ring-[#D1B280] transition-colors"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#D1B280] hover:bg-[#b89a65] text-white font-medium text-sm tracking-wide uppercase transition-colors disabled:opacity-50"
                >
                  {loading ? "Envoi..." : "ENVOYER LE LIEN"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <div className="min-h-screen bg-[#030A24] flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo + branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-white.png" alt="La Brie Immobilière" style={{ height: 90, width: "auto", objectFit: "contain" }} />
            </div>
            <p className="text-[#D1B280] text-xs font-medium tracking-[0.3em] uppercase">The Club</p>
            <p className="text-white/40 text-sm mt-1">Connectez-vous à votre espace</p>
          </div>

          {/* Login form */}
          <Suspense fallback={<div className="bg-white p-8 text-center text-gray-400">Chargement...</div>}>
            <ConnexionForm />
          </Suspense>

          {/* CTA Devenir ambassadeur */}
          <div className="mt-6 bg-white/5 border border-white/10 p-5 text-center">
            <p className="text-white text-sm font-medium mb-1">Pas encore ambassadeur ?</p>
            <p className="text-white/40 text-xs mb-4">Inscrivez-vous gratuitement et gagnez des commissions</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <TrendingUp className="w-4 h-4 text-[#D1B280] mx-auto mb-1" />
                <p className="text-xs text-white/70 font-semibold">5%</p>
                <p className="text-[9px] text-white/30">Commission</p>
              </div>
              <div className="text-center">
                <Star className="w-4 h-4 text-[#D1B280] mx-auto mb-1" />
                <p className="text-xs text-white/70 font-semibold">700€</p>
                <p className="text-[9px] text-white/30">Gain moyen</p>
              </div>
              <div className="text-center">
                <Users className="w-4 h-4 text-[#D1B280] mx-auto mb-1" />
                <p className="text-xs text-white/70 font-semibold">100%</p>
                <p className="text-[9px] text-white/30">Gratuit</p>
              </div>
            </div>
            <Link
              href="/rejoindre"
              className="inline-flex items-center gap-2 w-full justify-center py-2.5 border border-[#D1B280] text-[#D1B280] text-sm font-medium hover:bg-[#D1B280] hover:text-white transition-colors"
            >
              Devenir ambassadeur
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <PwaInstallButton variant="login" />

          <p className="text-center text-xs text-white/20 mt-6">
            &copy; {new Date().getFullYear()} La Brie Immobilière — depuis 1969
          </p>
        </div>
      </div>
    </div>
  );
}
