"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Clock } from "lucide-react";

type Broadcast = {
  id: string;
  title: string;
  content: string;
  target: string;
  sentAt: string;
  author: { name: string | null };
};

export default function ActualitesPortailPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBroadcasts = useCallback(async () => {
    const res = await fetch("/api/broadcasts");
    if (res.ok) setBroadcasts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "A l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {"Fil d'actualité"}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {"Les dernières nouvelles de La Brie Immobilière"}
        </p>
      </div>

      {broadcasts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              {"Aucune actualité"}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {"Les actualités et communications de l'agence apparaîtront ici."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {broadcasts.map((b, index) => (
            <Card
              key={b.id}
              className={index === 0 ? "border-brand-gold/30 bg-brand-cream/30" : ""}
            >
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                      index === 0
                        ? "bg-brand-gold text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {b.title}
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap mt-2 leading-relaxed">
                      {b.content}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(b.sentAt)}
                      </span>
                      <span>Par {b.author.name || "La Brie Immobiliere"}</span>
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
