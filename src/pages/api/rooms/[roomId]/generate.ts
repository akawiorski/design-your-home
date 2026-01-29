import type { APIContext } from "astro";
import { z } from "zod";

import type { GenerateInspirationCommand } from "../../../../types";
import { ValidationRules } from "../../../../types";
import { errorResponse, commonErrors } from "../../../../lib/api/response.helpers";
import { validateRoomId, validateAuth } from "../../../../lib/api/validators";
import { GenerateInspirationCommand as GenerateInspirationCmd } from "../../../../lib/commands/generate-inspiration.command";

export const prerender = false;

const bodySchema = z.object({
  prompt: z.string().max(ValidationRules.INSPIRATION_PROMPT_MAX_LENGTH).optional(),
});

export async function POST(context: APIContext) {
  const { locals, params, request } = context;
  const supabase = locals.supabase;

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
  const authValidation = validateAuth(locals.session?.user?.id || "");
  if (!authValidation.valid) {
    return authValidation.error;
  }

  // Parse and validate request body
  let body: GenerateInspirationCommand;
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
  const supabaseAdmin = locals.supabaseAdmin;
  if (!supabaseAdmin) {
    return commonErrors.supabaseNotConfigured();
  }

  const command = new GenerateInspirationCmd(
    supabase,
    supabaseAdmin,
    roomIdValidation.roomId,
    authValidation.userId,
    parsedBody.data.prompt
  );

  return command.execute();
}
