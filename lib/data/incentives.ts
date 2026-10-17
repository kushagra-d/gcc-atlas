import type { MatrixRow, StateName } from "../types";

export const STATES: StateName[] = ["Karnataka", "Telangana", "Maharashtra", "Tamil Nadu"];

/** The date the matrix was last reviewed. Used for validity maths so output is deterministic. */
export const AS_OF = "2026-10-17";

export interface StateMeta {
  instrument: string;
  tagline: string;
  validUntil?: string; // ISO
  status: "In force" | "Draft" | "Scheme";
  hubs: string[];
  lastVerified: string;
}

export const STATE_META: Record<StateName, StateMeta> = {
  Karnataka: {
    instrument: "GCC Policy 2024–29",
    tagline: "Beyond-Bengaluru tilt, heavy on talent reimbursement",
    validUntil: "2029-03-31",
    status: "In force",
    hubs: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
    lastVerified: "2026-10-02",
  },
  Telangana: {
    instrument: "GCC policy under revision",
    tagline: "Pivoting to frontier-tech incentives; rates unconfirmed",
    status: "Draft",
    hubs: ["Hyderabad", "Warangal", "Karimnagar"],
    lastVerified: "2026-10-05",
  },
  Maharashtra: {
    instrument: "GCC Policy 2025",
    tagline: "Payroll support and location-tiered stamp duty",
    validUntil: "2030-03-31",
    status: "In force",
    hubs: ["Mumbai", "Pune", "Nashik", "Nagpur"],
    lastVerified: "2026-10-09",
  },
  "Tamil Nadu": {
    instrument: "Special Scheme to Promote GCCs",
    tagline: "Declining payroll subsidy; scheme window closes Mar 2027",
    validUntil: "2027-03-31",
    status: "Scheme",
    hubs: ["Chennai", "Coimbatore"],
    lastVerified: "2026-10-07",
  },
};

const c = (text: string, conf: "High" | "Medium" | "Low", src: string) => ({ text, conf, src });

