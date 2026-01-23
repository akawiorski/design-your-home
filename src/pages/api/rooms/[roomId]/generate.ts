import type { APIContext } from "astro";
import { z } from "zod";

import type {
  ErrorResponse,
  GenerateInspirationCommand,
  GenerateRoomInspirationInput,
  GeneratedInspirationDTO,
} from "../../../../types";
import { ValidationRules } from "../../../../types";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { getRoomWithTypeById } from "../../../../lib/services/rooms.service";
import { getRoomPhotos } from "../../../../lib/services/photos.service";
import { OpenRouterService } from "../../../../lib/services/openrouter.service";

export const prerender = false;

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const errorResponse = (status: number, code: string, message: string, details?: Record<string, unknown>) => {
  const body: ErrorResponse = {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };

  return jsonResponse(body, status);
};

const paramsSchema = z.object({
  roomId: z.string().uuid(),
});

const bodySchema = z.object({
  prompt: z.string().max(ValidationRules.INSPIRATION_PROMPT_MAX_LENGTH).optional(),
});

export async function POST(context: APIContext) {
  const { locals, params, request } = context;
  const supabase = locals.supabaseAdmin ?? locals.supabase;
  const requestId = crypto.randomUUID();

  if (!supabase) {
    return errorResponse(500, "SUPABASE_NOT_CONFIGURED", "Supabase client is not configured.");
  }

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return errorResponse(400, "INVALID_PARAMS", "Invalid roomId path parameter.", {
      issues: parsedParams.error.issues,
    });
  }

  let body: GenerateInspirationCommand;
  try {
    body = await request.json();
  } catch (error) {
    return errorResponse(400, "INVALID_JSON", "Request body must be valid JSON.", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return errorResponse(400, "INVALID_BODY", "Request body validation failed.", {
      issues: parsedBody.error.issues,
    });
  }

  const userId = locals.session?.user?.id ?? DEFAULT_USER_ID;

  if (!userId) {
    return errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required to access this resource.");
  }

  const { roomId } = parsedParams.data;

  try {
    const room = await getRoomWithTypeById(supabase, roomId);

    if (!room) {
      return errorResponse(404, "NOT_FOUND", "Room not found.");
    }

    if (room.userId !== userId) {
      return errorResponse(403, "FORBIDDEN", "User does not own this room.");
    }

    const photos = await getRoomPhotos(supabase, roomId);
    const roomPhotos = photos.filter((photo) => photo.photoType === "room");
    const inspirationPhotos = photos.filter((photo) => photo.photoType === "inspiration");

    console.info("generate.inspiration.request", {
      roomId,
      userId,
      promptLength: parsedBody.data.prompt?.length ?? 0,
      roomPhotosCount: roomPhotos.length,
      inspirationPhotosCount: inspirationPhotos.length,
    });

    if (roomPhotos.length < ValidationRules.MIN_ROOM_PHOTOS) {
      return errorResponse(400, "VALIDATION_ERROR", "At least one room photo is required.", {
        current: roomPhotos.length,
        required: ValidationRules.MIN_ROOM_PHOTOS,
      });
    }

    if (inspirationPhotos.length < ValidationRules.MIN_INSPIRATION_PHOTOS) {
      return errorResponse(400, "VALIDATION_ERROR", "At least two inspiration photos are required.", {
        current: inspirationPhotos.length,
        required: ValidationRules.MIN_INSPIRATION_PHOTOS,
      });
    }

    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    const baseUrl = import.meta.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

    if (!apiKey) {
      return errorResponse(500, "OPENROUTER_NOT_CONFIGURED", "OpenRouter configuration is missing.");
    }

    const service = new OpenRouterService({
      apiKey,
      baseUrl,
      modelName: "google/gemini-2.5-flash-image", // This will be overridden in generateRoomInspiration
      defaultParams: { temperature: 0.6, top_p: 0.9, max_tokens: 4000 },
      timeoutMs: 120_000,
    });

    const input: GenerateRoomInspirationInput = {
      roomId,
      roomType: room.roomType.displayName,
      prompt: parsedBody.data.prompt,
      roomPhoto: {
        url: roomPhotos[0].url,
        description: roomPhotos[0].description,
      },
      inspirationPhotos: inspirationPhotos.map((photo) => ({
        url: photo.url,
        description: photo.description,
      })),
    };

    const result = await service.generateRoomInspiration(input);

    const response: GeneratedInspirationDTO = {
      roomId,
      bulletPoints: result.bulletPoints,
      images: result.images,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("generate.inspiration failed", {
      requestId,
      roomId: parsedParams.data.roomId,
      userId,
      message,
    });

    if (message.toLowerCase().includes("timeout")) {
      return errorResponse(504, "OPENROUTER_TIMEOUT", "OpenRouter request timed out.", { requestId, message });
    }

    if (message.includes("OpenRouter error 401") || message.includes("OpenRouter error 403")) {
      return errorResponse(502, "OPENROUTER_AUTH_ERROR", "OpenRouter authorization failed.", { requestId, message });
    }

    if (message.includes("OpenRouter error 429")) {
      return errorResponse(502, "OPENROUTER_RATE_LIMIT", "OpenRouter rate limit exceeded.", { requestId, message });
    }

    if (message.includes("OpenRouter response")) {
      return errorResponse(502, "OPENROUTER_RESPONSE_INVALID", "OpenRouter returned invalid response.", {
        requestId,
        message,
      });
    }

    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while generating inspiration.", {
      requestId,
      message,
    });
  }
}
