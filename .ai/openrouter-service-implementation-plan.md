# Plan wdrożenia usługi OpenRouter

## 1. Opis usługi

Usługa OpenRouter odpowiada za przygotowanie wizualizacji pokoju na podstawie: (1) zdjęcia pokoju z opisem, (2) zdjęć inspiracji z opisami. Działa jako warstwa domenowa pośrednicząca między API (Astro endpoint) a OpenRouter API. Zwraca ustrukturyzowane dane odpowiedzi zgodne ze schematem JSON (response_format), tak aby frontend mógł łatwo wyświetlać wyniki.

**Kluczowe komponenty (numerowane):**

1. **Orkiestrator żądania do OpenRouter** – przygotowanie promptów i wywołanie API.
2. **Builder promptów (system + user)** – spójne formatowanie treści wejściowych (opis pokoju, inspiracje, zasady).
3. **Walidator wejścia** – weryfikacja liczby zdjęć, formatów i opisów.
4. **Mapper odpowiedzi (response_format)** – mapowanie wyniku na DTO.
5. **Obsługa błędów i retry** – klasyfikacja błędów i bezpieczne ponawianie.
6. **Konfiguracja modelu** – wybór modelu, parametry, limity.

## 2. Opis konstruktora

Usługa powinna być klasą lub modułem funkcyjnym w `src/lib/services`, przyjmującym konfigurację:

- `apiKey` (z `import.meta.env`)
- `baseUrl` (OpenRouter endpoint)
- `modelName`
- `defaultParams` (np. temperature, max_tokens, top_p)
- `timeoutMs`

**Wymagane źródła konfiguracji (Astro):**

- `import.meta.env.OPENROUTER_API_KEY`
- `import.meta.env.OPENROUTER_MODEL`
- `import.meta.env.OPENROUTER_BASE_URL` (opcjonalnie, domyślnie https://openrouter.ai/api/v1)

## 3. Publiczne metody i pola

### 3.1 `generateRoomInspiration(input: GenerateRoomInspirationInput): Promise<GeneratedInspirationDTO>`

**Wejście:**

- `roomPhoto`: { url, description }
- `inspirationPhotos`: [{ url, description }]
- `roomType`: string
- `prompt`: string (opcjonalny)

**Zadania:**

- walidacja wejścia (min 1 room photo, min 2 inspirations)
- budowa komunikatu systemowego i user
- wywołanie OpenRouter
- walidacja response_format
- mapowanie odpowiedzi do `GeneratedInspirationDTO`

### 3.2 `config` (readonly)

Dostęp do aktywnej konfiguracji (model, parametry, timeout).

## 4. Prywatne metody i pola

### 4.1 `buildSystemMessage()`

Tworzy komunikat systemowy – zasady generacji, format odpowiedzi, styl.

### 4.2 `buildUserMessage(input)`

Składa treści z opisami pokoju i inspiracji. Używa opisów i URLi zdjęć.

### 4.3 `buildResponseFormat()`

Zwraca obiekt `response_format` zgodny ze schematem JSON.

### 4.4 `callOpenRouter(payload)`

Wysyła zapytanie HTTP z timeout i podstawową obsługą błędów.

### 4.5 `mapResponseToDto(response)`

Mapuje JSON do `GeneratedInspirationDTO`.

## 5. Obsługa błędów

**Potencjalne scenariusze (numerowane):**

1. Brak klucza API – zwrócić 500 z komunikatem konfiguracyjnym.
2. Niewystarczająca liczba zdjęć – 400.
3. Timeout – 504 lub 502 z retry hint.
4. Błąd walidacji response_format – 502 (invalid model output).
5. Błąd sieci / 5xx z OpenRouter – 502.
6. Błąd autoryzacji (401/403) z OpenRouter – 502 + log diagnostyczny.
7. Przekroczony limit tokenów – 400 z sugestią skrócenia opisów.

**Zalecenia:**

- logowanie błędów z ID żądania
- brak wrażliwych danych w logach
- zwracanie przyjaznych komunikatów

## 6. Kwestie bezpieczeństwa

- Nigdy nie zwracać `OPENROUTER_API_KEY` do frontendu.
- Logi bez treści zdjęć i opisów (hash/ID zamiast payloadu).
- Walidacja wejścia (rozmiar i format opisów).
- Ograniczenie długości promptów.

## 7. Plan wdrożenia krok po kroku

### Krok 1: Konfiguracja środowiska

- Dodać zmienne środowiskowe do `.env`.
- Sprawdzić dostępność `supabaseServiceRoleKey` i `OPENROUTER_API_KEY`.

### Krok 2: Utworzenie serwisu OpenRouter

- Nowy plik: `src/lib/services/openrouter.service.ts`.
- Zaimplementować konstruktor i publiczną metodę `generateRoomInspiration`.

### Krok 3: Definicja typów wejścia/wyjścia

- Uzupełnić `src/types.ts` o:
  - `GenerateRoomInspirationInput`
  - `OpenRouterResponseSchema`

### Krok 4: Implementacja promptów

- `system`:
  1. Określić zadanie: „wygeneruj wizualizację pokoju”.
  2. Wskazać styl: neutralny, użytkowy.
  3. Wymusić strukturę JSON.
- `user`:
  1. Opis pokoju
  2. Lista inspiracji z opisami
  3. Ewentualny dodatkowy prompt użytkownika

### Krok 5: Response Format (JSON Schema)

- Używać:

```ts
{
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
              position: { type: "number", enum: [1, 2] }
            },
            required: ["url", "position"],
            additionalProperties: false
          }
        }
      },
      required: ["bulletPoints", "images"],
      additionalProperties: false
    }
  }
}
```

### Krok 6: Endpoint API

- Zaimplementować POST `/api/rooms/[roomId]/generate`:
  - weryfikacja auth i dostępu do pokoju
  - pobranie zdjęć z DB (room + inspiration)
  - złożenie danych wejściowych i wywołanie serwisu
  - zwrócenie `GeneratedInspirationDTO`

### Krok 7: Obsługa błędów i logów

- Każdy błąd z OpenRouter logować (`console.error`).
- Zwroty 4xx/5xx z jasnym komunikatem.

### Krok 8: Testy

- Unit test serwisu (mock OpenRouter API).
- Test endpointu (mock service).
- Walidacja response_format.

---

## Przykłady konfiguracji komunikatów i parametrów

### System message (1)

"Jesteś asystentem projektowania wnętrz. Na podstawie zdjęcia pokoju i inspiracji generujesz dwie wizualizacje tego samego pomysłu. Zwróć wyłącznie JSON zgodny ze schematem."

### User message (2)

"Pokój: zdjęcie=URL, opis=...\nInspiracje: [URL+opis]...\nDodatkowy prompt: ..."

### response_format (3)

Patrz sekcja Krok 5.

### Model (4)

`"openrouter/imagen-4"` (przykład) lub inny model wspierający obrazki.

### Parametry (5)

- `temperature: 0.6`
- `top_p: 0.9`
- `max_tokens: 800`
- `timeout: 30_000`
