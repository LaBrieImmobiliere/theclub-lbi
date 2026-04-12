"use client";

import { useState, useEffect } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";

export default function AvisPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [existingReview, setExistingReview] = useState(false);

  useEffect(() => {
    // Check if user already left a review
    fetch("/api/me/badges").catch(() => {}); // just to check auth
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) {
      setError("Veuillez donner une note et laisser un commentaire");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("déjà")) setExistingReview(true);
        setError(data.error || "Erreur");
      } else {
        setDone(true);
      }
    } catch {
      setError("Erreur de connexion");
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Merci pour votre avis !</h2>
        <p className="text-sm text-gray-500">Votre avis sera visible sur la page d&apos;accueil apr&egrave;s validation par l&apos;&eacute;quipe.</p>
      </div>
    );
  }

  if (existingReview) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-[#D1B280]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Vous avez d&eacute;j&agrave; laiss&eacute; un avis</h2>
        <p className="text-sm text-gray-500">Merci pour votre retour !</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Donner mon avis
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Partagez votre exp&eacute;rience avec The Club
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border-l-2 border-red-500 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Star rating */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Votre note</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    i <= (hoverRating || rating)
                      ? "fill-[#D1B280] text-[#D1B280]"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {rating === 5 ? "Excellent !" : rating === 4 ? "Tr\u00e8s bien" : rating === 3 ? "Bien" : rating === 2 ? "Moyen" : "D\u00e9cevant"}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Votre commentaire</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre exp\u00e9rience..."
            rows={4}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-[#D1B280] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || rating === 0}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#030A24] text-white text-sm font-medium hover:bg-[#0f1e40] transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {loading ? "Envoi..." : "Envoyer mon avis"}
        </button>
      </form>
    </div>
  );
}
