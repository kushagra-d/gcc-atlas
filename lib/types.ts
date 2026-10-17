export type Confidence = "High" | "Medium" | "Low";
export type SourceKind = "Filing" | "Report" | "Press" | "Policy" | "Community" | "Derived";

export interface Source {
  id: string;
  label: string;
  kind: SourceKind;
  url?: string;
}

/** [source id, confidence] */
export type Prov = [string, Confidence];

export type HeadcountBand = "<1k" | "1k–5k" | "5k–10k" | "10k+";

export type GccFunction =
  | "Engineering & R&D"
  | "Analytics & AI"
  | "Finance & Shared Services"
  | "Risk & Compliance"
  | "Product & Digital"
  | "Cloud & Infrastructure";

export interface Gcc {
  id: string;
  name: string;
  parent: string; // HQ country
  sector: string;
  cities: string[]; // first is primary
  units: number;
  band: HeadcountBand;
  functions: GccFunction[];
  lastVerified: string; // ISO date
  prov: { location: Prov; headcount: Prov; functions: Prov };
  tag?: string; // e.g. "FY26 expansion"
  conflict?: {
    field: string;
    a: { src: string; value: string };
    b: { src: string; value: string };
    resolution: string;
  };
  origin?: "seed" | "community";
  reviewStatus?: SubmissionStatus;
}

export type SignalType =
  | "MCA incorporation"
  | "India-head hire"
  | "Job-post spike"
  | "SEZ/STPI approval"
  | "State MoU"
  | "Real-estate LOI"
  | "Press";

export interface Signal {
  type: SignalType;
  date: string;
  evidence: string;
  conf: Confidence;
  src: string;
}

export interface Entrant {
  id: string;
  name: string;
  hq: string;
  sector: string;
  likelyCity: string;
  window: string;
  seatsEst: string;
  functions: GccFunction[];
  signals: Signal[];
}

export type StateName = "Karnataka" | "Telangana" | "Maharashtra" | "Tamil Nadu";

export interface MatrixCell {
  text: string;
  conf: Confidence;
  src: string;
}

export interface MatrixRow {
  id: string;
  group: "Policy" | "Capital & property" | "Talent" | "Approvals & reach";
  label: string;
  cells: Record<StateName, MatrixCell>;
}

export type BadgeLevel = "Claimed" | "Evidenced" | "Client-verified";
export type ProviderCategory = "Legal" | "EOR / Payroll" | "Real estate" | "Recruitment";

export interface Review {
  id: string;
  author: string; // role, anonymised
  verified: boolean;
  rating: number;
  date: string;
  text: string;
  helpful: number;
  pending?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  blurb: string;
  badge: BadgeLevel;
  cities: string[];
  centresSetUp: number;
  seatsHired: number;
  daysToDay1: number; // median
  priceBand: "$" | "$$" | "$$$";
  founded: number;
  evidence: string[]; // what supports the badge
  reviews: Review[];
}

export type SubmissionType = "gcc" | "expansion" | "feedback";
export type SubmissionStatus =
  | "Ingested"
  | "Entity-resolved"
  | "Scored"
  | "In human review"
  | "Published";

export interface Submission {
  id: string;
  type: SubmissionType;
  title: string;
  createdAt: string;
  status: SubmissionStatus;
  credits: number;
  gcc?: Gcc;
  expansion?: { gccId: string; gccName: string; summary: string; city: string; seats: number };
  feedback?: { providerId: string; review: Review; days?: number; seats?: number };
}
