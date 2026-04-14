"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function RecommandationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    type: "",
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
    setLoading(true);
    const res = await fetch("/api/recommandations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recommandation envoyée !</h1>
        <p className="text-gray-500 mb-8">
          Merci ! Nous avons bien reçu la recommandation de <strong>{form.firstName} {form.lastName}</strong>.
          Notre équipe prendra contact rapidement.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setDone(false); setStep(1); setForm({ firstName: "", lastName: "", email: "", phone: "", type: "", description: "", budget: "", location: "" }); }}>
            Faire une autre recommandation
          </Button>
          <Button variant="outline" onClick={() => router.push("/portail/mes-recommandations")}>
            Voir mes recommandations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portail/tableau-de-bord" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recommander un contact</h1>
          <p className="text-gray-500 mt-1">Transmettez les coordonnées d&apos;un proche intéressé par l&apos;immobilier</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? "bg-blue-600" : "bg-gray-200"}`}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">
            {step === 1 ? "Informations du contact" : "Projet immobilier"}
          </h2>
          <p className="text-sm text-gray-500">Étape {step} sur 2</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Prénom *"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                    placeholder="Jean"
                  />
                  <Input
                    label="Nom *"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                    placeholder="Dupont"
                  />
                </div>
                <Input
                  label="Téléphone *"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  placeholder="06 12 34 56 78"
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jean.dupont@email.fr"
                />
                <div className="pt-2">
                  <Button type="submit" className="w-full">
                    Suivant →
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Select
                  label="Type de projet *"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  options={[
                    { value: "ACHAT", label: "Achat" },
                    { value: "VENTE", label: "Vente" },
                    { value: "LOCATION", label: "Location" },
                  ]}
                  placeholder="Choisir le type de projet"
                  required
                />
                <Input
                  label="Localisation souhaitée"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Lyon 6e, Caluire..."
                />
                <Input
                  label="Budget"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="300 000 €"
                />
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Description du projet</label>
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
                    placeholder="Décrivez brièvement le projet de votre contact..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    ← Retour
                  </Button>
                  <Button type="submit" loading={loading} className="flex-1">
                    Envoyer la recommandation
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
