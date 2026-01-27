import type { APIContext } from "astro";
import { z } from "zod";

import type { GenerateSimpleInspirationCommand } from "../../../../types";
import { ValidationRules } from "../../../../types";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { errorResponse, commonErrors } from "../../../../lib/api/response.helpers";
import { validateRoomId, validateAuth } from "../../../../lib/api/validators";
import { GenerateSimpleAdviceCommand } from "../../../../lib/commands/generate-simple-advice.command";
import logger from "../../../../lib/logger";

export const prerender = false;

const bodySchema = z.object({
  description: z.string().min(1).max(ValidationRules.INSPIRATION_PROMPT_MAX_LENGTH),
});

export async function POST(context: APIContext) {
  const { locals, params, request } = context;
  const supabase = locals.supabaseAdmin ?? locals.supabase;

  // Validate Supabase client
  if (!supabase) {
    return commonErrors.supabaseNotConfigured();
  }

  // Validate roomId
  const roomIdValidation = validateRoomId(params.roomId);
  if (!roomIdValidation.valid) {
    return roomIdValidation.error;
  }

  // Validate authentication
  const authValidation = validateAuth(locals.session?.user?.id ?? DEFAULT_USER_ID);
  if (!authValidation.valid) {
    return authValidation.error;
  }

  // Parse and validate request body
  let body: GenerateSimpleInspirationCommand;
  try {
    body = await request.json();
  } catch (error) {
    return commonErrors.invalidJson(error instanceof Error ? error : undefined);
  }

  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return errorResponse(400, "INVALID_BODY", "Request body validation failed.", {
      issues: parsedBody.error.issues,
    });
  }

  // Execute command
  const command = new GenerateSimpleAdviceCommand(
    supabase,
    roomIdValidation.roomId,
    authValidation.userId,
    parsedBody.data.description
  );

  logger.info({ url: import.meta.env.SUPABASE_URL }, "[Supabase] Sending request using URL");

  return command.execute();
}
