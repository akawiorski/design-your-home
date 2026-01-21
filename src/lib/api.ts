import type { CreateRoomCommand, ErrorResponse, RoomDTO, RoomTypesListResponse, RoomsListResponse } from "@/types";

export class ApiError extends Error {
  status: number;
  code?: string;
  response?: ErrorResponse;

  constructor(message: string, options: { status: number; code?: string; response?: ErrorResponse }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.response = options.response;
  }
}

const tryParseErrorResponse = async (response: Response): Promise<ErrorResponse | null> => {
  try {
    const data = (await response.json()) as unknown;
    if (data && typeof data === "object" && "error" in data) {
      return data as ErrorResponse;
    }
    return null;
  } catch {
    return null;
  }
};

const requestJson = async <T>(input: RequestInfo | URL, init: RequestInit, defaultErrorMessage: string): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    const errorResponse = await tryParseErrorResponse(response);
    const message = errorResponse?.error.message ?? defaultErrorMessage;
    throw new ApiError(message, {
      status: response.status,
      code: errorResponse?.error.code,
      response: errorResponse ?? undefined,
    });
  }

  return (await response.json()) as T;
};

export const getRooms = () =>
  requestJson<RoomsListResponse>(
    "/api/rooms",
    { method: "GET", credentials: "include" },
    "Nie udało się pobrać pokoi. Spróbuj ponownie."
  );

export const getRoomTypes = () =>
  requestJson<RoomTypesListResponse>("/api/room-types", { method: "GET" }, "Nie udało się pobrać typów pokoi.");

export const createRoom = (payload: CreateRoomCommand) =>
  requestJson<RoomDTO>(
    "/api/rooms",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload satisfies CreateRoomCommand),
    },
    "Nie udało się utworzyć pokoju. Spróbuj ponownie."
  );
