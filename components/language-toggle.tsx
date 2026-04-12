"use client";

import { useEffect, useState } from "react";
import { getLocale, setLocale, Locale } from "@/lib/i18n";

export function LanguageToggle() {
  const [locale, setLoc] = useState<Locale>("fr");

  useEffect(() => {
    setLoc(getLocale());
  }, []);

  return (
    <button
      onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
      className="px-2 py-1 text-[10px] font-bold border border-gray-300 dark:border-white/20 hover:border-[#D1B280] transition-colors uppercase tracking-wider"
      title={locale === "fr" ? "Switch to English" : "Passer en français"}
    >
      {locale === "fr" ? "EN" : "FR"}
    </button>
  );
}
