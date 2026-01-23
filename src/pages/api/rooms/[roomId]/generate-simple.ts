import type { APIContext } from "astro";
import { z } from "zod";

import type {
  ErrorResponse,
  GenerateSimpleInspirationCommand,
  GenerateSimpleInspirationInput,
  GenerateSimpleInspirationResponse,
} from "../../../../types";
import { ValidationRules } from "../../../../types";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { getRoomWithTypeById } from "../../../../lib/services/rooms.service";
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
  description: z.string().min(1).max(ValidationRules.INSPIRATION_PROMPT_MAX_LENGTH),
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

  let body: GenerateSimpleInspirationCommand;
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

    console.info("generate.simple.request", {
      roomId,
      userId,
      descriptionLength: parsedBody.data.description.length,
    });

    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    const modelName = import.meta.env.OPENROUTER_MODEL;
    const baseUrl = import.meta.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

    if (!apiKey || !modelName) {
      return errorResponse(500, "OPENROUTER_NOT_CONFIGURED", "OpenRouter configuration is missing.");
    }

    const service = new OpenRouterService({
      apiKey,
      baseUrl,
      modelName,
      defaultParams: { temperature: 0.6, top_p: 0.9, max_tokens: 2000 },
      timeoutMs: 120_000,
    });

    const input: GenerateSimpleInspirationInput = {
      roomId,
      roomType: room.roomType.displayName,
      description: parsedBody.data.description,
    };

    const result = await service.generateSimpleAdvice(input);

    const response: GenerateSimpleInspirationResponse = {
      roomId,
      advice: result.advice,
      image: result.image,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("generate.simple failed", {
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

    return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred while generating advice.", {
      requestId,
      message,
    });
  }
}
