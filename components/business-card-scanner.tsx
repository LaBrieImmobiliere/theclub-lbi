"use client";

/**
 * Scanner carte de visite — bouton photo qui ouvre la caméra (mobile),
 * OCR 100% client-side via Tesseract.js (pas de clé API, gratuit, offline).
 * Pré-remplit le formulaire avec nom/téléphone/email extraits par regex.
 * Si l'OCR échoue, la photo reste affichée pour saisie manuelle.
 */

import { useRef, useState } from "react";
import { Camera, Loader2, X, Sparkles } from "lucide-react";

interface ScannedCard {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
}

interface Props {
  onScan: (card: ScannedCard) => void;
}

// Regex utiles pour extraire les données d'une carte de visite
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+33|0033|0)\s?[1-9](?:[\s.\-/]?\d{2}){4}/;

function extractFromText(raw: string): ScannedCard {
  const text = raw.replace(/\r/g, "");

  const emailMatch = text.match(EMAIL_RE);
  const phoneMatch = text.match(PHONE_RE);

  // Nom : première ligne qui ressemble à "Prénom Nom" (2+ mots capitalisés),
  // qui n'est ni un email, ni un téléphone, ni une URL
  let firstName: string | null = null;
  let lastName: string | null = null;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 3);

  for (const line of lines) {
    if (EMAIL_RE.test(line)) continue;
    if (PHONE_RE.test(line)) continue;
    if (/https?:\/\/|www\./i.test(line)) continue;
    if (line.length > 40) continue;

    // Match "Prénom Nom" ou "Prénom NOM" (au moins 2 mots, lettres uniquement)
    const nameMatch = line.match(/^([A-ZÀ-ÿ][a-zà-ÿ'-]+)\s+([A-ZÀ-ÿ][A-ZÀ-ÿa-zà-ÿ'-]+)(?:\s+[A-ZÀ-ÿ][A-ZÀ-ÿa-zà-ÿ'-]+)?$/);
    if (nameMatch) {
      firstName = nameMatch[1];
      lastName = nameMatch[2];
      break;
    }
  }

  return {
    firstName,
    lastName,
    phone: phoneMatch?.[0]?.replace(/\s+/g, " ").trim() ?? null,
    email: emailMatch?.[0] ?? null,
  };
}

export function BusinessCardScanner({ onScan }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const openCamera = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);
    setProgress(0);

    // Preview immédiat
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    try {
      // Lazy load tesseract pour ne pas gonfler le bundle principal
      const Tesseract = (await import("tesseract.js")).default;

      const { data } = await Tesseract.recognize(file, "fra+eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const extracted = extractFromText(data.text || "");

      // Au moins un champ trouvé = succès
      if (extracted.phone || extracted.email || extracted.firstName) {
        onScan(extracted);
      } else {
        setError("Rien de lisible — recopiez à la main depuis la photo.");
      }
    } catch {
      setError("Lecture échouée — recopiez à la main depuis la photo.");
    } finally {
      setLoading(false);
      setProgress(0);
    }

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
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#D1B280]" />
              <p className="text-white text-sm font-medium">Lecture de la carte…</p>
              {progress > 0 && (
                <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D1B280] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
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
