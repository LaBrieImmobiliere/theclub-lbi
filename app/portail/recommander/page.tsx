"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowLeft, Sparkles, ChevronDown, Home, Tag } from "lucide-react";
import Link from "next/link";

type ProjectType = "ACHAT" | "VENTE" | "LOCATION" | "INVESTISSEMENT" | "AUTRE" | "";

export default function RecommandationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [done, setDone] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    type: "" as ProjectType,
    email: "",
    description: "",
    budget: "",
    location: "",
  });

  const handleSuggest = async () => {
    if (!form.type) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/ai/suggest-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          location: form.location,
          budget: form.budget,
          draft: form.description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.suggestion) setForm((f) => ({ ...f, description: data.suggestion }));
      }
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.type) return;
    setLoading(true);
    // Split nom complet en firstName / lastName pour rester compatible avec l'API
    const parts = form.fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ") || firstName;
    const res = await fetch("/api/recommandations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        phone: form.phone,
        type: form.type,
        email: form.email || undefined,
        description: form.description || undefined,
        budget: form.budget || undefined,
        location: form.location || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">C&apos;est transmis !</h1>
        <p className="text-gray-500 mb-8">
          Merci ! Nous avons bien reçu votre recommandation de <strong>{form.fullName}</strong>.
          Votre conseiller prend contact rapidement.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => { setDone(false); setShowMore(false); setForm({ fullName: "", phone: "", type: "", email: "", description: "", budget: "", location: "" }); }}>
            Recommander quelqu&apos;un d&apos;autre
          </Button>
          <Button variant="outline" onClick={() => router.push("/portail/mes-recommandations")}>
            Voir mes recommandations
          </Button>
        </div>
      </div>
    );
  }

  const canSubmit = form.fullName.trim() && form.phone.trim() && form.type;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portail/tableau-de-bord" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recommander un contact</h1>
          <p className="text-gray-500 mt-1 text-sm">15 secondes suffisent — on s&apos;occupe du reste.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Nom complet */}
            <Input
              label="Son nom et prénom *"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
              placeholder="Ex. Jean Dupont"
              autoFocus
            />

            {/* 2. Téléphone */}
            <Input
              label="Son téléphone *"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              placeholder="06 12 34 56 78"
            />

            {/* 3. Projet (2 gros boutons) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Son projet *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "ACHAT" })}
                  className={`flex items-center justify-center gap-2 py-4 px-4 border-2 rounded-lg font-medium transition-all ${
                    form.type === "ACHAT"
                      ? "border-[#D1B280] bg-[#D1B280]/10 text-[#030A24]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Achète un bien
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "VENTE" })}
                  className={`flex items-center justify-center gap-2 py-4 px-4 border-2 rounded-lg font-medium transition-all ${
                    form.type === "VENTE"
                      ? "border-[#D1B280] bg-[#D1B280]/10 text-[#030A24]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  Vend un bien
                </button>
              </div>
              {/* lien discret autre type */}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: form.type === "LOCATION" ? "" : "LOCATION" })}
                  className={`text-xs underline-offset-2 hover:underline ${
                    form.type === "LOCATION" ? "text-[#D1B280] font-semibold" : "text-gray-400"
                  }`}
                >
                  Location
                </button>
                <span className="mx-2 text-gray-200">·</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: form.type === "INVESTISSEMENT" ? "" : "INVESTISSEMENT" })}
                  className={`text-xs underline-offset-2 hover:underline ${
                    form.type === "INVESTISSEMENT" ? "text-[#D1B280] font-semibold" : "text-gray-400"
                  }`}
                >
                  Investissement
                </button>
              </div>
            </div>

            {/* 4. Plus d'infos — collapsible */}
            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span>Ajouter plus d&apos;infos (optionnel)</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
              </button>

              {showMore && (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jean.dupont@email.fr"
                  />
                  <Input
                    label="Secteur / ville"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Villecresnes, Boissy-Saint-Léger…"
                  />
                  <Input
                    label="Budget"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="300 000 €"
                  />
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-gray-700">Détails du projet</label>
                      <button
                        type="button"
                        onClick={handleSuggest}
                        disabled={suggesting || !form.type}
                        title={!form.type ? "Sélectionnez d'abord un type de projet" : "Générer une suggestion"}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#D1B280] hover:text-[#b89a65] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {suggesting ? "Génération..." : "Suggérer"}
                      </button>
                    </div>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Ex. famille de 4, cherche T4 avec jardin, école proche…"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full py-6 text-base" loading={loading} disabled={!canSubmit}>
              Transmettre à mon conseiller
            </Button>
            <p className="text-xs text-center text-gray-400">
              Votre conseiller contactera {form.fullName || "votre contact"} directement.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
