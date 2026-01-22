import type {
  GenerateRoomInspirationInput,
  GenerateSimpleInspirationInput,
  GenerateSimpleInspirationResponse,
  GeneratedInspirationDTO,
  OpenRouterResponseSchema,
} from "../../types";
import { ValidationRules } from "../../types";

interface OpenRouterModelParams {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

interface OpenRouterServiceConfig {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  defaultParams?: OpenRouterModelParams;
  timeoutMs?: number;
}

interface OpenRouterChatResponse {
  choices?: {
    message?: {
      content?: string | { type: string; text?: string }[];
    };
  }[];
}

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly modelName: string;
  private readonly defaultParams: OpenRouterModelParams;
  private readonly timeoutMs: number;

  constructor(config: OpenRouterServiceConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.modelName = config.modelName;
    this.defaultParams = config.defaultParams ?? {};
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  public get config() {
    return {
      baseUrl: this.baseUrl,
      modelName: this.modelName,
      defaultParams: this.defaultParams,
      timeoutMs: this.timeoutMs,
    };
  }

  public async generateRoomInspiration(input: GenerateRoomInspirationInput): Promise<GeneratedInspirationDTO> {
    this.validateInput(input);

    const payload = {
      model: this.modelName,
      messages: [
        { role: "system", content: this.buildSystemMessage() },
        { role: "user", content: this.buildUserMessage(input) },
      ],
      response_format: this.buildResponseFormat(),
      temperature: this.defaultParams.temperature ?? 0.6,
      top_p: this.defaultParams.top_p ?? 0.9,
      max_tokens: this.defaultParams.max_tokens ?? 800,
    };

    const response = await this.callOpenRouter(payload);
    const parsed = this.mapResponseToDto(response);

    return {
      roomId: input.roomId,
      bulletPoints: parsed.bulletPoints,
      images: parsed.images.map((image) => ({
        url: image.url,
        position: image.position,
        storagePath: image.url,
      })),
    };
  }

  public async generateSimpleAdvice(input: GenerateSimpleInspirationInput): Promise<GenerateSimpleInspirationResponse> {
    this.validateSimpleInput(input);

    const payload = {
      model: this.modelName,
      messages: [
        { role: "system", content: this.buildSimpleSystemMessage() },
        { role: "user", content: this.buildSimpleUserMessage(input) },
      ],
      temperature: this.defaultParams.temperature ?? 0.7,
      top_p: this.defaultParams.top_p ?? 0.9,
      max_tokens: this.defaultParams.max_tokens ?? 600,
    };

    const response = await this.callOpenRouter(payload);
    const advice = this.extractTextFromResponse(response);

    return {
      roomId: input.roomId,
      advice,
    };
  }

  private validateInput(input: GenerateRoomInspirationInput) {
    if (!input.roomId) {
      throw new Error("roomId is required.");
    }

    if (!input.roomPhoto?.url) {
      throw new Error("roomPhoto.url is required.");
    }

    if (!input.inspirationPhotos || input.inspirationPhotos.length < 2) {
      throw new Error("At least two inspiration photos are required.");
    }

    const invalidInspiration = input.inspirationPhotos.find((photo) => !photo.url);
    if (invalidInspiration) {
      throw new Error("Each inspiration photo must include a url.");
    }

    if (input.prompt && input.prompt.length > ValidationRules.INSPIRATION_PROMPT_MAX_LENGTH) {
      throw new Error("Prompt exceeds maximum length.");
    }

    const roomDescription = input.roomPhoto.description ?? "";
    if (roomDescription.length > ValidationRules.PHOTO_DESCRIPTION_MAX_LENGTH) {
      throw new Error("Room photo description exceeds maximum length.");
    }

    const invalidInspirationDescription = input.inspirationPhotos.find(
      (photo) => (photo.description ?? "").length > ValidationRules.PHOTO_DESCRIPTION_MAX_LENGTH
    );

    if (invalidInspirationDescription) {
      throw new Error("Inspiration photo description exceeds maximum length.");
    }
  }

  private validateSimpleInput(input: GenerateSimpleInspirationInput) {
    if (!input.roomId) {
      throw new Error("roomId is required.");
    }

    if (!input.roomType) {
      throw new Error("roomType is required.");
    }

    if (!input.description?.trim()) {
      throw new Error("description is required.");
    }

    if (input.description.length > ValidationRules.INSPIRATION_PROMPT_MAX_LENGTH) {
      throw new Error("Description exceeds maximum length.");
    }
  }

  private buildSystemMessage() {
    return (
      "Jesteś asystentem projektowania wnętrz. Na podstawie zdjęcia pokoju i inspiracji " +
      "generujesz dwie wizualizacje tego samego pomysłu. Zwróć wyłącznie JSON zgodny ze schematem."
    );
  }

  private buildSimpleSystemMessage() {
    return (
      "Jesteś asystentem projektowania wnętrz. Na podstawie opisu pomieszczenia " +
      "zwróć krótki, konkretny opis porad do urządzania pokoju w języku polskim. " +
      "Nie zwracaj JSON, tylko czysty tekst."
    );
  }

  private buildUserMessage(input: GenerateRoomInspirationInput) {
    const inspirationLines = input.inspirationPhotos
      .map((photo, index) => {
        const description = photo.description?.trim();
        return `Inspiracja ${index + 1}: ${photo.url}${description ? ` — ${description}` : ""}`;
      })
      .join("\n");

    const roomDescription = input.roomPhoto.description?.trim();

    const promptBlock = input.prompt?.trim() ? `\nDodatkowy prompt: ${input.prompt.trim()}` : "";

    return (
      `Typ pokoju: ${input.roomType}.\n` +
      `Zdjęcie pokoju: ${input.roomPhoto.url}${roomDescription ? ` — ${roomDescription}` : ""}\n` +
      `${inspirationLines}${promptBlock}`
    );
  }

  private buildSimpleUserMessage(input: GenerateSimpleInspirationInput) {
    return `Typ pokoju: ${input.roomType}.\nOpis: ${input.description.trim()}`;
  }

  private buildResponseFormat() {
    return {
      type: "json_schema",
      json_schema: {
        name: "RoomVisualization",
        strict: true,
        schema: {
          type: "object",
          properties: {
            bulletPoints: { type: "array", items: { type: "string" } },
            images: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  position: { type: "number", enum: [1, 2] },
                },
                required: ["url", "position"],
                additionalProperties: false,
              },
            },
          },
          required: ["bulletPoints", "images"],
          additionalProperties: false,
        },
      },
    };
  }

  private async callOpenRouter(payload: Record<string, unknown>, attempt = 0): Promise<OpenRouterChatResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (this.shouldRetry(response.status) && attempt < 2) {
          await this.sleep(200 * (attempt + 1));
          return this.callOpenRouter(payload, attempt + 1);
        }

        const errorBody = await response.text();
        throw new Error(`OpenRouter error ${response.status}: ${errorBody}`);
      }

      return (await response.json()) as OpenRouterChatResponse;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (attempt < 2) {
          await this.sleep(200 * (attempt + 1));
          return this.callOpenRouter(payload, attempt + 1);
        }
        throw new Error("OpenRouter request timeout.");
      }

      throw error instanceof Error ? error : new Error("OpenRouter request failed.");
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapResponseToDto(response: OpenRouterChatResponse): OpenRouterResponseSchema {
    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenRouter response missing content.");
    }

    const text = Array.isArray(content)
      ? content
          .map((item) => item.text)
          .filter(Boolean)
          .join(" ")
      : content;

    const parsed = this.safeParseJson(text);

    if (!parsed || typeof parsed !== "object") {
      throw new Error("OpenRouter response is not valid JSON.");
    }

    const payload = parsed as OpenRouterResponseSchema;

    if (!Array.isArray(payload.bulletPoints) || !Array.isArray(payload.images)) {
      throw new Error("OpenRouter response JSON missing required fields.");
    }

    return payload;
  }

  private extractTextFromResponse(response: OpenRouterChatResponse) {
    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenRouter response missing content.");
    }

    const text = Array.isArray(content)
      ? content
          .map((item) => item.text)
          .filter(Boolean)
          .join(" ")
      : content;

    if (!text || typeof text !== "string") {
      throw new Error("OpenRouter response content is invalid.");
    }

    return text.trim();
  }

  private safeParseJson(value: string) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private shouldRetry(status: number) {
    return status === 429 || status === 502 || status === 503 || status === 504;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
