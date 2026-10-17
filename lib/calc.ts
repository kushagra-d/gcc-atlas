import type { Confidence, StateName } from "./types";
import { AS_OF, STATE_META } from "./data/incentives";

/**
 * Seat-count incentive model. It only quantifies rules that appear in the
 * reviewed sources; anything else is surfaced as "unquantified" or "not found"
 * rather than guessed. All money is in ₹ crore internally.
 */
export interface CalcInputs {
  seats: number;
  ctcLakh: number; // average annual CTC per seat, ₹ lakh
  capexPerSeatLakh: number;
  labCapexCr: number;
  skillCostPerHead: number; // ₹
  location: "metro" | "beyond";
  premises: "sez" | "public" | "private" | "other";
  stampDutyCr: number; // stamp duty payable with no waiver
  domiciledShare: number; // % of hires domiciled in the state
  seniorShare: number; // % of roles paid ≥ ₹1 lakh/month
  fortuneParent: boolean;
}

export const DEFAULT_INPUTS: CalcInputs = {
  seats: 300,
  ctcLakh: 22,
  capexPerSeatLakh: 5,
  labCapexCr: 5,
  skillCostPerHead: 60000,
  location: "metro",
  premises: "private",
  stampDutyCr: 1.2,
  domiciledShare: 60,
  seniorShare: 35,
  fortuneParent: true,
};

export type LineStatus = "modelled" | "unquantified" | "not_found" | "ineligible";

export interface Line {
  label: string;
  category: "Capital" | "Stamp duty" | "Payroll" | "Talent" | "Other";
  years: [number, number, number]; // ₹ Cr
  conf: Confidence;
  status: LineStatus;
  note: string;
  src: string;
}

export interface StateResult {
  state: StateName;
  lines: Line[];
  y1: number;
  y3: number;
  minConf: Confidence;
  capApplied: boolean;
  warnings: string[];
}

const RUPEES_PER_CR = 1e7;
const LAKH = 1e5;
const zero: [number, number, number] = [0, 0, 0];
const once = (v: number): [number, number, number] => [v, 0, 0];

const rank: Record<Confidence, number> = { High: 3, Medium: 2, Low: 1 };

export function monthsUntil(iso: string, from = AS_OF): number {
  const a = new Date(from);
  const b = new Date(iso);
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));
}

function finish(state: StateName, lines: Line[], fci: number, warnings: string[], cap = false): StateResult {
  let capApplied = false;
  let working = lines;
  if (cap) {
    const raw = lines.reduce((s, l) => s + l.years[0] + l.years[1] + l.years[2], 0);
    if (raw > fci && raw > 0) {
      const k = fci / raw;
      capApplied = true;
      working = lines.map((l) => ({ ...l, years: l.years.map((y) => y * k) as [number, number, number] }));
      warnings.push(`Combined incentives exceed 100% of fixed capital investment (₹${fci.toFixed(1)} Cr), so every line is scaled down.`);
    }
  }
  const modelled = working.filter((l) => l.status === "modelled");
  const y1 = modelled.reduce((s, l) => s + l.years[0], 0);
  const y3 = modelled.reduce((s, l) => s + l.years[0] + l.years[1] + l.years[2], 0);
  const minConf = modelled.reduce<Confidence>((m, l) => (rank[l.conf] < rank[m] ? l.conf : m), "High");
  return { state, lines: working, y1, y3, minConf: modelled.length ? minConf : "Low", capApplied, warnings };
}

