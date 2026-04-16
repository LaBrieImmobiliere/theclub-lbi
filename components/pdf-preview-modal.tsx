"use client";

import { useEffect } from "react";
import { X, Download } from "lucide-react";

interface PdfPreviewModalProps {
  /** URL du PDF à afficher (blob:, data:, http:). */
  url: string;
  /** Titre affiché dans la barre supérieure du modal. */
  title?: string;
  /** Nom du fichier quand on clique sur "Télécharger". */
  downloadName?: string;
  /** Callback fermeture. La blob URL est révoquée automatiquement par le parent. */
  onClose: () => void;
}

/**
 * Modal plein écran affichant un PDF dans un iframe.
 * Permet de prévisualiser sans forcer le téléchargement, tout en offrant
 * un bouton explicite pour télécharger si souhaité.
 */
export function PdfPreviewModal({ url, title = "Document", downloadName, onClose }: PdfPreviewModalProps) {
  // Ferme avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName || "document.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate pr-4">{title}</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-brand-deep hover:bg-brand-deep/90 transition-colors rounded"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Télécharger</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF iframe */}
      <div className="flex-1 bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <iframe
          src={url}
          title={title}
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
