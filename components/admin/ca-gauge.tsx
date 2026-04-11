"use client";

import { useEffect, useState } from "react";

interface CAGaugeProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  lightColor: string;
}

export function CAGauge({ label, value, maxValue, color, lightColor }: CAGaugeProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  const total = Math.max(maxValue, 1);
  const percent = Math.min(value / total, 1);

  const cx = 100, cy = 90, radius = 75, strokeWidth = 14;
  const semiCircumference = Math.PI * radius;
  const dash = animated ? semiCircumference * percent : 0;

  const startAngle = Math.PI, endAngle = 0;
  const x1 = cx + radius * Math.cos(startAngle), y1 = cy - radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle), y2 = cy - radius * Math.sin(endAngle);
  const arcPath = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;

  const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k\u20AC" : n + " \u20AC";

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="relative" style={{ width: 200, height: 110 }}>
        <svg width="200" height="110" viewBox="0 0 200 110">
          <path d={arcPath} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d={arcPath} fill="none" stroke={lightColor} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={`${semiCircumference} ${semiCircumference}`} />
          <path d={arcPath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={`${dash} ${semiCircumference}`} style={{ transition: "stroke-dasharray 1.2s ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
          <p className="text-xl font-bold text-gray-900">{fmt(value)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between w-full max-w-[160px] -mt-1">
        <span className="text-[10px] text-gray-400">0</span>
        <span className="text-[10px] font-medium text-gray-500">{fmt(total)}</span>
      </div>
    </div>
  );
}
