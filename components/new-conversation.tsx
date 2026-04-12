"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, X, MessageSquare } from "lucide-react";

interface UserResult {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  AMBASSADOR: "Ambassadeur",
  NEGOTIATOR: "Négociateur",
  ADMIN: "Admin",
};

interface Props {
  onSelect: (userId: string) => void;
}

export function NewConversationButton({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (userId: string) => {
    onSelect(userId);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="w-8 h-8 bg-[#D1B280] text-white flex items-center justify-center hover:bg-[#b89a65] transition-colors flex-shrink-0"
        title="Nouvelle conversation"
      >
        <Plus className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 shadow-xl z-50 w-[calc(100vw-2rem)] sm:w-80 max-w-sm">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="flex-1 text-sm outline-none text-gray-700 placeholder:text-gray-400"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {loading && (
              <p className="text-xs text-gray-400 text-center py-4">Recherche...</p>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Aucun utilisateur trouvé</p>
            )}

            {query.length < 2 && !loading && (
              <p className="text-xs text-gray-400 text-center py-4">Tapez au moins 2 caractères</p>
            )}

            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelect(u.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
              >
                <div className="w-8 h-8 bg-[#030A24] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(u.name || u.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name || u.email}</p>
                  <p className="text-[10px] text-gray-400">{ROLE_LABELS[u.role] || u.role}</p>
                </div>
                <MessageSquare className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
