import type {
  GenerateRoomInspirationInput,
  GenerateSimpleInspirationInput,
  GenerateSimpleInspirationResponse,
  GeneratedInspirationDTO,
  OpenRouterResponseSchema,
  OpenRouterSimpleResponseSchema,
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
      images?: {
        index: number;
        type: string;
        image_url: {
          url: string;
        };
      }[];
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
    this.timeoutMs = config.timeoutMs ?? 120_000;
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

    // Convert image URLs to base64
    const roomPhotoBase64 = await this.fetchImageAsBase64(input.roomPhoto.url);
    const inspirationPhotosBase64 = await Promise.all(
      input.inspirationPhotos.map(async (photo) => ({
        base64: await this.fetchImageAsBase64(photo.url),
        description: photo.description,
      }))
    );

    const payload = {
      model: "google/gemini-2.5-flash-image",
      messages: [
        { role: "system", content: this.buildSystemMessage() },
        {
          role: "user",
          content: await this.buildUserMessageWithImages(input, roomPhotoBase64, inspirationPhotosBase64),
        },
      ],
      modalities: ["image", "text"],
      stream: false,
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
      response_format: this.buildSimpleResponseFormat(),
      stream: false,
      temperature: this.defaultParams.temperature ?? 0.7,
      top_p: this.defaultParams.top_p ?? 0.9,
      max_tokens: this.defaultParams.max_tokens ?? 600,
    };

    const response = await this.callOpenRouter(payload);
    const parsed = this.mapSimpleResponseToDto(response);

    return {
      roomId: input.roomId,
      advice: parsed.advice,
      image: {
        url: parsed.image.url,
        position: parsed.image.position,
        storagePath: parsed.image.url,
      },
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
      "przed wszystkim generujesz jedną wizualizację tego pomysłu. Ma rozdzielczość " +
      `${ValidationRules.GENERATED_IMAGE_WIDTH}×${ValidationRules.GENERATED_IMAGE_HEIGHT} ` +
      "(orientacja pionowa). Dodatkowo zwróć kilka punktów z poradami w JSON oraz wygeneruj jeden obraz."
    );
  }

  private buildSimpleSystemMessage() {
    return (
      "Jesteś asystentem projektowania wnętrz. Na podstawie opisu pomieszczenia " +
      "generujesz jedną wizualizację inspiracji oraz krótki opis porad do urządzania pokoju " +
      "w języku polskim. Obraz ma rozdzielczość " +
      `${ValidationRules.GENERATED_IMAGE_WIDTH}×${ValidationRules.GENERATED_IMAGE_HEIGHT} ` +
      "(orientacja pionowa). Zwróć wyłącznie JSON zgodny ze schematem."
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
      `${inspirationLines}${promptBlock}\n` +
      `Parametry obrazu: ${ValidationRules.GENERATED_IMAGE_WIDTH}×${ValidationRules.GENERATED_IMAGE_HEIGHT} (pionowy).`
    );
  }

  private async buildUserMessageWithImages(
    input: GenerateRoomInspirationInput,
    roomPhotoBase64: string,
    inspirationPhotosBase64: { base64: string; description?: string | null }[]
  ) {
    const content: { type: string; text?: string; image_url?: { url: string } }[] = [];

    // Add text description
    const roomDescription = input.roomPhoto.description?.trim();
    const promptBlock = input.prompt?.trim() ? `\nDodatkowy prompt: ${input.prompt.trim()}` : "";

    let textContent = `Typ pokoju: ${input.roomType}.\n`;
    textContent += `Zdjęcie pokoju${roomDescription ? `: ${roomDescription}` : ""}\n`;

    inspirationPhotosBase64.forEach((photo, index) => {
      const description = photo.description?.trim();
      textContent += `Inspiracja ${index + 1}${description ? `: ${description}` : ""}\n`;
    });

    textContent += promptBlock;
    textContent += `\nParametry obrazu: ${ValidationRules.GENERATED_IMAGE_WIDTH}×${ValidationRules.GENERATED_IMAGE_HEIGHT} (pionowy).`;
    textContent += `\nWygeneruj jedną wizualizację pomysłu urządzenia pokoju na podstawie zdjęcia pokoju i inspiracji.`;

    content.push({ type: "text", text: textContent });

    // Add room photo
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${roomPhotoBase64}` },
    });

    // Add inspiration photos
    inspirationPhotosBase64.forEach((photo) => {
      content.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${photo.base64}` },
      });
    });

    return content;
  }

  private buildSimpleUserMessage(input: GenerateSimpleInspirationInput) {
    return (
      `Typ pokoju: ${input.roomType}.\n` +
      `Opis: ${input.description.trim()}\n` +
      `Parametry obrazu: ${ValidationRules.GENERATED_IMAGE_WIDTH}×${ValidationRules.GENERATED_IMAGE_HEIGHT} (pionowy).`
    );
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
          },
          required: ["bulletPoints"],
          additionalProperties: false,
        },
      },
    };
  }

  private buildSimpleResponseFormat() {
    return {
      type: "json_schema",
      json_schema: {
        name: "RoomSimpleVisualization",
        strict: true,
        schema: {
          type: "object",
          properties: {
            advice: { type: "string" },
          },
          required: ["advice"],
          additionalProperties: false,
        },
      },
    };
  }

  private async callOpenRouter(payload: Record<string, unknown>): Promise<OpenRouterChatResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      console.info("openrouter.request", {
        model: this.modelName,
        baseUrl: this.baseUrl,
        payload,
      });

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
        const errorBody = await response.text();
        throw new Error(`OpenRouter error ${response.status}: ${errorBody}`);
      }

      const responseBody = (await response.json()) as OpenRouterChatResponse;
      console.info("openrouter.response", responseBody);
      return responseBody;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("OpenRouter request timeout.");
      }

      throw error instanceof Error ? error : new Error("OpenRouter request failed.");
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapResponseToDto(response: OpenRouterChatResponse): OpenRouterResponseSchema {
    const message = response.choices?.[0]?.message;
    const truncatedMessage = message ? this.deepTruncate(message, 100) : null;

    console.log("Mapping OpenRouter response to DTO:", truncatedMessage);

    if (!message) {
      throw new Error("OpenRouter response missing message.");
    }

    // Parse bullet points from content (if JSON string) or use empty array
    let bulletPoints: string[] = [];
    const content = message.content;

    if (content) {
      let text: string;
      if (Array.isArray(content)) {
        text = content
          .map((item) => item.text)
          .filter(Boolean)
          .join(" ");
      } else {
        text = content;
      }

      // Remove markdown code block wrapper if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }

      const parsed = this.safeParseJson(cleanedText);
      if (parsed && typeof parsed === "object") {
        // Try to get bulletPoints or porady field
        if ("bulletPoints" in parsed) {
          bulletPoints = (parsed as { bulletPoints: string[] }).bulletPoints;
        } else if ("porady" in parsed) {
          bulletPoints = (parsed as { porady: string[] }).porady;
        }
      }
    }

    // Parse images from message.images array
    if (!message.images || !Array.isArray(message.images) || message.images.length < 1) {
      throw new Error("OpenRouter response missing images array or has no images.");
    }

    const images = message.images.map((img, index) => ({
      url: img.image_url.url,
      position: (index + 1) as 1 | 2,
    }));

    return { bulletPoints, images };
  }

  private mapSimpleResponseToDto(response: OpenRouterChatResponse): OpenRouterSimpleResponseSchema {
    const message = response.choices?.[0]?.message;
    const truncatedMessage = message ? this.deepTruncate(message, 100) : null;

    console.log("Mapping OpenRouter simple response to DTO:", truncatedMessage);

    if (!message) {
      throw new Error("OpenRouter response missing message.");
    }

    // Parse advice from content (if JSON string) or use empty string
    let advice = "";
    const content = message.content;

    if (content) {
      const text = Array.isArray(content)
        ? content
            .map((item) => item.text)
            .filter(Boolean)
            .join(" ")
        : content;

      const parsed = this.safeParseJson(text);
      if (parsed && typeof parsed === "object" && "advice" in parsed) {
        advice = (parsed as { advice: string }).advice;
      } else if (typeof text === "string") {
        advice = text;
      }
    }

    // Parse image from message.images array
    if (!message.images || !Array.isArray(message.images) || message.images.length < 1) {
      throw new Error("OpenRouter response missing images array or has no images.");
    }

    const image = {
      url: message.images[0].image_url.url,
      position: 1 as const,
    };

    return { advice, image };
  }

  private safeParseJson(value: string) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private deepTruncate(obj: unknown, maxLength: number, key?: string): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === "string") {
      // If this is a "content" field, try to parse as JSON
      if (key === "content") {
        // Remove markdown code block wrapper (```json ... ```)
        let cleanedContent = obj.trim();
        if (cleanedContent.startsWith("```json")) {
          cleanedContent = cleanedContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        } else if (cleanedContent.startsWith("```")) {
          cleanedContent = cleanedContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
        }

        const parsed = this.safeParseJson(cleanedContent);
        if (parsed !== null) {
          return this.deepTruncate(parsed, maxLength);
        }
      }
      return obj.slice(0, maxLength);
    }

    if (typeof obj === "number" || typeof obj === "boolean") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepTruncate(item, maxLength));
    }

    if (typeof obj === "object") {
      return Object.fromEntries(Object.entries(obj).map(([k, value]) => [k, this.deepTruncate(value, maxLength, k)]));
    }

    return String(obj).slice(0, maxLength);
  }

  private async fetchImageAsBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return base64;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to convert image to base64: ${message}`);
    }
  }
}
