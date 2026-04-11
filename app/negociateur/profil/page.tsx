"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Check, AlertCircle, Eye, EyeOff, Download, Trash2, AlertTriangle } from "lucide-react";
import { signOut } from "next-auth/react";
import { PushSubscribeButton } from "@/components/push-subscribe";

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
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 shadow-lg text-sm font-medium ${type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
      {type === "success" ? <Check className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
      {message}
    </div>
  );
}

export default function NegociateurProfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => setToast({ message, type });

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: UserProfile) => { setProfile(d); setName(d.name || ""); setPhone(d.phone || ""); })
      .catch(() => showToast("Erreur lors du chargement", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Erreur", "error"); return; }
      setProfile(data);
      showToast("Profil mis à jour", "success");
    } catch { showToast("Erreur", "error"); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { showToast("Remplissez tous les champs", "error"); return; }
    if (newPassword !== confirmPassword) { showToast("Les mots de passe ne correspondent pas", "error"); return; }
    if (newPassword.length < 6) { showToast("Minimum 6 caractères", "error"); return; }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Erreur", "error"); return; }
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showToast("Mot de passe mis à jour", "success");
    } catch { showToast("Erreur", "error"); }
    finally { setSavingPassword(false); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("userId", profile.id);
      const res = await fetch("/api/upload-photo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Erreur photo", "error"); return; }
      setProfile({ ...profile, image: data.imageUrl });
      showToast("Photo mise à jour", "success");
    } catch { showToast("Erreur photo", "error"); }
    finally { setUploadingPhoto(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Mon profil</h1>
      <p className="text-gray-400 text-sm">Chargement...</p>
    </div>
  );

  if (!profile) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
      <p className="text-red-500 text-sm">Impossible de charger le profil.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>Mon profil</h1>
        <p className="text-gray-500 mt-1 text-sm">Gérez vos informations et votre mot de passe</p>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Informations personnelles</h2></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {profile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.image} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">{(profile.name || profile.email)[0]?.toUpperCase()}</span>
                )}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#D1B280] text-white rounded-full flex items-center justify-center hover:bg-[#b89a65] shadow-sm">
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{profile.name || "Sans nom"}</p>
              <p className="text-xs text-gray-500">{profile.email}</p>
              <p className="text-xs text-[#D1B280] mt-0.5">Négociateur</p>
            </div>
          </div>

          <Input label="Nom complet" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" />
          <Input label="Email" value={profile.email} disabled className="bg-gray-50 text-gray-500" />
          <Input label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 XX XX XX XX" />

          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Changer le mot de passe</h2></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input label="Mot de passe actuel" type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-9 text-gray-400">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Input label="Nouveau mot de passe" type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-9 text-gray-400">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input label="Confirmer le nouveau mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          <Button onClick={handleChangePassword} disabled={savingPassword} variant="outline">
            {savingPassword ? "Changement..." : "Changer le mot de passe"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-gray-400">
            Membre depuis le {new Date(profile.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </CardContent>
      </Card>

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

      {/* RGPD */}
      <Card className="border-gray-200">
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Mes donn&eacute;es personnelles</h2>
          <p className="text-xs text-gray-500">Conform&eacute;ment au RGPD, vous pouvez exporter ou supprimer vos donn&eacute;es.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="/api/me/export" download className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" /> Exporter mes donn&eacute;es
            </a>
            <button onClick={() => { if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) { fetch("/api/me", { method: "DELETE" }).then((r) => { if (r.ok) signOut({ callbackUrl: "/bienvenue" }); }); } }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" /> Supprimer mon compte
            </button>
          </div>
          <p className="text-[10px] text-gray-400 flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            La suppression est d&eacute;finitive et entra&icirc;ne la perte de toutes vos donn&eacute;es.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
