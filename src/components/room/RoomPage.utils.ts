import type { GeneratedInspirationDTO } from "@/types";

export const buildResultId = (result: GeneratedInspirationDTO) =>
  `${result.roomId}-${result.images[0]?.storagePath ?? "result"}`;
