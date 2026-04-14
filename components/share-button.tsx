"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
  children?: React.ReactNode;
}

export function ShareButton({ title, text, url, className = "", children }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    haptic("light");
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* User cancelled */
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        haptic("success");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={className || "inline-flex items-center gap-2 bg-[#D1B280] text-[#030A24] px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b89a65] transition-colors min-h-[44px]"}
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {children || (copied ? "Copié !" : "Partager")}
    </button>
  );
}
