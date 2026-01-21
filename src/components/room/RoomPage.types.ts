import type { GeneratedInspirationDTO } from "@/types";

export interface GenerationResultVM {
  id: string;
  createdAtLabel: string;
  bulletPoints: string[];
  images: { url: string; position: 1 | 2 }[];
}

export type GenerationResults = GeneratedInspirationDTO[];