export const MATRIX: MatrixRow[] = [
  {
    id: "instrument",
    group: "Policy",
    label: "Instrument & status",
    cells: {
      Karnataka: c("GCC Policy 2024–29, final text launched 19 Nov 2024.", "High", "khaitan_ka"),
      Telangana: c("New GCC policy in draft, shifting from broad subsidies to frontier sectors. A 2025–30 policy appears only in a vendor guide.", "Low", "siasat_ts"),
      Maharashtra: c("Maharashtra GCC Policy 2025, announced Oct 2025.", "Medium", "elets_mh"),
      "Tamil Nadu": c("No standalone GCC policy. A dedicated scheme runs 1 Apr 2024 to 31 Mar 2027 (sources also call it a 2024–27 policy).", "Medium", "cam_tn"),
    },
  },
  {
    id: "target",
    group: "Policy",
    label: "Headline target",
    cells: {
      Karnataka: c("500 new GCCs (1,000 total) by 2029; ~US$50B output and ~3.5 lakh jobs.", "Medium", "ib_ka"),
      Telangana: c("100 additional GCCs targeted this year (~1 lakh jobs); the 500-GCC mark crossed in 2025–26.", "Low", "dc_ts"),
      Maharashtra: c("~400 new GCCs, 4 lakh jobs, ₹50,600 Cr investment. CBRE cites ~200; sources disagree.", "Medium", "elets_mh"),
      "Tamil Nadu": c("No GCC-count target found in reviewed sources.", "Low", "none"),
    },
  },
  {
    id: "capital",
    group: "Capital & property",
    label: "Capital / capex subsidy",
    cells: {
      Karnataka: c("Innovation-lab capex: up to 75% (max ₹3 Cr) beyond Bengaluru, 40% within Bengaluru.", "Medium", "ib_ka"),
      Telangana: c("20–30% capital subsidy, higher for Tier-2/3. Source is a consultancy guide, not a G.O.", "Low", "plug_ts"),
      Maharashtra: c("Capital or rental subsidy available; rate not stated in reviewed summaries. Combined fiscal incentives capped at 100% of fixed capital investment.", "Medium", "gt_mh"),
      "Tamil Nadu": c("No GCC-specific capital subsidy confirmed. General industrial incentives may apply.", "Low", "none"),
    },
  },
  {
    id: "stamp",
    group: "Capital & property",
    label: "Stamp duty",
    cells: {
      Karnataka: c("No stamp-duty reimbursement mentioned in reviewed summaries.", "Low", "none"),
      Telangana: c("Stamp-duty reimbursement claimed, rate not published in the guide.", "Low", "plug_ts"),
      Maharashtra: c("Annual exemption by location: 100% SEZ/STPI, 75% public IT park, 50% private IT park.", "Medium", "kpmg_mh"),
      "Tamil Nadu": c("Not confirmed for GCCs. General industrial concessions only.", "Low", "none"),
    },
  },
  {
    id: "other_fiscal",
    group: "Capital & property",
    label: "Power, property tax, other",
    cells: {
      Karnataka: c("Electricity duty fully refunded; 50% patent-filing fee refund.", "Medium", "ib_ka"),
      Telangana: c("Electricity duty exemption claimed.", "Low", "plug_ts"),
      Maharashtra: c("Property-tax and electricity-duty exemptions; interest subsidy; industry status; additional FSI.", "Medium", "kpmg_mh"),
      "Tamil Nadu": c("None confirmed.", "Low", "none"),
    },
  },
  {
    id: "payroll",
    group: "Talent",
    label: "Payroll / employment subsidy",
    cells: {
      Karnataka: c("No payroll subsidy; recruitment assistance beyond Bengaluru (50% of cost, max ₹7 Cr).", "Medium", "ib_ka"),
      Telangana: c("Employment incentives claimed, not quantified.", "Low", "plug_ts"),
      Maharashtra: c("40% of salary (Zone I) or 50% (Zone II) for 3 years, max ₹50,000 per employee and 100 employees per GCC.", "Medium", "gt_mh"),
      "Tamil Nadu": c("30% / 20% / 10% of salary over years 1–3 for TN-domiciled roles at ₹1 lakh/month or more.", "Medium", "cam_tn"),
    },
  },
  {
    id: "skilling",
    group: "Talent",
    label: "Skilling & internships",
    cells: {
      Karnataka: c("20% of skilling cost (cap ₹36k graduate / ₹18k diploma), up to 100 staff or 15% of workforce. 50% of intern stipend, cap ₹5k/month for 3 months.", "Medium", "ib_ka"),
      Telangana: c("Not confirmed.", "Low", "none"),
      Maharashtra: c("Not confirmed in reviewed summaries.", "Low", "none"),
      "Tamil Nadu": c("Not confirmed.", "Low", "none"),
    },
  },
  {
    id: "eligibility",
    group: "Approvals & reach",
    label: "Eligibility gate",
    cells: {
      Karnataka: c("Thresholds not captured in reviewed summaries; check the policy text.", "Low", "none"),
      Telangana: c("Unknown until policy is notified.", "Low", "siasat_ts"),
      Maharashtra: c("Tiered by investment (₹50–100 Cr small, ₹100–250 Cr medium per one source). Sources differ on thresholds.", "Low", "kpmg_mh"),
      "Tamil Nadu": c("Forbes Global 2000 or Fortune 1000 parent, at least 200 direct jobs, no prior structured assistance.", "Medium", "cam_tn"),
    },
  },
  {
    id: "approvals",
    group: "Approvals & reach",
    label: "Approvals & non-fiscal",
    cells: {
      Karnataka: c("Not captured in reviewed summaries.", "Low", "none"),
      Telangana: c("Policy team is studying the Karnataka and Maharashtra models; approvals design not yet confirmed.", "Low", "siasat_ts"),
      Maharashtra: c("Industry status, priority utilities, additional FSI.", "Medium", "kpmg_mh"),
      "Tamil Nadu": c("Fast-track approval desk reported ('GCC One').", "Low", "atlas"),
    },
  },
  {
    id: "reach",
    group: "Approvals & reach",
    label: "Beyond-metro push",
    cells: {
      Karnataka: c("Higher incentives outside Bengaluru (Mysuru, Mangaluru, Hubballi cluster).", "Medium", "ib_ka"),
      Telangana: c("Highway corridors (Nizamabad, Karimnagar, Warangal) flagged for incentives.", "Low", "dc_ts"),
      Maharashtra: c("Nashik, Nagpur and Chhatrapati Sambhajinagar named as emerging hubs; Zone II pays 50%.", "Medium", "elets_mh"),
      "Tamil Nadu": c("Not confirmed.", "Low", "none"),
    },
  },
];

export const CONFLICTS: { id: string; state: StateName | "Cross-state"; title: string; detail: string; sources: string[] }[] = [
  {
    id: "mh-target",
    state: "Maharashtra",
    title: "Target: ~200 centres or ~400?",
    detail: "CBRE cites about 200 centres; policy summaries cite about 400 new GCCs and 4 lakh jobs. Atlas shows 400 as the policy figure and keeps 200 as the CBRE reading.",
    sources: ["elets_mh", "kpmg_mh"],
  },
  {
    id: "ts-status",
    state: "Telangana",
    title: "Policy status: draft or in force?",
    detail: "News reports describe a policy still being drafted. A vendor guide describes a 'Telangana GCC Policy 2025–2030' with 20–30% capital subsidy. Atlas models the vendor figures as Low confidence until a G.O. is found.",
    sources: ["siasat_ts", "plug_ts"],
  },
  {
    id: "tn-name",
    state: "Tamil Nadu",
    title: "Policy or scheme?",
    detail: "A law-firm analysis says Tamil Nadu has no standalone GCC policy, only a dedicated scheme; another source calls it the 'GCC Policy 2024–27'. The scheme window ends 31 Mar 2027.",
    sources: ["cam_tn", "icai"],
  },
  {
    id: "ka-stamp",
    state: "Karnataka",
    title: "Stamp duty: absent, or just unreported?",
    detail: "No reviewed summary lists a Karnataka stamp-duty reimbursement. Atlas shows 'not found' rather than zero.",
    sources: ["ib_ka", "khaitan_ka"],
  },
];
