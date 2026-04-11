"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Check, AlertCircle, Download, Trash2, AlertTriangle, Award } from "lucide-react";
import { signOut } from "next-auth/react";
import { PushSubscribeButton } from "@/components/push-subscribe";

interface BadgeData {
  id: string;
  type: string;
  label: string;
  earnedAt: string;
}

const BADGE_ICONS: Record<string, string> = {
  FIRST_LEAD: "\uD83C\uDF1F",
  "5_LEADS": "\uD83D\uDD25",
  "10_LEADS": "\uD83D\uDCAA",
  "25_LEADS": "\uD83C\uDFC6",
  FIRST_CONTRACT: "\u2705",
  "5_CONTRACTS": "\uD83D\uDC8E",
};

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  onboarded: boolean;
  createdAt: string;
}

type ToastType = "success" | "error";

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
        type === "success"
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-red-50 text-red-800 border border-red-200"
      }`}
    >
      {type === "success" ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-600" />
      )}
      {message}
    </div>
  );
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Photo
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Badges
  const [badges, setBadges] = useState<BadgeData[]>([]);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur");
        return res.json();
      })
      .then((data: UserProfile) => {
        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
      })
      .catch(() => showToast("Erreur lors du chargement du profil", "error"))
      .finally(() => setLoading(false));

    // Fetch badges
    fetch("/api/me/badges")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setBadges(data))
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erreur lors de la sauvegarde", "error");
        return;
      }
      setProfile(data);
      showToast("Profil mis \u00e0 jour avec succ\u00e8s", "success");
    } catch {
      showToast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Les mots de passe ne correspondent pas", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Le mot de passe doit contenir au moins 6 caract\u00e8res", "error");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erreur lors du changement de mot de passe", "error");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Mot de passe mis \u00e0 jour avec succ\u00e8s", "success");
    } catch {
      showToast("Erreur lors du changement de mot de passe", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("userId", profile.id);

      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erreur lors de l\u2019envoi de la photo", "error");
        return;
      }
      setProfile({ ...profile, image: data.imageUrl });
      showToast("Photo mise \u00e0 jour", "success");
    } catch {
      showToast("Erreur lors de l\u2019envoi de la photo", "error");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-gray-500 mt-1">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-gray-500 mt-1">{"Impossible de charger le profil"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 mt-1">
          {"G\u00e9rez vos informations personnelles et votre mot de passe"}
        </p>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">{"Informations personnelles"}</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {profile.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={profile.image}
                    alt="Photo de profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">
                    {(profile.name || profile.email)[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-gold text-white rounded-full flex items-center justify-center hover:bg-brand-gold-dark transition-colors shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{profile.name || "Sans nom"}</p>
              <p className="text-xs text-gray-500">{profile.email}</p>
              {uploadingPhoto && (
                <p className="text-xs text-brand-gold mt-1">{"Envoi en cours..."}</p>
              )}
            </div>
          </div>

          {/* Name */}
          <Input
            label="Nom complet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
          />

          {/* Email (read-only) */}
          <Input
            label="Email"
            value={profile.email}
            disabled
            className="bg-gray-50 text-gray-500"
          />

          {/* Phone */}
          <Input
            label={"T\u00e9l\u00e9phone"}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12 34 56 78"
            type="tel"
          />

          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              loading={savingProfile}
            >
              {"Enregistrer les modifications"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password change */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">{"Changer le mot de passe"}</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            label="Mot de passe actuel"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
          />

          <Input
            label="Nouveau mot de passe"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 6 caract\u00e8res"
          />

          <Input
            label="Confirmer le nouveau mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Retapez le nouveau mot de passe"
          />

          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              loading={savingPassword}
              variant="outline"
            >
              {"Modifier le mot de passe"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D1B280]" />
              <h2 className="text-lg font-bold text-gray-900">Mes badges</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3 bg-gray-50 p-3 border border-gray-100">
                  <span className="text-2xl">{BADGE_ICONS[badge.type] || "\uD83C\uDFC5"}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{badge.label}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(badge.earnedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Notifications push</h2>
          <p className="text-xs text-gray-500">Recevez des alertes m&ecirc;me quand l&apos;app est ferm&eacute;e</p>
        </CardHeader>
        <CardContent>
          <PushSubscribeButton />
        </CardContent>
      </Card>

      {/* RGPD Section */}
      <Card className="border-gray-200">
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Mes donn&eacute;es personnelles</h2>
          <p className="text-xs text-gray-500">Conform&eacute;ment au RGPD, vous pouvez exporter ou supprimer vos donn&eacute;es.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/api/me/export"
              download
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter mes donn&eacute;es
            </a>
            <button
              onClick={() => {
                if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible. Toutes vos données seront effacées définitivement.")) {
                  fetch("/api/me", { method: "DELETE" }).then((res) => {
                    if (res.ok) signOut({ callbackUrl: "/bienvenue" });
                  });
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer mon compte
            </button>
          </div>
          <p className="text-[10px] text-gray-400 flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            La suppression est d&eacute;finitive et entra&icirc;ne la perte de toutes vos recommandations, contrats et messages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
