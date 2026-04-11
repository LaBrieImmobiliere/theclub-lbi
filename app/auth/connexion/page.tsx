"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/me");
    const user = await res.json();
    if (user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push(callbackUrl === "/" ? "/portail/tableau-de-bord" : callbackUrl);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow-2xl">
      <div className="p-8">
        <h2 className="text-xl font-semibold text-brand-deep mb-6" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Connexion</h2>

        <form onSubmit={handleCredentials} className="space-y-5">
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
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white font-medium text-sm tracking-wide uppercase transition-colors disabled:opacity-50"
          >
            {loading ? "Connexion..." : "SE CONNECTER"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <div className="min-h-screen bg-brand-deep flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="La Brie Immobilière" style={{ height: 120, width: "auto", objectFit: "contain" }} />
          </div>
          <p className="text-brand-gold text-xs font-medium tracking-[0.3em] uppercase">The Club</p>
          <p className="text-white/50 text-sm mt-1">Espace Ambassadeurs &amp; Administration</p>
        </div>

        <Suspense fallback={<div className="bg-white p-8 text-center text-gray-400">Chargement...</div>}>
          <ConnexionForm />
        </Suspense>

        <p className="text-center text-xs text-white/30 mt-8">
          &copy; {new Date().getFullYear()} La Brie Immobilière &mdash; depuis 1969
        </p>
      </div>
    </div>
  );
}
