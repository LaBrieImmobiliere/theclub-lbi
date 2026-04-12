"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPIProps {
  label: string;
  current: number;
  previous: number;
  format?: "number" | "currency" | "percent";
}

export function KPIComparison({ label, current, previous, format = "number" }: KPIProps) {
  const diff = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  const isUp = diff > 0;
  const isDown = diff < 0;
  const isFlat = diff === 0;

  const formatValue = (v: number) => {
    if (format === "currency") return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
    if (format === "percent") return `${v}%`;
    return v.toString();
  };

  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-gray-900">{formatValue(current)}</span>
        <div className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 ${
          isUp ? "text-green-700 bg-green-50" : isDown ? "text-red-700 bg-red-50" : "text-gray-500 bg-gray-100"
        }`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {isFlat ? "=" : `${isUp ? "+" : ""}${diff}%`}
        </div>
      </div>
    </div>
  );
}
