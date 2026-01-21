import type { RoomCardVM } from "@/components/dashboard/types";
import { RoomCard } from "@/components/dashboard/RoomCard";

export function RoomsGrid({ rooms }: { rooms: RoomCardVM[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
