import type { Confidence, Entrant, Signal, SignalType } from "../types";

/**
 * SIMULATED radar feed. Every entrant below is fictional so no real company is
 * implied to be planning a centre. Scoring is rules-based (Radar v1).
 */
export const SIGNAL_WEIGHTS: Record<SignalType, number> = {
  "MCA incorporation": 26,
  "SEZ/STPI approval": 22,
  "State MoU": 22,
  "Real-estate LOI": 20,
  "India-head hire": 18,
  "Job-post spike": 14,
  Press: 8,
};

const CONF_FACTOR: Record<Confidence, number> = { High: 1, Medium: 0.8, Low: 0.5 };

export const SIGNAL_TYPES = Object.keys(SIGNAL_WEIGHTS) as SignalType[];

export function scoreEntrant(e: Entrant): number {
  const raw = e.signals.reduce((sum, s) => sum + SIGNAL_WEIGHTS[s.type] * CONF_FACTOR[s.conf], 0);
  return Math.min(98, Math.round(raw));
}

const sig = (
  type: SignalType,
  date: string,
  evidence: string,
  conf: Confidence,
  src: string,
): Signal => ({ type, date, evidence, conf, src });

export const ENTRANTS: Entrant[] = [
  {
    id: "nordvik",
    name: "Nordvik Energy Systems",
    hq: "Norway",
    sector: "Energy",
    likelyCity: "Pune",
    window: "Q1 2027",
    seatsEst: "400–600",
    functions: ["Engineering & R&D", "Cloud & Infrastructure"],
    signals: [
      sig("MCA incorporation", "2026-09-02", "Wholly owned subsidiary 'Nordvik Technology Services India Pvt Ltd' incorporated; registered office in Pune.", "High", "mca"),
      sig("India-head hire", "2026-09-19", "VP-level 'Head of India Operations' role filled by an ex-engineering-services leader.", "Medium", "li"),
      sig("Job-post spike", "2026-10-06", "27 new engineering and platform roles posted in 3 weeks, all Pune.", "Medium", "careers"),
      sig("Real-estate LOI", "2026-10-09", "Broker note reports an LOI for ~60k sq ft in a Hinjewadi IT park.", "Low", "broker"),
    ],
  },
  {
    id: "halcyon",
    name: "Halcyon Mutual",
    hq: "Canada",
    sector: "Insurance",
    likelyCity: "Hyderabad",
    window: "Q4 2026",
    seatsEst: "300–500",
    functions: ["Finance & Shared Services", "Risk & Compliance"],
    signals: [
      sig("State MoU", "2026-08-21", "MoU announced with the Telangana IT department at a roadshow in Toronto.", "High", "mou"),
      sig("MCA incorporation", "2026-09-11", "India entity incorporated with Hyderabad registered office.", "High", "mca"),
      sig("SEZ/STPI approval", "2026-10-02", "STPI registration application accepted for a Gachibowli address.", "Medium", "stpi"),
      sig("India-head hire", "2026-10-10", "Country head announced on LinkedIn.", "High", "li"),
    ],
  },
  {
    id: "aurelia",
    name: "Aurelia Pharma",
    hq: "Switzerland",
    sector: "Pharma & Life Sciences",
    likelyCity: "Hyderabad",
    window: "Q2 2027",
    seatsEst: "800–1,200",
    functions: ["Analytics & AI", "Risk & Compliance"],
    signals: [
      sig("Press", "2026-09-24", "CEO told analysts the group is 'evaluating a data and AI hub in Asia'.", "Low", "press"),
      sig("Job-post spike", "2026-10-08", "Data-science and regulatory-informatics roles tagged 'Hyderabad or Bengaluru'.", "Medium", "careers"),
      sig("India-head hire", "2026-10-13", "Search firm engaged for a 'Head, Global Capability Centre India'.", "Low", "li"),
    ],
  },
  {
    id: "brightwater",
    name: "Brightwater Logistics",
    hq: "Netherlands",
    sector: "Logistics",
    likelyCity: "Chennai",
    window: "Q1 2027",
    seatsEst: "250–400",
    functions: ["Product & Digital", "Finance & Shared Services"],
    signals: [
      sig("MCA incorporation", "2026-08-14", "Subsidiary incorporated with a Chennai address.", "High", "mca"),
      sig("Real-estate LOI", "2026-09-29", "Serviced-office lease for ~300 seats reported in OMR corridor.", "Medium", "broker"),
      sig("State MoU", "2026-10-01", "Listed in a Tamil Nadu Guidance investment pipeline note.", "Low", "mou"),
    ],
  },
  {
    id: "corvane",
    name: "Corvane Semiconductor",
    hq: "United States",
    sector: "Semiconductors",
    likelyCity: "Bengaluru",
    window: "Q4 2026",
    seatsEst: "600–900",
    functions: ["Engineering & R&D"],
    signals: [
      sig("SEZ/STPI approval", "2026-09-05", "SEZ unit approval notified for a Whitefield campus.", "High", "stpi"),
      sig("Real-estate LOI", "2026-09-18", "Pre-commitment for 120k sq ft reported by two brokers.", "High", "broker"),
      sig("Job-post spike", "2026-10-04", "58 silicon-design roles opened in Bengaluru in one month.", "High", "careers"),
      sig("India-head hire", "2026-10-11", "Managing director for India design centre appointed.", "High", "li"),
    ],
  },
  {
    id: "meridia",
    name: "Meridia Bank",
    hq: "Spain",
    sector: "Banking & Financial Services",
    likelyCity: "Pune",
    window: "H2 2027",
    seatsEst: "500–800",
    functions: ["Finance & Shared Services", "Risk & Compliance"],
    signals: [
      sig("Press", "2026-08-30", "Annual-results call mentions 'lower-cost delivery hubs'.", "Low", "press"),
      sig("India-head hire", "2026-09-22", "Hire of an ex-banking-GCC executive as 'India Strategy Lead'.", "Medium", "li"),
    ],
  },
  {
    id: "kaizen",
    name: "Kaizen Auto Group",
    hq: "Japan",
    sector: "Automotive",
    likelyCity: "Chennai",
    window: "Q2 2027",
    seatsEst: "500–700",
    functions: ["Engineering & R&D", "Product & Digital"],
    signals: [
      sig("State MoU", "2026-09-09", "MoU signed with Tamil Nadu for a software-defined-vehicle engineering centre.", "High", "mou"),
      sig("MCA incorporation", "2026-09-26", "Engineering services subsidiary incorporated.", "High", "mca"),
      sig("Press", "2026-10-03", "Trade press interview names Chennai as shortlist leader.", "Medium", "press"),
    ],
  },
  {
    id: "tallgrass",
    name: "Tallgrass Retail",
    hq: "United States",
    sector: "Retail",
    likelyCity: "Gurugram",
    window: "H2 2027",
    seatsEst: "300–500",
    functions: ["Product & Digital", "Analytics & AI"],
    signals: [
      sig("Job-post spike", "2026-10-01", "Merchandising-analytics roles posted with 'India' as primary location.", "Low", "careers"),
      sig("Press", "2026-10-07", "Investor-day slide references an 'offshore capability roadmap'.", "Low", "press"),
    ],
  },
  {
    id: "solvik",
    name: "Solvik Insurance",
    hq: "Sweden",
    sector: "Insurance",
    likelyCity: "Mumbai",
    window: "Q1 2027",
    seatsEst: "200–350",
    functions: ["Finance & Shared Services", "Risk & Compliance"],
    signals: [
      sig("MCA incorporation", "2026-09-15", "Private limited company incorporated; Mumbai registered office.", "High", "mca"),
      sig("State MoU", "2026-09-30", "Maharashtra GCC-policy pipeline list includes the group.", "Medium", "mou"),
      sig("Real-estate LOI", "2026-10-12", "BKC-adjacent LOI for 40k sq ft reported.", "Low", "broker"),
    ],
  },
  {
    id: "orion",
    name: "Orion Aerospace Systems",
    hq: "France",
    sector: "Aerospace & Defence",
    likelyCity: "Bengaluru",
    window: "Q2 2027",
    seatsEst: "700–1,000",
    functions: ["Engineering & R&D", "Cloud & Infrastructure"],
    signals: [
      sig("SEZ/STPI approval", "2026-08-28", "Approval for an aerospace engineering unit near Devanahalli.", "High", "stpi"),
      sig("India-head hire", "2026-09-16", "Programme director for India engineering centre hired.", "Medium", "li"),
      sig("Job-post spike", "2026-10-09", "41 systems-engineering roles posted.", "Medium", "careers"),
    ],
  },
  {
    id: "pelham",
    name: "Pelham Health",
    hq: "United States",
    sector: "Healthcare",
    likelyCity: "Hyderabad",
    window: "Q4 2026",
    seatsEst: "500–800",
    functions: ["Analytics & AI", "Finance & Shared Services"],
    signals: [
      sig("MCA incorporation", "2026-08-05", "Indian subsidiary incorporated with Hyderabad address.", "High", "mca"),
      sig("India-head hire", "2026-08-26", "Head of India announced publicly.", "High", "li"),
      sig("Real-estate LOI", "2026-09-20", "Lease for 90k sq ft in HITEC City reported by a broker.", "Medium", "broker"),
      sig("Job-post spike", "2026-10-05", "112 roles live across revenue-cycle and data engineering.", "High", "careers"),
    ],
  },
  {
    id: "westmark",
    name: "Westmark Hospitality",
    hq: "United Kingdom",
    sector: "Hospitality",
    likelyCity: "Pune",
    window: "H2 2027",
    seatsEst: "150–250",
    functions: ["Product & Digital"],
    signals: [
      sig("Press", "2026-09-12", "Group CIO says 'India is on the list' for a tech hub.", "Low", "press"),
    ],
  },
];

export const WINDOWS = ["Q4 2026", "Q1 2027", "Q2 2027", "H2 2027"];
