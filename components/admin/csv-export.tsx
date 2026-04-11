"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface CsvExportProps {
  data: Record<string, unknown>[];
  filename: string;
  headers: { key: string; label: string }[];
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function CsvExport({ data, filename, headers }: CsvExportProps) {
  const handleExport = () => {
    const headerRow = headers.map((h) => escapeCsvCell(h.label)).join(",");
    const rows = data.map((row) =>
      headers.map((h) => {
        const keys = h.key.split(".");
        let value: unknown = row;
        for (const k of keys) {
          value = (value as Record<string, unknown>)?.[k];
        }
        return escapeCsvCell(value);
      }).join(",")
    );

    const bom = "\uFEFF";
    const csv = bom + [headerRow, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <Download className="w-4 h-4" />
      Exporter CSV
    </Button>
  );
}
