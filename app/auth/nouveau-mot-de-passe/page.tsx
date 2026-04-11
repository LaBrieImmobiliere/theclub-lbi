"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";

function NouveauMotDePasseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 text-sm">Lien invalide ou expiré.</p>
        <Link href="/auth/mot-de-passe-oublie" className="text-brand-gold text-sm mt-3 inline-block">
          Recommencer
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    if (password.length < 8) { setError("Minimum 8 caractères"); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/nouveau-mot-de-passe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/auth/connexion"), 2500);
    } else {
      setError(data.error ?? "Erreur serveur");
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <Link href="/auth/connexion" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-deep mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour à la connexion
      </Link>

      {success ? (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-brand-deep mb-2">Mot de passe modifié</h2>
          <p className="text-sm text-gray-500">Redirection vers la connexion...</p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-brand-deep mb-2" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Nouveau mot de passe
          </h2>
          <p className="text-sm text-gray-500 mb-6">Choisissez un nouveau mot de passe (8 caractères minimum).</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white font-medium text-sm tracking-wide uppercase transition-colors disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : "ENREGISTRER"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function NouveauMotDePassePage() {
  return (
    <div className="min-h-screen bg-brand-deep flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="La Brie Immobilière" style={{ height: 80, width: "auto", objectFit: "contain" }} />
          </div>
          <p className="text-brand-gold text-xs font-medium tracking-[0.3em] uppercase">The Club</p>
        </div>
        <div className="bg-white overflow-hidden shadow-2xl">
          <Suspense fallback={<div className="p-8 text-center text-gray-400">Chargement...</div>}>
            <NouveauMotDePasseForm />
          </Suspense>
        </div>
        <p className="text-center text-xs text-white/30 mt-8">
          &copy; {new Date().getFullYear()} La Brie Immobilière &mdash; depuis 1969
        </p>
      </div>
    </div>
  );
}
