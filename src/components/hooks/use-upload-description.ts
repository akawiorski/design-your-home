import { useCallback, useState } from "react";

import type { PhotoType } from "@/types";

export interface UploadDescriptions {
  room: string;
  inspiration: string;
}

export function useUploadDescriptions() {
  const [descriptions, setDescriptions] = useState<UploadDescriptions>({ room: "", inspiration: "" });

  const setDescription = useCallback((photoType: PhotoType, value: string) => {
    setDescriptions((prev) => ({ ...prev, [photoType]: value }));
  }, []);

  return { descriptions, setDescription };
}