export function computeAll(i: CalcInputs): Record<StateName, StateResult> {
  const fci = (i.seats * i.capexPerSeatLakh) / 100; // ₹ Cr
  const beyond = i.location === "beyond";

  // ---- Karnataka
  const kaEligible = Math.min(100, Math.ceil(0.15 * i.seats));
  const kaSkill = (kaEligible * Math.min(0.2 * i.skillCostPerHead, 36000)) / RUPEES_PER_CR;
  const kaIntern = (kaEligible * 5000 * 3) / RUPEES_PER_CR;
  const kaLab = Math.min(3, (beyond ? 0.75 : 0.4) * i.labCapexCr);
  const hireCost = (i.seats * i.ctcLakh * LAKH * 0.08) / RUPEES_PER_CR;
  const kaRecruit = beyond ? Math.min(7, hireCost * 0.5) : 0;
  const karnataka = finish(
    "Karnataka",
    [
      { label: "Skilling reimbursement", category: "Talent", years: once(kaSkill), conf: "Medium", status: "modelled", src: "ib_ka", note: `20% of cost, capped ₹36k per graduate, for ${kaEligible} staff (100 or 15% of workforce, whichever is less).` },
      { label: "Internship stipend refund", category: "Talent", years: once(kaIntern), conf: "Medium", status: "modelled", src: "ib_ka", note: `50% of stipend, ₹5k/month cap for 3 months, ${kaEligible} interns. Assumes a stipend of at least ₹10k/month.` },
      { label: "Innovation-lab capex", category: "Capital", years: once(kaLab), conf: "Medium", status: "modelled", src: "ib_ka", note: `${beyond ? "75% beyond Bengaluru" : "40% within Bengaluru"}, capped at ₹3 Cr.` },
      beyond
        ? { label: "Recruitment assistance", category: "Talent", years: once(kaRecruit), conf: "Medium", status: "modelled", src: "ib_ka", note: "50% of recruitment cost, max ₹7 Cr. Assumes recruiting costs 8% of CTC per hire." }
        : { label: "Recruitment assistance", category: "Talent", years: zero, conf: "Medium", status: "ineligible", src: "ib_ka", note: "Only for centres located beyond Bengaluru." },
      { label: "Stamp duty", category: "Stamp duty", years: zero, conf: "Low", status: "not_found", src: "none", note: "No reimbursement found in reviewed summaries. Shown as unknown, not zero." },
      { label: "Electricity duty refund", category: "Other", years: zero, conf: "Medium", status: "unquantified", src: "ib_ka", note: "Fully refunded, but depends on your consumption." },
    ],
    fci,
    [],
  );

  // ---- Telangana
  const tsPct = beyond ? 0.3 : 0.2;
  const telangana = finish(
    "Telangana",
    [
      { label: "Capital subsidy", category: "Capital", years: once(fci * tsPct), conf: "Low", status: "modelled", src: "plug_ts", note: `${tsPct * 100}% of fixed capital investment. Rate comes from a vendor guide, not a G.O. Treat as indicative.` },
      { label: "Stamp-duty reimbursement", category: "Stamp duty", years: zero, conf: "Low", status: "unquantified", src: "plug_ts", note: "Claimed, rate unpublished." },
      { label: "Employment incentive", category: "Payroll", years: zero, conf: "Low", status: "unquantified", src: "plug_ts", note: "Claimed, formula unpublished." },
    ],
    fci,
    ["Telangana's policy is reported as under revision; these numbers may change."],
  );

  // ---- Maharashtra
  const mhHeads = Math.min(100, i.seats);
  const mhPct = beyond ? 0.5 : 0.4;
  const mhPerHead = Math.min(mhPct * i.ctcLakh * LAKH, 50000);
  const mhPayroll = (mhHeads * mhPerHead) / RUPEES_PER_CR;
  const stampPct = { sez: 1, public: 0.75, private: 0.5, other: 0 }[i.premises];
  const maharashtra = finish(
    "Maharashtra",
    [
      { label: "Payroll subsidy (3 years)", category: "Payroll", years: [mhPayroll, mhPayroll, mhPayroll], conf: "Medium", status: "modelled", src: "gt_mh", note: `${mhPct * 100}% of salary (${beyond ? "Zone II" : "Zone I"}), max ₹50,000 per head, ${mhHeads} heads. Cap read as per year; confirm in the G.R.` },
      { label: "Stamp-duty exemption", category: "Stamp duty", years: once(i.stampDutyCr * stampPct), conf: "Medium", status: stampPct > 0 ? "modelled" : "ineligible", src: "kpmg_mh", note: stampPct > 0 ? `${stampPct * 100}% waiver for this premises type.` : "No waiver for premises outside SEZ/STPI or IT parks." },
      { label: "Capital / rental subsidy", category: "Capital", years: zero, conf: "Medium", status: "unquantified", src: "gt_mh", note: "Available, rate not stated in reviewed summaries." },
      { label: "Property-tax & electricity duty", category: "Other", years: zero, conf: "Medium", status: "unquantified", src: "kpmg_mh", note: "Exempt; value depends on your premises." },
    ],
    fci,
    ["Zone I/II mapping to your city is assumed from the location toggle."],
    true,
  );

  // ---- Tamil Nadu
  const tnEligible = i.seats >= 200 && i.fortuneParent;
  const tnHeads = (i.seats * (i.domiciledShare / 100) * (i.seniorShare / 100));
  const tnSalary = Math.max(i.ctcLakh, 12) * LAKH;
  const base = (tnHeads * tnSalary) / RUPEES_PER_CR;
  const tnWarn: string[] = [];
  const left = monthsUntil(STATE_META["Tamil Nadu"].validUntil!);
  tnWarn.push(`Scheme window closes 31 Mar 2027, about ${left} months from the Atlas review date. Approval timing is the main risk.`);
  if (i.seats < 200) tnWarn.push("Below the 200-direct-jobs threshold: not eligible.");
  if (!i.fortuneParent) tnWarn.push("Parent must be in Forbes Global 2000 or Fortune 1000: not eligible.");
  const tn = finish(
    "Tamil Nadu",
    [
      tnEligible
        ? { label: "Payroll subsidy (30/20/10%)", category: "Payroll", years: [base * 0.3, base * 0.2, base * 0.1], conf: "Medium", status: "modelled", src: "cam_tn", note: `~${Math.round(tnHeads)} TN-domiciled roles at ₹1 lakh/month or more. No per-head cap found.` }
        : { label: "Payroll subsidy (30/20/10%)", category: "Payroll", years: zero, conf: "Medium", status: "ineligible", src: "cam_tn", note: "Eligibility gate not met." },
      { label: "Capital subsidy", category: "Capital", years: zero, conf: "Low", status: "not_found", src: "none", note: "No GCC-specific subsidy found." },
      { label: "Stamp duty", category: "Stamp duty", years: zero, conf: "Low", status: "not_found", src: "none", note: "No GCC-specific waiver found." },
    ],
    fci,
    tnWarn,
  );

  return { Karnataka: karnataka, Telangana: telangana, Maharashtra: maharashtra, "Tamil Nadu": tn };
}

export const FX_INR_PER_USD = 88; // assumption, shown in UI

export function fmtMoney(cr: number, usd: boolean): string {
  if (usd) {
    const m = (cr * RUPEES_PER_CR) / FX_INR_PER_USD / 1e6;
    return `$${m < 10 ? m.toFixed(2) : m.toFixed(1)}M`;
  }
  return `₹${cr < 10 ? cr.toFixed(2) : cr.toFixed(1)} Cr`;
}
