import type { StateName } from "./types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const CITY_STATE: Record<string, StateName | "Haryana" | "Uttar Pradesh"> = {
  Bengaluru: "Karnataka",
  Mysuru: "Karnataka",
  Hyderabad: "Telangana",
  Mumbai: "Maharashtra",
  Pune: "Maharashtra",
  Chennai: "Tamil Nadu",
  Coimbatore: "Tamil Nadu",
  Gurugram: "Haryana",
  Noida: "Uttar Pradesh",
};

export function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(india|pvt|ltd|private|limited|llp|inc|corp|corporation|technology|technologies|services|group|global|centre|center|gbs)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const todayIso = () => new Date().toISOString().slice(0, 10);
