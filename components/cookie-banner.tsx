"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-lg px-4 py-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700">
            Ce site utilise des <strong>cookies strictement n&eacute;cessaires</strong> au fonctionnement du service (authentification, session).
            Aucun cookie publicitaire ou de suivi n&apos;est utilis&eacute;.{" "}
            <Link href="/politique-confidentialite" className="text-blue-600 hover:underline">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm text-white bg-[#030A24] hover:bg-[#0f1e40] font-medium transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
