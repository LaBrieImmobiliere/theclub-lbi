"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {dark ? (
        <Sun className="w-4 h-4 text-yellow-400" />
      ) : (
        <Moon className="w-4 h-4 text-gray-500" />
      )}
    </button>
  );
}
