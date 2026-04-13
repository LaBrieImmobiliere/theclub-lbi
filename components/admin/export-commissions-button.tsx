"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function ExportCommissionsButton() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const buildHref = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return `/api/export/commissions${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#D1B280]"
        placeholder="Du"
        title="Date de d\u00e9but"
      />
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#D1B280]"
        placeholder="Au"
        title="Date de fin"
      />
      <a
        href={buildHref()}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-[#D1B280] hover:underline flex items-center gap-1"
      >
        <Download className="w-3 h-3" /> Export CSV
      </a>
    </div>
  );
}
