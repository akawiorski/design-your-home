import { useCallback, useMemo, useState } from "react";

import type { RoomDTO } from "@/types";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RoomsSection } from "@/components/dashboard/RoomsSection";
import { CreateRoomDialog } from "@/components/dashboard/CreateRoomDialog";
import type { RoomCardVM } from "@/components/dashboard/types";
import { useRooms } from "@/components/hooks/use-rooms";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const toRoomCardVM = (room: RoomDTO): RoomCardVM => ({
  id: room.id,
  href: `/rooms/${room.id}`,
  title: room.roomType.displayName,
  photoCount: room.photoCount,
  createdAtLabel: formatDate(room.createdAt),
  updatedAtLabel: formatDate(room.updatedAt),
});

export function DashboardPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { rooms, state: roomsState, refresh, addRoom } = useRooms();
  const roomCards = useMemo(() => rooms.map(toRoomCardVM), [rooms]);

  const handleCreated = useCallback(
    (room: RoomDTO) => {
      addRoom(room);
      window.location.href = `/rooms/${room.id}`;
    },
    [addRoom]
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <DashboardHeader onCreateClick={() => setIsCreateOpen(true)} isCreateDisabled={roomsState.status === "loading"} />

      <RoomsSection
        state={roomsState}
        rooms={roomCards}
        onRetry={refresh}
        onCreateFirstRoom={() => setIsCreateOpen(true)}
      />

      <CreateRoomDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreated={handleCreated} />
    </main>
  );
}
