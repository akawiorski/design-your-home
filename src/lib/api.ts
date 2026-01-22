import type {
  CreateRoomCommand,
  CreateRoomPhotoCommand,
  ErrorResponse,
  GenerateInspirationCommand,
  GenerateSimpleInspirationCommand,
  GenerateSimpleInspirationResponse,
  GeneratedInspirationDTO,
  GetRoomPhotosQueryParams,
  GetUploadUrlCommand,
  GetUploadUrlResponse,
  RoomDTO,
  RoomPhotoDTO,
  RoomPhotosListResponse,
  RoomTypesListResponse,
  RoomsListResponse,
  RoomWithPhotosDTO,
  TrackAnalyticsEventCommand,
  TrackAnalyticsEventResponse,
} from "@/types";

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

export const getRoom = (roomId: string) =>
  requestJson<RoomWithPhotosDTO>(
    `/api/rooms/${roomId}`,
    { method: "GET", credentials: "include" },
    "Nie udało się pobrać danych pokoju. Spróbuj ponownie."
  );

export const getRoomPhotos = (roomId: string, params?: GetRoomPhotosQueryParams) => {
  const searchParams = new URLSearchParams();
  if (params?.photoType) {
    searchParams.set("photoType", params.photoType);
  }
  const query = searchParams.toString();
  const url = query ? `/api/rooms/${roomId}/photos?${query}` : `/api/rooms/${roomId}/photos`;

  return requestJson<RoomPhotosListResponse>(
    url,
    { method: "GET", credentials: "include" },
    "Nie udało się pobrać zdjęć pokoju. Spróbuj ponownie."
  );
};

export const getUploadUrl = (roomId: string, payload: GetUploadUrlCommand) =>
  requestJson<GetUploadUrlResponse>(
    `/api/rooms/${roomId}/photos/upload-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload satisfies GetUploadUrlCommand),
    },
    "Nie udało się wygenerować linku do uploadu. Spróbuj ponownie."
  );

export const confirmPhoto = (roomId: string, payload: CreateRoomPhotoCommand) =>
  requestJson<RoomPhotoDTO>(
    `/api/rooms/${roomId}/photos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload satisfies CreateRoomPhotoCommand),
    },
    "Nie udało się zapisać zdjęcia. Spróbuj ponownie."
  );

export const generateInspiration = (roomId: string, payload: GenerateInspirationCommand) =>
  requestJson<GeneratedInspirationDTO>(
    `/api/rooms/${roomId}/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload satisfies GenerateInspirationCommand),
    },
    "Nie udało się wygenerować inspiracji. Spróbuj ponownie."
  );

export const generateSimpleInspiration = (roomId: string, payload: GenerateSimpleInspirationCommand) =>
  requestJson<GenerateSimpleInspirationResponse>(
    `/api/rooms/${roomId}/generate-simple`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload satisfies GenerateSimpleInspirationCommand),
    },
    "Nie udało się wygenerować opisu. Spróbuj ponownie."
  );

export const trackAnalyticsEvent = (payload: TrackAnalyticsEventCommand) =>
  requestJson<TrackAnalyticsEventResponse>(
    "/api/analytics/events",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload satisfies TrackAnalyticsEventCommand),
    },
    "Nie udało się zapisać zdarzenia analitycznego."
  );
