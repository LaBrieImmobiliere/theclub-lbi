"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Check, AlertCircle, Download, Trash2, AlertTriangle, Award, Building2, Users, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { PushSubscribeButton } from "@/components/push-subscribe";

const LEGAL_STATUS_LABELS: Record<string, string> = {
  PARTICULIER: "Particulier",
  SOCIETE: "Société",
  ASSOCIATION: "Association",
};

const COMPANY_LEGAL_FORMS = [
  "SAS", "SARL", "EURL", "Auto-entrepreneur", "SCI", "Autre",
];

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

interface AmbassadorLegal {
  id: string;
  legalStatus: string;
  companyName: string | null;
  companyLegalForm: string | null;
  companySiret: string | null;
  companyTva: string | null;
  companyRcs: string | null;
  companyCapital: string | null;
  companyAddress: string | null;
  associationName: string | null;
  associationRna: string | null;
  associationObject: string | null;
}

interface UserProfile {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  rib: string | null;
  onboarded: boolean;
  createdAt: string;
  ambassador?: AmbassadorLegal | null;
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Legal status form
  const [legalStatus, setLegalStatus] = useState("PARTICULIER");
  const [companyName, setCompanyName] = useState("");
  const [companyLegalForm, setCompanyLegalForm] = useState("");
  const [companySiret, setCompanySiret] = useState("");
  const [companyTva, setCompanyTva] = useState("");
  const [companyRcs, setCompanyRcs] = useState("");
  const [companyCapital, setCompanyCapital] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [associationName, setAssociationName] = useState("");
  const [associationRna, setAssociationRna] = useState("");
  const [associationObject, setAssociationObject] = useState("");
  const [editingLegal, setEditingLegal] = useState(false);
  const [savingLegal, setSavingLegal] = useState(false);

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
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setPhone(data.phone || "");
        if (data.ambassador) {
          setLegalStatus(data.ambassador.legalStatus || "PARTICULIER");
          setCompanyName(data.ambassador.companyName || "");
          setCompanyLegalForm(data.ambassador.companyLegalForm || "");
          setCompanySiret(data.ambassador.companySiret || "");
          setCompanyTva(data.ambassador.companyTva || "");
          setCompanyRcs(data.ambassador.companyRcs || "");
          setCompanyCapital(data.ambassador.companyCapital || "");
          setCompanyAddress(data.ambassador.companyAddress || "");
          setAssociationName(data.ambassador.associationName || "");
          setAssociationRna(data.ambassador.associationRna || "");
          setAssociationObject(data.ambassador.associationObject || "");
        }
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
        body: JSON.stringify({ firstName, lastName, name: firstName + " " + lastName, phone }),
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

