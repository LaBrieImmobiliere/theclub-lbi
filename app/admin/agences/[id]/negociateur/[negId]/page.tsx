"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Camera, Trash2, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function EditNegociateurPage() {
  const router = useRouter();
  const params = useParams();
  const agencyId = params.id as string;
  const negId = params.negId as string;

  const [form, setForm] = useState({ name: "", firstName: "", lastName: "", email: "", phone: "", password: "", status: "ACTIVE" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reassignTo, setReassignTo] = useState("");
  const [otherNegotiators, setOtherNegotiators] = useState<{ id: string; name: string; agency: string }[]>([]);
  const [ambassadorCount, setAmbassadorCount] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fetching, setFetching] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/negotiators/${negId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setForm({
            name: data.user?.name || "",
            firstName: data.user?.firstName || "",
            lastName: data.user?.lastName || "",
            email: data.user?.email || "",
            phone: data.user?.phone || "",
            password: "",
            status: data.status || "ACTIVE",
          });
          setCode(data.code || "");
          setCurrentPhoto(data.user?.image || null);
          setAmbassadorCount(data._count?.ambassadors || 0);
        }
        setFetching(false);
      })
      .catch(() => {
        setError("Erreur lors du chargement");
        setFetching(false);
      });
  }, [negId]);

  useEffect(() => {
    fetch("/api/negotiators")
      .then(r => r.json())
      .then((list: { id: string; user: { name: string }; agency: { name: string } }[]) => {
        setOtherNegotiators(
          list
            .filter(n => n.id !== negId)
            .map(n => ({ id: n.id, name: n.user?.name || "Sans nom", agency: n.agency?.name || "" }))
        );
      })
      .catch(() => {});
  }, [negId]);

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

    const body: Record<string, string> = {
      name: form.firstName + " " + form.lastName,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      status: form.status,
    };
    if (form.password) body.password = form.password;

    const res = await fetch(`/api/negotiators/${negId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur lors de la mise à jour");
      setLoading(false);
      return;
    }

    // Upload photo if changed
    if (photo && data.user?.id) {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("userId", data.user.id);
      await fetch("/api/upload-photo", { method: "POST", body: formData });
    }

    // Update code display
    if (data.code) setCode(data.code);

    setLoading(false);
    setSuccess("Négociateur mis à jour avec succès");
  };

  const openDeleteModal = () => {
    setReassignTo("");
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const url = reassignTo
      ? `/api/negotiators/${negId}?reassignTo=${reassignTo}`
      : `/api/negotiators/${negId}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      router.push(`/admin/agences/${agencyId}`);
    } else {
      const data = await res.json();
      setError(data.error || "Erreur lors de la suppression");
      setDeleting(false);
      setShowDeleteModal(false);
    }
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

  const displayPhoto = photoPreview || currentPhoto;

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white flex items-center gap-2" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                <Save className="w-5 h-5 text-brand-gold" />
                Modifier le négociateur
              </h1>
              <p className="text-sm text-white/50 mt-1">
                Code : <code className="text-brand-gold">{code}</code>
              </p>
            </div>
            <button
              onClick={openDeleteModal}
              disabled={deleting}
              className="text-red-400 hover:text-red-300 p-2 transition-colors"
              title="Supprimer le négociateur"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo</label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-brand-gold transition-colors overflow-hidden bg-gray-50"
              >
                {displayPhoto ? (
                  <Image src={displayPhoto} alt="Photo" width={80} height={80} className="w-full h-full object-cover" unoptimized />
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
                  {displayPhoto ? "Changer la photo" : "Ajouter une photo"}
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              placeholder="Laisser vide pour ne pas changer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold bg-white"
            >
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white font-medium text-sm tracking-wide uppercase transition-colors disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-red-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="font-semibold text-red-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
                  Supprimer le négociateur
                </h2>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-700">
                Vous êtes sur le point de supprimer ce négociateur. Cette action est <strong>irréversible</strong>.
              </p>

              {ambassadorCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-sm text-amber-800 font-medium">
                    Ce négociateur a {ambassadorCount} ambassadeur{ambassadorCount > 1 ? "s" : ""} rattaché{ambassadorCount > 1 ? "s" : ""}.
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Vous pouvez les réattribuer à un autre négociateur ci-dessous, ou ils seront détachés.
                  </p>
                </div>
              )}

              {otherNegotiators.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Réattribuer les ambassadeurs et leads à :
                  </label>
                  <select
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold bg-white"
                  >
                    <option value="">Ne pas réattribuer (détacher)</option>
                    {otherNegotiators.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} — {n.agency}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
