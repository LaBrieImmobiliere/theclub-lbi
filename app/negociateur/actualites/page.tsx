"use client";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, Clock } from "lucide-react";

type Broadcast = {
  id: string;
  title: string;
  content: string;
  target: string;
  sentAt: string;
  author: { name: string | null };
};

function timeAgo(d: string): string {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function NegociateurActualitesPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    const res = await fetch("/api/broadcasts");
    if (res.ok) setBroadcasts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Actualités
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Communications de l&apos;agence</p>
      </div>

      {broadcasts.length === 0 ? (
        <div className="bg-white border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Megaphone className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-1">Aucune actualité</h3>
          <p className="text-sm text-gray-400">Les messages de l&apos;agence apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b, index) => (
            <div
              key={b.id}
              className={`bg-white border shadow-sm ${
                index === 0 ? "border-[#D1B280]/40" : "border-gray-100"
              }`}
            >
              <div className="p-5 flex items-start gap-4">
                <div
                  className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${
                    index === 0 ? "bg-[#D1B280] text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">{b.title}</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap mt-1.5 leading-relaxed">
                    {b.content}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(b.sentAt)}
                    </span>
                    <span>Par {b.author.name || "La Brie Immobilière"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