  const handleSaveLegal = async () => {
    setSavingLegal(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalStatus,
          companyName, companyLegalForm, companySiret, companyTva,
          companyRcs, companyCapital, companyAddress,
          associationName, associationRna, associationObject,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erreur lors de la sauvegarde", "error");
        return;
      }
      setProfile(data);
      setEditingLegal(false);
      showToast("Statut juridique mis \u00e0 jour", "success");
    } catch {
      showToast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSavingLegal(false);
    }
  };

  const resetLegalForm = () => {
    if (profile?.ambassador) {
      setLegalStatus(profile.ambassador.legalStatus || "PARTICULIER");
      setCompanyName(profile.ambassador.companyName || "");
      setCompanyLegalForm(profile.ambassador.companyLegalForm || "");
      setCompanySiret(profile.ambassador.companySiret || "");
      setCompanyTva(profile.ambassador.companyTva || "");
      setCompanyRcs(profile.ambassador.companyRcs || "");
      setCompanyCapital(profile.ambassador.companyCapital || "");
      setCompanyAddress(profile.ambassador.companyAddress || "");
      setAssociationName(profile.ambassador.associationName || "");
      setAssociationRna(profile.ambassador.associationRna || "");
      setAssociationObject(profile.ambassador.associationObject || "");
    }
    setEditingLegal(false);
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

          {/* FirstName / LastName */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Votre prénom"
            />
            <Input
              label="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value.toUpperCase())}
              placeholder="Votre nom"
              style={{ textTransform: "uppercase" }}
            />
          </div>

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

      {/* Legal status */}
      {profile.role === "AMBASSADOR" && profile.ambassador && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Statut juridique</h2>
              {!editingLegal ? (
                <button
                  onClick={() => setEditingLegal(true)}
                  className="text-sm text-[#D1B280] hover:text-[#b89a6a] font-medium"
                >
                  Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSaveLegal} loading={savingLegal} size="sm">
                    Enregistrer
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetLegalForm}>
                    Annuler
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingLegal ? (
              <>
                {/* Legal status selector */}
                <div className="grid grid-cols-3 gap-2">
                  {(["PARTICULIER", "SOCIETE", "ASSOCIATION"] as const).map((ls) => {
                    const icons = { PARTICULIER: User, SOCIETE: Building2, ASSOCIATION: Users };
                    const Icon = icons[ls];
                    return (
                      <button
                        key={ls}
                        type="button"
                        onClick={() => setLegalStatus(ls)}
                        className={`flex flex-col items-center gap-1.5 p-3 border text-sm font-medium transition-colors ${
                          legalStatus === ls
                            ? "border-[#D1B280] bg-[#D1B280]/5 text-[#D1B280]"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {LEGAL_STATUS_LABELS[ls]}
                      </button>
                    );
                  })}
                </div>

                {legalStatus === "SOCIETE" && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-3 py-2">
                      En tant que soci&eacute;t&eacute;, la TVA (20%) sera appliqu&eacute;e sur vos commissions.
                    </p>
                    <Input
                      label="Raison sociale"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Nom de la soci&eacute;t&eacute;"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Forme juridique</label>
                        <select
                          value={companyLegalForm}
                          onChange={(e) => setCompanyLegalForm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-[#D1B280]"
                        >
                          <option value="">S&eacute;lectionner</option>
                          {COMPANY_LEGAL_FORMS.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="SIRET"
                        value={companySiret}
                        onChange={(e) => setCompanySiret(e.target.value)}
                        placeholder="XXX XXX XXX XXXXX"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="N&deg; TVA intracommunautaire"
                        value={companyTva}
                        onChange={(e) => setCompanyTva(e.target.value)}
                        placeholder="FR XX XXXXXXXXX"
                      />
                      <Input
                        label="RCS"
                        value={companyRcs}
                        onChange={(e) => setCompanyRcs(e.target.value)}
                        placeholder="RCS Ville XXX XXX XXX"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Capital social"
                        value={companyCapital}
                        onChange={(e) => setCompanyCapital(e.target.value)}
                        placeholder="10 000 &euro;"
                      />
                      <Input
                        label="Adresse du si&egrave;ge"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Adresse compl&egrave;te"
                      />
                    </div>
                  </div>
                )}

                {legalStatus === "ASSOCIATION" && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-2">
                      En tant qu&apos;association, pas de TVA appliqu&eacute;e sur vos commissions.
                    </p>
                    <Input
                      label="Nom de l&apos;association"
                      value={associationName}
                      onChange={(e) => setAssociationName(e.target.value)}
                      placeholder="Nom officiel"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="N&deg; RNA"
                        value={associationRna}
                        onChange={(e) => setAssociationRna(e.target.value)}
                        placeholder="W XXXXXXXXX"
                      />
                      <Input
                        label="Objet social"
                        value={associationObject}
                        onChange={(e) => setAssociationObject(e.target.value)}
                        placeholder="Objet de l&apos;association"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {legalStatus === "PARTICULIER" && <User className="w-5 h-5 text-gray-400" />}
                  {legalStatus === "SOCIETE" && <Building2 className="w-5 h-5 text-[#D1B280]" />}
                  {legalStatus === "ASSOCIATION" && <Users className="w-5 h-5 text-purple-500" />}
                  <div>
                    <p className="font-medium text-gray-900">{LEGAL_STATUS_LABELS[legalStatus] || legalStatus}</p>
                    {legalStatus === "SOCIETE" && (
                      <p className="text-xs text-blue-600">TVA (20%) appliqu&eacute;e sur vos commissions</p>
                    )}
                    {legalStatus !== "SOCIETE" && (
                      <p className="text-xs text-gray-500">Pas de TVA appliqu&eacute;e</p>
                    )}
                  </div>
                </div>

                {legalStatus === "SOCIETE" && profile.ambassador.companyName && (
                  <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Raison sociale</span>
                      <span className="font-medium">{profile.ambassador.companyName}</span>
                    </div>
                    {profile.ambassador.companyLegalForm && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Forme juridique</span>
                        <span className="font-medium">{profile.ambassador.companyLegalForm}</span>
                      </div>
                    )}
                    {profile.ambassador.companySiret && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">SIRET</span>
                        <span className="font-mono text-xs">{profile.ambassador.companySiret}</span>
                      </div>
                    )}
                    {profile.ambassador.companyTva && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">TVA intracom.</span>
                        <span className="font-mono text-xs">{profile.ambassador.companyTva}</span>
                      </div>
                    )}
                    {profile.ambassador.companyRcs && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">RCS</span>
                        <span className="font-medium">{profile.ambassador.companyRcs}</span>
                      </div>
                    )}
                    {profile.ambassador.companyCapital && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Capital</span>
                        <span className="font-medium">{profile.ambassador.companyCapital}</span>
                      </div>
                    )}
                    {profile.ambassador.companyAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Si&egrave;ge</span>
                        <span className="font-medium text-right max-w-[60%]">{profile.ambassador.companyAddress}</span>
                      </div>
                    )}
                  </div>
                )}

                {legalStatus === "ASSOCIATION" && profile.ambassador.associationName && (
                  <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nom</span>
                      <span className="font-medium">{profile.ambassador.associationName}</span>
                    </div>
                    {profile.ambassador.associationRna && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">N&deg; RNA</span>
                        <span className="font-mono text-xs">{profile.ambassador.associationRna}</span>
                      </div>
                    )}
                    {profile.ambassador.associationObject && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Objet</span>
                        <span className="font-medium text-right max-w-[60%]">{profile.ambassador.associationObject}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* RIB */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900">Mon RIB</h2>
          <p className="text-xs text-gray-500">Pour recevoir vos commissions</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            label="IBAN"
            value={profile.rib || ""}
            onChange={() => {}}
            disabled
            placeholder="Non renseign&eacute;"
            className="bg-gray-50 font-mono text-sm"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={async () => {
                const iban = prompt("Entrez votre IBAN :");
                if (iban) {
                  const res = await fetch("/api/me", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rib: iban.replace(/\s/g, "").toUpperCase() }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                    showToast("RIB enregistr\u00e9", "success");
                  }
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 hover:border-[#D1B280] hover:text-[#D1B280] transition-colors"
            >
              {profile.rib ? "Modifier mon IBAN" : "Ajouter mon IBAN"}
            </button>
          </div>
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
