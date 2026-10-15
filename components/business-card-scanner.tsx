"use client";

/**
 * Scanner carte de visite — bouton photo qui ouvre la caméra (mobile),
 * envoie l'image au backend pour OCR Claude Vision, pré-remplit le formulaire.
 * Si l'OCR échoue ou n'est pas configuré, la photo reste affichée à côté du
 * formulaire pour saisie manuelle rapide.
 */

import { useRef, useState } from "react";
import { Camera, Loader2, X, Sparkles } from "lucide-react";

interface ScannedCard {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
}

interface Props {
  onScan: (card: ScannedCard) => void;
}

export function BusinessCardScanner({ onScan }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCamera = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    // Preview immédiat
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Conversion en base64
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      // dataURL = "data:image/jpeg;base64,XXXX"
      const [header, base64] = result.split(",");
      const mediaTypeMatch = header.match(/data:(.*);base64/);
      const mediaType = mediaTypeMatch?.[1] || "image/jpeg";

      try {
        const res = await fetch("/api/ai/ocr-business-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        });

        if (res.status === 503) {
          setError("Scan auto indisponible — recopiez les infos depuis la photo.");
        } else if (!res.ok) {
          setError("La lecture a échoué — recopiez à la main depuis la photo.");
        } else {
          const data: ScannedCard = await res.json();
          onScan(data);
          // Pas d'erreur = feedback positif implicite via champs remplis
        }
      } catch {
        setError("Problème réseau — recopiez à la main depuis la photo.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);

    // Reset input pour permettre re-sélection même fichier
    e.target.value = "";
  };

  const clear = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {!imagePreview ? (
        <button
          type="button"
          onClick={openCamera}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-[#D1B280]/60 rounded-lg text-[#030A24] font-medium hover:bg-[#D1B280]/5 transition-colors"
        >
          <Camera className="w-5 h-5" />
          Scanner une carte de visite
          <Sparkles className="w-4 h-4 text-[#D1B280]" />
        </button>
      ) : (
        <div className="relative border-2 border-[#D1B280]/40 rounded-lg overflow-hidden bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Carte de visite scannée"
            className="w-full max-h-56 object-contain"
          />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
            title="Supprimer la photo"
          >
            <X className="w-4 h-4" />
          </button>
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <Loader2 className="w-5 h-5 animate-spin" />
                Lecture de la carte…
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
