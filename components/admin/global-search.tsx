"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Users, ClipboardList, FileText, X } from "lucide-react";
import Link from "next/link";

interface SearchResults {
  ambassadors: { id: string; name: string; email: string; code: string }[];
  leads: { id: string; name: string; status: string; ambassador: string }[];
  contracts: { id: string; number: string; status: string; ambassador: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau", CONTACTE: "Contacté", EN_COURS: "En cours",
  SIGNE: "Signé", PERDU: "Perdu", BROUILLON: "Brouillon", PAYE: "Payé",
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const totalResults = results
    ? results.ambassadors.length + results.leads.length + results.contracts.length
    : 0;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white/60 text-sm transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Rechercher...</span>
        <kbd className="hidden sm:inline text-[10px] bg-white/10 px-1.5 py-0.5 rounded ml-2">⌘K</kbd>
      </button>

      {/* Search panel */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 sm:pt-32 px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un ambassadeur, lead, contrat..."
                className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <p className="text-sm text-gray-400 text-center py-6">Recherche...</p>
              )}

              {!loading && query.length >= 2 && totalResults === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Aucun résultat pour &quot;{query}&quot;</p>
              )}

              {results && results.ambassadors.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[10px] text-gray-400 uppercase tracking-wider font-medium bg-gray-50">
                    Ambassadeurs
                  </p>
                  {results.ambassadors.map((a) => (
                    <Link key={a.id} href={`/admin/ambassadeurs/${a.id}`} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                        <p className="text-xs text-gray-400 truncate">{a.email} · {a.code}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results && results.leads.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[10px] text-gray-400 uppercase tracking-wider font-medium bg-gray-50">
                    Recommandations
                  </p>
                  {results.leads.map((l) => (
                    <Link key={l.id} href="/admin/recommandations" onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      <ClipboardList className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{l.name}</p>
                        <p className="text-xs text-gray-400 truncate">{l.ambassador} · {STATUS_LABELS[l.status] || l.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results && results.contracts.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-[10px] text-gray-400 uppercase tracking-wider font-medium bg-gray-50">
                    Contrats
                  </p>
                  {results.contracts.map((c) => (
                    <Link key={c.id} href={`/admin/contrats/${c.id}`} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.number}</p>
                        <p className="text-xs text-gray-400 truncate">{c.ambassador} · {STATUS_LABELS[c.status] || c.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {query.length < 2 && (
              <div className="px-4 py-3 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">Tapez au moins 2 caractères</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
