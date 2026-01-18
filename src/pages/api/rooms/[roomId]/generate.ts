import type { APIContext } from "astro";
import { z } from "zod";

import type { ErrorResponse, GenerateInspirationCommand } from "../../../../types";
import { ValidationRules } from "../../../../types";

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
  const { params, request } = context;

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

  // Uproszczenie MVP: nie zapisujemy w bazie wygenerowanych inspiracji.
  // Endpoint docelowo zwróci wyniki generacji (bullet points + 2 obrazy) w odpowiedzi.
  // TODO: implement remaining steps (auth, ownership, rate limit, AI call, optional Storage upload).
  return jsonResponse({ message: "Generation endpoint scaffolding created; implementation pending." }, 501);
}
