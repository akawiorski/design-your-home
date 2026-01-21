import type { RoomDTO } from "@/types";

export type RoomsViewState =
  | { status: "idle" | "loading" }
  | { status: "success" }
  | { status: "error"; error: { message: string; code?: string } };

export interface RoomCardVM {
  id: string;
  href: string;
  title: string;
  photoCount: RoomDTO["photoCount"];
  createdAtLabel: string;
  updatedAtLabel: string;
}

export interface RoomTypeOptionVM {
  value: number;
  label: string;
}
