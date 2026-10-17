import type { Source } from "../types";

/** Source catalogue. URLs are only set where we reviewed the document. */
export const SOURCES: Record<string, Source> = {
  nz: { id: "nz", label: "Nasscom-Zinnov FY26", kind: "Report" },
  mca: { id: "mca", label: "MCA filings", kind: "Filing" },
  co: { id: "co", label: "Company disclosure", kind: "Filing" },
  li: { id: "li", label: "LinkedIn headcount (derived)", kind: "Derived" },
  press: { id: "press", label: "Press report", kind: "Press" },
  cbre: { id: "cbre", label: "CBRE (Aug 2026)", kind: "Report" },
  community: { id: "community", label: "Community submission", kind: "Community" },
  atlas: { id: "atlas", label: "Atlas analyst review", kind: "Derived" },
  stpi: { id: "stpi", label: "STPI / SEZ notification", kind: "Filing" },
  careers: { id: "careers", label: "Careers-page scan", kind: "Derived" },
  mou: { id: "mou", label: "State MoU announcement", kind: "Policy" },
  broker: { id: "broker", label: "Broker market note", kind: "Report" },

  kpmg_mh: {
    id: "kpmg_mh",
    label: "KPMG Flash News: Maharashtra GCC Policy 2025",
    kind: "Report",
    url: "https://www.in.kpmg.com/taxflashnews/KPMG-Flash-News-Maharshtra-GCC-policy-2025.pdf",
  },
  gt_mh: {
    id: "gt_mh",
    label: "Grant Thornton: Maharashtra GCC Policy 2025",
    kind: "Report",
    url: "https://www.grantthornton.in/globalassets/1.-member-firms/india/assets/pdfs/maharashtra-global-capability-centre-policy-2025.pdf",
  },
  elets_mh: {
    id: "elets_mh",
    label: "Elets eGov: Maharashtra GCC Policy 2025",
    kind: "Press",
    url: "https://egov.eletsonline.com/2025/10/maharashtra-unveils-gcc-policy-2025-to-attract-50600-cr-investments-and-4-lakh-jobs/",
  },
  ib_ka: {
    id: "ib_ka",
    label: "India Briefing: Karnataka GCC Policy 2024–29",
    kind: "Report",
    url: "https://india-briefing.com/news/karnataka-global-capability-center-policy-2024-2029-key-features-35441.html",
  },
  khaitan_ka: {
    id: "khaitan_ka",
    label: "Khaitan & Co: Karnataka final GCC policy",
    kind: "Report",
    url: "https://khaitanco.com/thought-leadership/Karnatakas-Final-GCC-Policy-Launched",
  },
  cam_tn: {
    id: "cam_tn",
    label: "Cyril Amarchand Mangaldas: Tamil Nadu 2030",
    kind: "Report",
    url: "https://corporate.cyrilamarchandblogs.com/2025/11/tamil-nadu-2030-the-gcc-revolution-powering-the-usd-1-trillion-economy-dream/",
  },
  icai: {
    id: "icai",
    label: "ICAI state policy digest",
    kind: "Report",
    url: "https://global.icai.org/state-policy.html",
  },
  siasat_ts: {
    id: "siasat_ts",
    label: "Siasat (citing TOI): Telangana GCC policy",
    kind: "Press",
    url: "https://www.siasat.com/new-telangana-gcc-policy-to-focus-on-ai-space-semiconductors-3543873/",
  },
  plug_ts: {
    id: "plug_ts",
    label: "Plugscale vendor guide: Hyderabad",
    kind: "Community",
    url: "https://www.plugscale.com/hyderabad-gcc-incentives-guide",
  },
  dc_ts: {
    id: "dc_ts",
    label: "Deccan Chronicle: Hyderabad GCC boom",
    kind: "Press",
    url: "https://www.deccanchronicle.com/southern-states/telangana/hyderabads-gcc-boom-gains-sharper-edge-with-sectoral-diversification-ai-push-1974733",
  },
  none: { id: "none", label: "Not found in reviewed sources", kind: "Derived" },
};

export const src = (id: string) => SOURCES[id] ?? SOURCES.atlas;
