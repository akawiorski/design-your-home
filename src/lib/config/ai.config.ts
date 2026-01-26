/**
 * AI Service configuration
 * Centralizes all AI-related constants and configuration
 */

/**
 * OpenRouter API configuration
 */
export const AI_CONFIG = {
  /**
   * Default base URL for OpenRouter API
   */
  DEFAULT_BASE_URL: "https://openrouter.ai/api/v1",

  /**
   * Model for advanced inspiration generation (with images)
   */
  INSPIRATION_MODEL: "google/gemini-2.5-flash-image",

  /**
   * Request timeout in milliseconds (2 minutes)
   */
  TIMEOUT_MS: 120_000,

  /**
   * Default generation parameters
   */
  DEFAULT_PARAMS: {
    temperature: 0.6,
    top_p: 0.9,
    max_tokens: 4000,
  },

  /**
   * Simple advice generation parameters
   */
  SIMPLE_ADVICE_PARAMS: {
    temperature: 0.6,
    top_p: 0.9,
    max_tokens: 2000,
  },
} as const;

/**
 * AI Error codes for mapping
 */
export const AI_ERROR_CODES = {
  TIMEOUT: "OPENROUTER_TIMEOUT",
  AUTH_ERROR: "OPENROUTER_AUTH_ERROR",
  RATE_LIMIT: "OPENROUTER_RATE_LIMIT",
  INVALID_RESPONSE: "OPENROUTER_RESPONSE_INVALID",
  NOT_CONFIGURED: "OPENROUTER_NOT_CONFIGURED",
} as const;
