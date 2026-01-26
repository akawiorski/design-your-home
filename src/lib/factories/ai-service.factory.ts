import { OpenRouterService } from "../services/openrouter.service";
import { AI_CONFIG } from "../config/ai.config";
import { errorResponse } from "../api/response.helpers";

/**
 * Create OpenRouter service instance with validation
 * @param modelName - Optional model name override
 * @returns Configured OpenRouter service
 */
export function createAIService(modelName?: string): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  const configuredModelName = modelName ?? import.meta.env.OPENROUTER_MODEL;
  const baseUrl = import.meta.env.OPENROUTER_BASE_URL ?? AI_CONFIG.DEFAULT_BASE_URL;

  if (!apiKey || !configuredModelName) {
    throw new AIConfigurationError("OpenRouter API key or model not configured");
  }

  return new OpenRouterService({
    apiKey,
    baseUrl,
    modelName: configuredModelName,
    defaultParams: AI_CONFIG.DEFAULT_PARAMS,
    timeoutMs: AI_CONFIG.TIMEOUT_MS,
  });
}

/**
 * Create service for inspiration generation (uses specific model)
 */
export function createAIServiceForInspiration(): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  const baseUrl = import.meta.env.OPENROUTER_BASE_URL ?? AI_CONFIG.DEFAULT_BASE_URL;

  if (!apiKey) {
    throw new AIConfigurationError("OpenRouter API key not configured");
  }

  return new OpenRouterService({
    apiKey,
    baseUrl,
    modelName: AI_CONFIG.INSPIRATION_MODEL,
    defaultParams: AI_CONFIG.DEFAULT_PARAMS,
    timeoutMs: AI_CONFIG.TIMEOUT_MS,
  });
}

/**
 * Create service for simple advice generation
 */
export function createAIServiceForSimpleAdvice(): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  const modelName = import.meta.env.OPENROUTER_MODEL;
  const baseUrl = import.meta.env.OPENROUTER_BASE_URL ?? AI_CONFIG.DEFAULT_BASE_URL;

  if (!apiKey || !modelName) {
    throw new AIConfigurationError("OpenRouter configuration is missing");
  }

  return new OpenRouterService({
    apiKey,
    baseUrl,
    modelName,
    defaultParams: AI_CONFIG.SIMPLE_ADVICE_PARAMS,
    timeoutMs: AI_CONFIG.TIMEOUT_MS,
  });
}

/**
 * Custom error for AI configuration issues
 */
export class AIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigurationError";
  }
}

/**
 * Map AI errors to appropriate HTTP responses
 */
export function mapAIErrorToResponse(error: unknown, requestId: string): Response {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (error instanceof AIConfigurationError) {
    return errorResponse(500, "OPENROUTER_NOT_CONFIGURED", error.message);
  }

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

  return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred.", {
    requestId,
    message,
  });
}
