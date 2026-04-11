"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Copy, Check, X, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CsvExport } from "@/components/admin/csv-export";

type Ambassador = {
  id: string;
  code: string;
  status: string;
  notes?: string;
  createdAt: string;
  user: { id: string; name: string; email: string; phone?: string; createdAt: string };
  _count: { leads: number; contracts: number };
};

export default function AmbassadeursPage() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [newAmbInfo, setNewAmbInfo] = useState<{ email: string; tempPassword: string } | null>(null);

  const fetchAmbassadors = useCallback(async () => {
    const res = await fetch("/api/ambassadeurs");
    const data = await res.json();
    setAmbassadors(data);
  }, []);

  useEffect(() => { fetchAmbassadors(); }, [fetchAmbassadors]);

  const filtered = ambassadors.filter(
    (a) =>
      a.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.user.email.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/ambassadeurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setNewAmbInfo({ email: form.email, tempPassword: data.tempPassword });
      setForm({ name: "", email: "", phone: "", notes: "" });
      setShowForm(false);
      fetchAmbassadors();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ambassadeurs</h1>
          <p className="text-gray-500 mt-1 text-sm">{ambassadors.length} ambassadeur{ambassadors.length > 1 ? "s" : ""} enregistré{ambassadors.length > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <CsvExport
            data={filtered.map(a => ({
              nom: a.user.name,
              email: a.user.email,
              code: a.code,
              recommandations: a._count.leads,
              contrats: a._count.contracts,
              statut: a.status,
              date: a.createdAt,
            }))}
            headers={[
              { key: "nom", label: "Nom" },
              { key: "email", label: "Email" },
              { key: "code", label: "Code" },
              { key: "recommandations", label: "Recommandations" },
              { key: "contrats", label: "Contrats" },
              { key: "statut", label: "Statut" },
              { key: "date", label: "Date inscription" },
            ]}
            filename="ambassadeurs.csv"
          />
          <Button onClick={() => setShowForm(true)} className="flex-1 sm:flex-initial">
            <Plus className="w-4 h-4" /> Ajouter un ambassadeur
          </Button>
        </div>
      </div>

      {/* New ambassador credentials */}
      {newAmbInfo && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-green-800">Ambassadeur créé avec succès !</p>
            <p className="text-sm text-green-700 mt-1">
              Email : <strong>{newAmbInfo.email}</strong> · Mot de passe temporaire : <strong>{newAmbInfo.tempPassword}</strong>
            </p>
            <p className="text-xs text-green-600 mt-1">Transmettez ces informations à l&apos;ambassadeur.</p>
          </div>
          <button onClick={() => setNewAmbInfo(null)} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Nouvel ambassadeur</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Nom complet *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  label="Email *"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Textarea
                  label="Notes internes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes visibles uniquement par l'admin..."
                />
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                  <Button type="submit" loading={loading}>Créer</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          placeholder="Rechercher par nom, email ou code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun ambassadeur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500">Ambassadeur</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Code parrainage</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Recommandations</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Contrats</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Inscrit le</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((amb) => (
                    <tr key={amb.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{amb.user.name}</p>
                        <p className="text-xs text-gray-500">{amb.user.email}</p>
                        {amb.user.phone && <p className="text-xs text-gray-400">{amb.user.phone}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{amb.code}</code>
                          <button onClick={() => copyCode(amb.code)} className="text-gray-400 hover:text-gray-600">
                            {copiedId === amb.code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{amb._count.leads}</td>
                      <td className="px-6 py-4 text-gray-700">{amb._count.contracts}</td>
                      <td className="px-6 py-4">
                        <Badge className={amb.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                          {amb.status === "ACTIVE" ? "Actif" : amb.status === "INACTIVE" ? "Inactif" : "En attente"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(amb.createdAt)}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/ambassadeurs/${amb.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" /> Voir
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
