/**
 * Excel-friendly CSV: UTF-8 with BOM, CRLF, RFC-style quoting when needed.
 */
export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsvString(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const all = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ];
  return "\uFEFF" + all.join("\r\n");
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime: string = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}

function safeFilenamePart(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "") || "export";
}

export function timestampForFilename(): string {
  return new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
}

export function makeExportFilename(
  base: "nurses" | "employers",
  clientName: string | undefined,
): string {
  const t = timestampForFilename();
  const c = clientName ? safeFilenamePart(clientName) : "tenant";
  return `${base}-${c}-${t}.csv`;
}
