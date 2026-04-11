"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setSent(true);
    } else {
      setError("Une erreur est survenue. Réessayez.");
    }
    setLoading(false);
  };

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
          <div className="p-8">
            <Link href="/auth/connexion" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-deep mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>

            {sent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-brand-deep mb-2">Email envoyé</h2>
                <p className="text-sm text-gray-500">
                  Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation sous quelques minutes.
                </p>
                <p className="text-xs text-gray-400 mt-3">Le lien est valable 1 heure.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-brand-deep mb-2" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                  Mot de passe oublié
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Saisissez votre email pour recevoir un lien de réinitialisation.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      placeholder="votre@email.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                    {loading ? "Envoi..." : "ENVOYER LE LIEN"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-8">
          &copy; {new Date().getFullYear()} La Brie Immobilière &mdash; depuis 1969
        </p>
      </div>
    </div>
  );
}
