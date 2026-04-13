"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
  user: { name: string; email: string; role: string };
};

export default function AdminAvisPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then(r => r.json())
      .then(data => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/admin/reviews`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved: true }),
    });
    if (res.ok) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: true } : r));
    }
  };

  const handleReject = async (id: string) => {
    const res = await fetch(`/api/admin/reviews`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setReviews(prev => prev.filter(r => r.id !== id));
    }
  };

  const filtered = reviews.filter(r => {
    if (filter === "pending") return !r.approved;
    if (filter === "approved") return r.approved;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.approved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-deep" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          <MessageSquare className="w-6 h-6 inline-block mr-2 text-brand-gold" />
          Gestion des avis
        </h1>
        <p className="text-gray-500 mt-1">
          {reviews.length} avis au total
          {pendingCount > 0 && <span className="text-amber-600 font-medium"> — {pendingCount} en attente</span>}
        </p>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "approved"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-brand-deep text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-brand-gold"
            }`}
          >
            {f === "all" ? "Tous" : f === "pending" ? `En attente (${pendingCount})` : "Approuvés"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="py-12 text-center text-gray-400">
            Aucun avis {filter === "pending" ? "en attente" : filter === "approved" ? "approuvé" : ""}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(review => (
            <Card key={review.id} className="rounded-none">
              <CardContent className="py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-brand-deep">{review.user.name || review.user.email}</span>
                      <Badge className={review.approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                        {review.approved ? "Approuvé" : "En attente"}
                      </Badge>
                      <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? "text-brand-gold fill-brand-gold" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>

                  {!review.approved && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="p-2 bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        title="Approuver"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(review.id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Supprimer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
