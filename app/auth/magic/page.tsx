"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, XCircle } from "lucide-react";
import Image from "next/image";

function MagicContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setError("Lien invalide."); return; }

    signIn("magic", { token, redirect: false }).then(async (result) => {
      if (result?.error) {
        setError("Ce lien est invalide ou expiré. Demandez-en un nouveau.");
        return;
      }
      const res = await fetch("/api/me");
      const user = await res.json();
      if (user?.role === "ADMIN") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/portail/tableau-de-bord");
      }
    });
  }, [token, router]);

  if (error) {
    return (
      <div className="text-center py-4">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-sm text-gray-700 mb-4">{error}</p>
        <a href="/auth/connexion" className="text-brand-gold text-sm hover:underline">
          Retour à la connexion
        </a>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <Loader2 className="w-10 h-10 text-brand-gold mx-auto mb-4 animate-spin" />
      <p className="text-sm text-gray-600">Connexion en cours...</p>
    </div>
  );
}

export default function MagicPage() {
  return (
    <div className="min-h-screen bg-brand-deep flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Image src="/logo-white.png" alt="La Brie Immobilière" width={240} height={80} style={{ height: 80, width: "auto", objectFit: "contain" }} priority />
          </div>
          <p className="text-brand-gold text-xs font-medium tracking-[0.3em] uppercase">The Club</p>
        </div>
        <div className="bg-white overflow-hidden shadow-2xl p-8">
          <Suspense fallback={<div className="text-center py-8"><Loader2 className="w-10 h-10 text-brand-gold mx-auto animate-spin" /></div>}>
            <MagicContent />
          </Suspense>
        </div>
        <p className="text-center text-xs text-white/30 mt-8">
          &copy; {new Date().getFullYear()} La Brie Immobilière &mdash; depuis 1969
        </p>
      </div>
    </div>
  );
}
