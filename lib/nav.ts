import type { ProviderCategory, StateName } from "./types";

export type View = "registry" | "incentives" | "providers";

export interface NavOptions {
  registryTab?: "registry" | "radar";
  state?: StateName;
  city?: string;
  category?: ProviderCategory;
}

export type Navigate = (view: View, opts?: NavOptions) => void;
