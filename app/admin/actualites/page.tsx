"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Megaphone,
  Send,
  Mail,
  Users,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";

type Broadcast = {
  id: string;
  title: string;
  content: string;
  target: string;
  emailSent: boolean;
  sentAt: string;
  author: { name: string | null; role: string };
};

const TARGET_OPTIONS = [
  { value: "ALL", label: "Tous (ambassadeurs + négociateurs)" },
  { value: "AMBASSADORS", label: "Ambassadeurs uniquement" },
  { value: "NEGOTIATORS", label: "Négociateurs uniquement" },
];

const TARGET_LABELS: Record<string, string> = {
  ALL: "Tous",
  AMBASSADORS: "Ambassadeurs",
  NEGOTIATORS: "Négociateurs",
};

export default function ActualitesPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ count: number } | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    target: "ALL",
    sendEmail: true,
  });

  const fetchBroadcasts = useCallback(async () => {
    const res = await fetch("/api/broadcasts");
    if (res.ok) setBroadcasts(await res.json());
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setSuccess({ count: data.recipientCount });
      setForm({ title: "", content: "", target: "ALL", sendEmail: true });
      setShowForm(false);
      fetchBroadcasts();
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {"Fil d'actualité"}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {"Communiquez avec l'ensemble de votre réseau"}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto"
        >
          <Megaphone className="w-4 h-4" /> Nouvelle publication
        </Button>
      </div>

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            Publication envoyée à <strong>{success.count} membre{success.count > 1 ? "s" : ""}</strong> avec succès !
          </p>
        </div>
      )}

      {/* New broadcast form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-brand-gold" />
                  <h2 className="font-semibold text-gray-900">
                    Nouvelle publication
                  </h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Titre *"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="Ex: Nouveau programme à Brie Comte Robert !"
                  required
                />
                <Textarea
                  label="Message *"
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  placeholder="Rédigez votre message ici...&#10;&#10;Ce message sera envoyé comme notification in-app et par email (si coché)."
                  rows={6}
                  required
                />
                <Select
                  label="Destinataires"
                  value={form.target}
                  onChange={(e) =>
                    setForm({ ...form, target: e.target.value })
                  }
                  options={TARGET_OPTIONS}
                />
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sendEmail}
                    onChange={(e) =>
                      setForm({ ...form, sendEmail: e.target.checked })
                    }
                    className="w-4 h-4 text-brand-gold border-gray-300 rounded focus:ring-brand-gold"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Envoyer aussi par email
                    </p>
                    <p className="text-xs text-gray-400">
                      Chaque destinataire recevra un email en plus de la notification
                    </p>
                  </div>
                </label>

                <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" loading={loading}>
                    <Send className="w-4 h-4" /> Publier et envoyer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Broadcasts list */}
      {broadcasts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              Aucune publication
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              {"Publiez votre première actualité pour animer votre réseau d'ambassadeurs et négociateurs."}
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Megaphone className="w-4 h-4" /> Créer ma première publication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {broadcasts.map((b) => (
            <Card key={b.id}>
              <CardContent className="py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone className="w-4 h-4 text-brand-gold flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {b.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap mt-2">
                      {b.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(b.sentAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {TARGET_LABELS[b.target] || b.target}
                      </span>
                      {b.emailSent && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Mail className="w-3 h-3" />
                          Email envoyé
                        </span>
                      )}
                      <span>
                        Par {b.author.name || "Admin"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
