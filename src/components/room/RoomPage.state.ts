import type { GeneratedInspirationDTO } from "@/types";

export interface RoomPageState {
  results: GeneratedInspirationDTO[];
  prompt: string;
  descriptionResult: string | null;
  descriptionImageUrl: string | null;
}
