"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, Users, ClipboardList } from "lucide-react";
import { LEAD_STATUS_LABELS } from "@/lib/utils";

type SearchResults = {
  leads: { id: string; firstName: string; lastName: string; status: string; phone: string }[];
  contracts: { id: string; number: string; status: string }[];
  ambassadors: { id: string; name: string; email: string; phone: string | null }[];
};

export function GlobalSearch({ basePath }: { basePath: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navigate = (path: string) => {
    setOpen(false);
    setQuery("");
    router.push(path);
  };

  const hasResults = results && (results.leads.length > 0 || results.contracts.length > 0 || results.ambassadors.length > 0);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Rechercher...</span>
        <kbd className="hidden sm:inline text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-start justify-center pt-[15vh]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un prospect, contrat, ambassadeur..."
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5"
              >
                ESC
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">Recherche...</div>
              )}

              {!loading && query.length >= 2 && !hasResults && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">Aucun résultat</div>
              )}

              {!loading && hasResults && (
                <div className="py-2">
                  {results!.leads.length > 0 && (
                    <div>
                      <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Recommandations</p>
                      {results!.leads.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => navigate(`${basePath}/recommandations`)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                        >
                          <ClipboardList className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{l.firstName} {l.lastName}</p>
                            <p className="text-xs text-gray-400">{l.phone} · {LEAD_STATUS_LABELS[l.status] || l.status}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {results!.contracts.length > 0 && (
                    <div>
                      <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Contrats</p>
                      {results!.contracts.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => navigate(`${basePath}/contrats/${c.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                        >
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 font-mono">{c.number}</p>
                            <p className="text-xs text-gray-400">{c.status}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {results!.ambassadors.length > 0 && (
                    <div>
                      <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ambassadeurs</p>
                      {results!.ambassadors.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => navigate(`${basePath}/ambassadeurs`)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                        >
                          <Users className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                            <p className="text-xs text-gray-400">{a.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!loading && query.length < 2 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  Tapez au moins 2 caractères...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
