"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Search, X, Eye, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { CsvExport } from "@/components/admin/csv-export";
import {
  formatDate,
  formatCurrency,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
} from "@/lib/utils";
import Link from "next/link";

type Ambassador = {
  id: string;
  user: { name: string; email: string };
};

type Contract = {
  id: string;
  number: string;
  status: string;
  commissionType: string;
  commissionValue: number;
  commissionAmount?: number;
  propertyAddress?: string;
  createdAt: string;
  ambassador: { id: string; user: { name: string; email: string } };
  lead?: { id: string; firstName: string; lastName: string } | null;
};

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "BROUILLON", label: "Brouillon" },
  { value: "ENVOYE", label: "Envoyé" },
  { value: "SIGNE", label: "Signé" },
  { value: "PAYE", label: "Payé" },
  { value: "ANNULE", label: "Annulé" },
];

export default function ContratsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-500">Chargement...</div>}>
      <ContratsPageContent />
    </Suspense>
  );
}

function ContratsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [negotiators, setNegotiators] = useState<{ id: string; name: string }[]>([]);
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);

  // Initialize filter state from URL search params
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [negotiatorFilter, setNegotiatorFilter] = useState(searchParams.get("negotiatorId") || "");
  const [agencyFilter, setAgencyFilter] = useState(searchParams.get("agencyId") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [showAdvanced, setShowAdvanced] = useState(
    !!(searchParams.get("negotiatorId") || searchParams.get("agencyId") || searchParams.get("dateFrom") || searchParams.get("dateTo"))
  );

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ambassadorId: "",
    commissionType: "PERCENTAGE",
    commissionValue: "",
    propertyAddress: "",
    propertyPrice: "",
    honoraires: "",
    notes: "",
  });

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    if (negotiatorFilter) params.set("negotiatorId", negotiatorFilter);
    if (agencyFilter) params.set("agencyId", agencyFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [search, statusFilter, negotiatorFilter, agencyFilter, dateFrom, dateTo, router]);

  const fetchContracts = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (negotiatorFilter) params.set("negotiatorId", negotiatorFilter);
    if (agencyFilter) params.set("agencyId", agencyFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const qs = params.toString();
    const res = await fetch(`/api/contrats${qs ? `?${qs}` : ""}`);
    const data = await res.json();
    setContracts(data);
  }, [statusFilter, negotiatorFilter, agencyFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    fetch("/api/ambassadeurs").then((r) => r.json()).then(setAmbassadors).catch(() => {});
    fetch("/api/admin/negociateurs-list").then((r) => r.ok ? r.json() : []).then(setNegotiators).catch(() => {});
    fetch("/api/admin/agences-list").then((r) => r.ok ? r.json() : []).then(setAgencies).catch(() => {});
  }, []);

  const resetAdvancedFilters = () => {
    setNegotiatorFilter("");
    setAgencyFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveAdvancedFilters = !!(negotiatorFilter || agencyFilter || dateFrom || dateTo);

  const filtered = contracts.filter(
    (c) =>
      c.number.toLowerCase().includes(search.toLowerCase()) ||
      c.ambassador.user.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.propertyAddress || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/contrats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        commissionValue: parseFloat(form.commissionValue),
        propertyPrice: form.propertyPrice ? parseFloat(form.propertyPrice) : null,
        honoraires: form.honoraires ? parseFloat(form.honoraires) : null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ ambassadorId: "", commissionType: "PERCENTAGE", commissionValue: "", propertyAddress: "", propertyPrice: "", honoraires: "", notes: "" });
      fetchContracts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Contrats d&apos;apporteur d&apos;affaire</h1>
          <p className="text-gray-500 mt-1 text-sm">{contracts.length} contrat{contracts.length > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <CsvExport
            data={filtered.map(c => ({
              numero: c.number,
              ambassadeur: c.ambassador?.user?.name || "",
              adresse: c.propertyAddress || "",
              commission: c.commissionAmount || 0,
              statut: c.status,
              date: c.createdAt,
            }))}
            headers={[
              { key: "numero", label: "Num\u00e9ro" },
              { key: "ambassadeur", label: "Ambassadeur" },
              { key: "adresse", label: "Adresse" },
              { key: "commission", label: "Commission" },
              { key: "statut", label: "Statut" },
              { key: "date", label: "Date" },
            ]}
            filename="contrats.csv"
          />
          <Button onClick={() => setShowForm(true)} className="flex-1 sm:flex-initial">
            <Plus className="w-4 h-4" /> Nouveau contrat
          </Button>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="font-semibold text-gray-900 dark:text-white">Nouveau contrat CAA</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreate} className="space-y-4">
                <Select
                  label="Ambassadeur *"
                  value={form.ambassadorId}
                  onChange={(e) => setForm({ ...form, ambassadorId: e.target.value })}
                  options={ambassadors.map((a) => ({ value: a.id, label: a.user.name }))}
                  placeholder="Sélectionner un ambassadeur"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Type de commission *"
                    value={form.commissionType}
                    onChange={(e) => setForm({ ...form, commissionType: e.target.value })}
                    options={[
                      { value: "PERCENTAGE", label: "Pourcentage (%)" },
                      { value: "FIXED", label: "Montant fixe (€)" },
                    ]}
                  />
                  <Input
                    label={form.commissionType === "PERCENTAGE" ? "Taux (%) *" : "Montant (€) *"}
                    type="number"
                    step="0.01"
                    value={form.commissionValue}
                    onChange={(e) => setForm({ ...form, commissionValue: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Adresse du bien"
                  value={form.propertyAddress}
                  onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })}
                  placeholder="12 rue de la Paix, 75001 Paris"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Prix du bien (€)"
                    type="number"
                    value={form.propertyPrice}
                    onChange={(e) => setForm({ ...form, propertyPrice: e.target.value })}
                  />
                  <Input
                    label="Honoraires agence (€)"
                    type="number"
                    value={form.honoraires}
                    onChange={(e) => setForm({ ...form, honoraires: e.target.value })}
                  />
                </div>
                {form.commissionType === "PERCENTAGE" && form.commissionValue && form.honoraires && (
                  <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm">
                    <span className="text-blue-700">Commission calculée : </span>
                    <strong className="text-blue-900">
                      {formatCurrency((parseFloat(form.honoraires) * parseFloat(form.commissionValue)) / 100)}
                    </strong>
                  </div>
                )}
                <Textarea
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                  <Button type="submit" loading={loading}>Créer le contrat</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Rechercher par numéro, ambassadeur, adresse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              hasActiveAdvancedFilters
                ? "border-[#D1B280] text-[#D1B280] bg-[#D1B280]/5"
                : "border-gray-300 text-gray-700 hover:border-gray-400"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres avancés
            {hasActiveAdvancedFilters && (
              <span className="bg-[#D1B280] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {[negotiatorFilter, agencyFilter, dateFrom, dateTo].filter(Boolean).length}
              </span>
            )}
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showAdvanced && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Input
                  label="Date de début"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <Input
                  label="Date de fin"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
                <Select
                  label="Négociateur"
                  value={negotiatorFilter}
                  onChange={(e) => setNegotiatorFilter(e.target.value)}
                  options={[
                    { value: "", label: "Tous les négociateurs" },
                    ...negotiators.map((n) => ({ value: n.id, label: n.name })),
                  ]}
                />
                <Select
                  label="Agence"
                  value={agencyFilter}
                  onChange={(e) => setAgencyFilter(e.target.value)}
                  options={[
                    { value: "", label: "Toutes les agences" },
                    ...agencies.map((a) => ({ value: a.id, label: a.name })),
                  ]}
                />
              </div>
              {hasActiveAdvancedFilters && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={resetAdvancedFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Réinitialiser les filtres avancés
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun contrat trouvé</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((contract) => (
              <Link key={contract.id} href={`/admin/contrats/${contract.id}`} className="block">
                <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-gray-900">{contract.number}</p>
                      {contract.lead && (
                        <p className="text-xs text-gray-500 mt-0.5">{contract.lead.firstName} {contract.lead.lastName}</p>
                      )}
                    </div>
                    <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
                      {CONTRACT_STATUS_LABELS[contract.status]}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Ambassadeur</span>
                      <span className="text-gray-900 font-medium truncate ml-2">{contract.ambassador.user.name}</span>
                    </div>
                    {contract.propertyAddress && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Bien</span>
                        <span className="text-gray-700 text-xs truncate ml-2 max-w-[60%] text-right">{contract.propertyAddress}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Commission</span>
                      <span className="font-medium" style={{ color: "#D1B280" }}>
                        {contract.commissionAmount ? formatCurrency(contract.commissionAmount) : (
                          <span className="text-gray-400">
                            {contract.commissionType === "PERCENTAGE"
                              ? `${contract.commissionValue}%`
                              : formatCurrency(contract.commissionValue)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Date</span>
                      <span className="text-gray-500 text-xs">{formatDate(contract.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-6 py-3 font-medium text-gray-500">N° Contrat</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Ambassadeur</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Bien</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Commission</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((contract) => (
                      <tr key={contract.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <p className="font-mono text-xs font-medium">{contract.number}</p>
                          {contract.lead && (
                            <p className="text-xs text-gray-500">{contract.lead.firstName} {contract.lead.lastName}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{contract.ambassador.user.name}</td>
                        <td className="px-6 py-4 text-gray-600 text-xs">{contract.propertyAddress || "-"}</td>
                        <td className="px-6 py-4 font-medium text-green-700">
                          {contract.commissionAmount ? formatCurrency(contract.commissionAmount) : (
                            <span className="text-gray-400">
                              {contract.commissionType === "PERCENTAGE"
                                ? `${contract.commissionValue}%`
                                : formatCurrency(contract.commissionValue)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
                            {CONTRACT_STATUS_LABELS[contract.status]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(contract.createdAt)}</td>
                        <td className="px-6 py-4">
                          <Link href={`/admin/contrats/${contract.id}`}>
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
