import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { OpenRouterService } from "./openrouter.service";
import { ValidationRules } from "../../types";

const createService = () =>
  new OpenRouterService({
    apiKey: "test-key",
    baseUrl: "https://openrouter.ai/api/v1",
    modelName: "test-model",
  });

describe("OpenRouterService", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns mapped inspiration when response is valid", async () => {
    // Mock fetch for image downloads (arrayBuffer needed)
    fetchMock.mockImplementation(async (url: string) => {
      if (typeof url === "string" && (url.includes("room/photo") || url.includes("insp/"))) {
        return {
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(8),
        };
      }
      // Mock OpenRouter API call
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  bulletPoints: ["Test"],
                }),
                images: [
                  { index: 0, type: "url", image_url: { url: "https://img/1" } },
                  { index: 1, type: "url", image_url: { url: "https://img/2" } },
                ],
              },
            },
          ],
        }),
      };
    });

    const service = createService();

    const result = await service.generateRoomInspiration({
      roomId: "room-1",
      roomType: "Sypialnia",
      roomPhoto: { url: "https://room/photo" },
      inspirationPhotos: [{ url: "https://insp/1" }, { url: "https://insp/2" }],
    });

    expect(result.roomId).toBe("room-1");
    expect(result.bulletPoints).toEqual(["Test"]);
    expect(result.images).toHaveLength(2);
  });

  it("throws when prompt exceeds limit", async () => {
    const service = createService();

    await expect(
      service.generateRoomInspiration({
        roomId: "room-1",
        roomType: "Sypialnia",
        prompt: "x".repeat(ValidationRules.INSPIRATION_PROMPT_MAX_LENGTH + 1),
        roomPhoto: { url: "https://room/photo" },
        inspirationPhotos: [{ url: "https://insp/1" }, { url: "https://insp/2" }],
      })
    ).rejects.toThrow("Prompt exceeds maximum length.");
  });
});
