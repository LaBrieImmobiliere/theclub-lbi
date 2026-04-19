"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, Save } from "lucide-react";
import Link from "next/link";

export default function ModifierAgencePage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState({
    name: "", code: "", address: "", postalCode: "", city: "", phone: "", email: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/agencies/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else {
          setForm({
            name: data.name || "",
            code: data.code || "",
            address: data.address || "",
            postalCode: data.postalCode || "",
            city: data.city || "",
            phone: data.phone || "",
            email: data.email || "",
          });
        }
        setFetching(false);
      })
      .catch(() => { setError("Erreur lors du chargement"); setFetching(false); });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/agencies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erreur lors de la mise à jour");
      return;
    }

    setSuccess("Agence mise à jour avec succès");
  };

  if (fetching) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 w-48" />
          <div className="h-64 bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/admin/agences/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-deep mb-6">
        <ArrowLeft className="w-4 h-4" />
        Retour à l&apos;agence
      </Link>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="bg-brand-deep px-6 py-4">
          <h1 className="text-lg font-semibold text-white flex items-center gap-2" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            <Building2 className="w-5 h-5 text-brand-gold" />
            Modifier l&apos;agence
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l&apos;agence *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Code *</label>
              <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold font-mono" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse *</label>
            <input type="text" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Code postal *</label>
              <input type="text" required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville *</label>
              <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2">{success}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white font-medium text-sm tracking-wide uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </div>
  );
}
