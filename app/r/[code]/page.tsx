"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Home, Tag } from "lucide-react";
import Image from "next/image";

type ProjectType = "ACHAT" | "VENTE" | "LOCATION" | "INVESTISSEMENT" | "";

interface AmbassadorInfo {
  name: string;
  agencyName: string;
  agencyCity: string;
}

export default function PublicShareFormPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code ?? "";

  const [ambassador, setAmbassador] = useState<AmbassadorInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    type: "" as ProjectType,
    email: "",
  });

  useEffect(() => {
    if (!code) return;
    fetch(`/api/public/r/${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setAmbassador(data))
      .catch(() => setNotFound(true));
  }, [code]);

  const canSubmit = form.fullName.trim() && form.phone.trim() && form.type;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    const parts = form.fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ") || firstName;
    const res = await fetch(`/api/public/r/${encodeURIComponent(code)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        phone: form.phone,
        email: form.email || undefined,
        type: form.type,
      }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Lien invalide</h1>
            <p className="text-sm text-gray-500">
              Ce lien de recommandation n&apos;existe pas ou n&apos;est plus actif.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Merci !</h1>
            <p className="text-sm text-gray-500 mb-6">
              Vos coordonnées ont bien été transmises
              {ambassador?.agencyName ? ` à l'équipe ${ambassador.agencyName}` : ""}.
              Un conseiller vous contactera rapidement.
            </p>
            <p className="text-xs text-gray-400">
              Vous pouvez fermer cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-lg mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="text-center py-8">
          <Image
            src="/logo-white.png"
            alt="La Brie Immobilière"
            width={80}
            height={80}
            className="mx-auto bg-brand-deep p-2 rounded"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <p className="text-xs tracking-[4px] text-brand-gold mt-4 font-semibold uppercase">
            The Club
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {ambassador?.agencyName ?? "La Brie Immobilière"}
            {ambassador?.agencyCity ? ` — ${ambassador.agencyCity}` : ""}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {ambassador?.name && (
              <div className="mb-5 text-center">
                <p className="text-sm text-gray-500">
                  Vous avez été recommandé par
                </p>
                <p className="font-semibold text-gray-900">{ambassador.name}</p>
              </div>
            )}

            <h1 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Laissez-nous vos coordonnées
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Votre nom et prénom *"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                placeholder="Jean Dupont"
                autoFocus
              />

              <Input
                label="Votre téléphone *"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder="06 12 34 56 78"
              />

              <Input
                label="Votre email (optionnel)"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jean.dupont@email.fr"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre projet *
                </label>
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
                    J&apos;achète
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
                    Je vends
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full py-6 text-base"
                loading={loading}
                disabled={!canSubmit}
              >
                Envoyer mes coordonnées
              </Button>

              <p className="text-[11px] text-center text-gray-400 leading-relaxed pt-2">
                En envoyant ce formulaire, vous acceptez d&apos;être recontacté par un
                conseiller de La Brie Immobilière. Vos données sont traitées conformément
                à notre politique de confidentialité.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
