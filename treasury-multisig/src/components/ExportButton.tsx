// src/components/ExportButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAppStore } from "@/store";

interface ExportButtonProps {
  data: Record<string, string | number | boolean | null | undefined>[];
  filename: string;
  label?: string;
}

export function ExportButton({ data, filename, label = "Export CSV" }: ExportButtonProps) {
  const addToast = useAppStore((s) => s.addToast);

  const handleExport = () => {
    if (!data.length) {
      addToast({ type: "warning", title: "Nothing to export", message: "No data available" });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            const str: string = val == null ? "" : String(val);
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({ type: "success", title: "Exported", message: `${data.length} rows saved` });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-3 w-3 mr-1" />
      {label}
    </Button>
  );
}
