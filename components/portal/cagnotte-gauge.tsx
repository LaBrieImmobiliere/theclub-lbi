"use client";

import { useEffect, useState } from "react";

interface CagnotteGaugeProps {
  gainsAcquis: number;
  gainsPotentiels: number;
}

export function CagnotteGauge({ gainsAcquis, gainsPotentiels }: CagnotteGaugeProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const total = Math.max(gainsPotentiels, gainsAcquis, 1);

  // SVG arc parameters
  const cx = 140;
  const cy = 130;
  const radius = 110;
  const strokeWidth = 18;

  // Semi-circle: from 180deg to 0deg (left to right, going up)
  const startAngle = Math.PI; // 180deg
  const endAngle = 0; // 0deg

  // Calculate arc percentages
  const acquisPercent = total > 0 ? gainsAcquis / total : 0;

  // Arc path helper
  const describeArc = (startA: number, endA: number) => {
    const x1 = cx + radius * Math.cos(startA);
    const y1 = cy - radius * Math.sin(startA);
    const x2 = cx + radius * Math.cos(endA);
    const y2 = cy - radius * Math.sin(endA);
    const largeArc = Math.abs(endA - startA) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Circumference of semi-circle
  const semiCircumference = Math.PI * radius;

  // Animated stroke dash
  const acquisDash = animated ? semiCircumference * acquisPercent : 0;

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return amount.toLocaleString("fr-FR") + " \u20AC";
    }
    return amount + " \u20AC";
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-bold text-[#030A24] mb-2" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
        Ma cagnotte
      </h3>

      <div className="relative" style={{ width: 280, height: 170 }}>
        <svg width="280" height="170" viewBox="0 0 280 170">
          {/* Background track */}
          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Potentiels arc (full semi-circle, lighter color) */}
          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="#93C5FD"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${semiCircumference} ${semiCircumference}`}
            strokeDashoffset={0}
            style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
          />

          {/* Acquis arc (animated portion) */}
          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="#2563EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${acquisDash} ${semiCircumference}`}
            style={{ transition: "stroke-dasharray 1.5s ease-out" }}
          />
        </svg>

        {/* Center amount */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <p className="text-3xl font-bold text-[#030A24]" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            {formatAmount(gainsAcquis)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">acquis</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#2563EB]" />
          <span className="text-xs text-gray-600">Gains acquis</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#93C5FD]" />
          <span className="text-xs text-gray-600">Gains potentiels</span>
        </div>
      </div>

      {/* Scale */}
      <div className="flex items-center justify-between w-full max-w-[240px] mt-2">
        <span className="text-xs font-medium text-gray-500">0</span>
        <span className="text-xs font-bold text-[#030A24]">{formatAmount(total)}</span>
      </div>
    </div>
  );
}
