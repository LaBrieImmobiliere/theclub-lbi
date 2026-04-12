"use client";

import { useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, UserPlus, Camera } from "lucide-react";
import Link from "next/link";

export default function NouveauNegociateurPage() {
  const router = useRouter();
  const params = useParams();
  const agencyId = params.id as string;

  const [form, setForm] = useState({ name: "", firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/negotiators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, name: form.firstName + " " + form.lastName, agencyId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur lors de la création");
      setLoading(false);
      return;
    }

    // Upload photo if provided
    if (photo && data.id) {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("userId", data.id);
      await fetch("/api/upload-photo", { method: "POST", body: formData });
    }

    setLoading(false);
    setSuccess(`Négociateur créé ! Code de parrainage : ${data.negotiator?.code || "généré"}`);
    setTimeout(() => router.push(`/admin/agences/${agencyId}`), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/admin/agences/${agencyId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-deep mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à l&apos;agence
      </Link>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="bg-brand-deep px-6 py-4">
          <h1 className="text-lg font-semibold text-white flex items-center gap-2" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            <UserPlus className="w-5 h-5 text-brand-gold" />
            Nouveau négociateur
          </h1>
          <p className="text-sm text-white/50 mt-1">Un email de bienvenue avec les identifiants sera envoyé automatiquement.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom *</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                placeholder="DUPONT"
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              placeholder="jean.dupont@labrieimmobiliere.fr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              placeholder="06 12 34 56 78"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo</label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-brand-gold transition-colors overflow-hidden bg-gray-50"
              >
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-brand-gold font-medium hover:underline"
                >
                  {photo ? "Changer la photo" : "Ajouter une photo"}
                </button>
                <p className="text-xs text-gray-400 mt-0.5">Apparaîtra dans les emails envoyés aux ambassadeurs.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe *</label>
            <input
              type="text"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              placeholder="Mot de passe initial"
            />
            <p className="text-xs text-gray-400 mt-1">Sera communiqué par email au négociateur.</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white font-medium text-sm tracking-wide uppercase transition-colors disabled:opacity-50"
          >
            {loading ? "Création en cours..." : "Créer le négociateur"}
          </button>
        </form>
      </div>
    </div>
  );
}
