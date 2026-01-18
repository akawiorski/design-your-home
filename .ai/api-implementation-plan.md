# API Endpoint Implementation Plan: POST /api/rooms/{roomId}/generate

## 1. Przegląd punktu końcowego
- Cel: Wygenerowanie wariantu inspiracji dla wskazanego pokoju na podstawie zdjęć wejściowych i opcjonalnego promptu użytkownika.
- Efekt: Zwraca `GeneratedInspirationDTO` z bullet points i dwoma obrazami wraz z podpisanymi URL-ami.
- Reguły biznesowe: Wymaga min. 1 zdjęcia typu `room` i 2 zdjęć typu `inspiration`; zawsze tworzy 2 obrazy (position 1 i 2); opcjonalny prompt (<= 200 znaków); wymaga auth + ownership.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- URL: `/api/rooms/{roomId}/generate`
- Parametry:
  - Wymagane (path): `roomId: uuid`
  - Opcjonalne (query): brak
- Request Body (JSON):
  - `prompt?: string` (<= 200 znaków)
- Nagłówki: `Authorization: Bearer <token>` (wymagane)

## 3. Wykorzystywane typy
- Command: `GenerateInspirationCommand`
- DTO: `GeneratedInspirationDTO`, `InspirationImageDTO`, `RoomSummary`
- Enums: `PhotoType`
- Walidacja: `ValidationRules.INSPIRATION_PROMPT_MAX_LENGTH`, `MIN_ROOM_PHOTOS`, `MIN_INSPIRATION_PHOTOS`, `IMAGES_PER_INSPIRATION`, `GENERATED_IMAGE_WIDTH/HEIGHT`

## 4. Szczegóły odpowiedzi
- 201 Created – `GeneratedInspirationDTO`
- 400 Bad Request – brak wymaganych zdjęć, nieprawidłowy prompt, brak roomId, naruszenie limitów
- 402 Payment Required – brak kredytów LLM (jeśli stosowane)
- 404 Not Found – pokój nie istnieje
- 429 Too Many Requests – przekroczone limity generacji
- 500 Internal Server Error / 503 Service Unavailable – błąd AI lub storage

## 5. Przepływ danych
1) Autoryzacja: wymagane JWT (Supabase Auth). 401 gdy brak/niepoprawny.
2) Weryfikacja pokoju + ownership: SELECT room z `rooms` z filtrem po userId; 404/403 gdy brak dostępu.
3) Zlicz zdjęcia: SELECT z `room_photos` (WHERE deleted_at IS NULL) grupując po photo_type; sprawdź minima (>=1 room, >=2 inspiration). 400 przy naruszeniu.
4) Przygotuj payload do AI: signed URLs lub publiczne ścieżki zdjęć; prompt optional.
5) Wywołaj OpenRouter: oczekuj 2 obrazy (1080x720) + 4-6 bullet points.
6) Nie zapisuj wyniku generacji w Postgres.
7) Upload 2 obrazów do Storage `generated/` (lub inny prywatny bucket/prefix).
8) Wygeneruj signed URLs dla zwracanych obrazów (np. TTL 1h).
9) Zwróć DTO.

## 6. Względy bezpieczeństwa
- Auth: wymagane.
- RLS: można oprzeć się o RLS (JWT) lub service_role + jawne filtrowanie po userId.
- Rate limiting: 20 generacji/h per user.
- Walidacja wejścia: Zod (uuid roomId, prompt length, typy string).
- Storage path sanitization: nie przyjmuj ścieżek z klienta – generuj na serwerze.
- CORS: wg globalnej konfiguracji.

## 7. Obsługa błędów
- 400: brak minimalnych zdjęć, za długi prompt, niepoprawny roomId format
- 401: (nie dotyczy w tej iteracji)
- 403: (nie dotyczy w tej iteracji)
- 404: pokój nie istnieje
- 402: brak kredytów LLM (opcjonalnie)
- 429: przekroczony limit generacji
- 503: AI service unavailable lub timeout
- 500: inne błędy (Supabase, storage upload)
- Logowanie: strukturalne logi JSON (reqId, roomId, errorCode); brak dedykowanej tabeli błędów w DB

## 8. Rozważania dotyczące wydajności
- Użyj `select()` z ograniczonymi kolumnami dla pokoju i zliczeń (agregacja COUNT z filtrami)
- Batch SELECT counts w jednym zapytaniu lub dwóch COUNT FILTER zamiast wielu round-tripów
- Krótki timeout na AI call (<=30s); retry z backoff? opcjonalnie
- Signed URLs generuj tylko dla 2 obrazów

## 9. Etapy wdrożenia
1) Dodaj plik endpointu: `src/pages/api/rooms/[roomId]/generate.ts` (Astro API route, `export const prerender = false`).
2) Zdefiniuj schemat Zod dla params/query/body (uuid roomId, optional prompt <=200).
3) Pobierz supabase client z `context.locals.supabase` (service role, odpowiedni typ z `src/db/supabase.client.ts`).
4) Wymuś auth i sprawdź ownership pokoju.
5) Zlicz zdjęcia: SELECT photo_type, COUNT(*) FROM room_photos WHERE room_id = roomId AND deleted_at IS NULL GROUP BY photo_type; waliduj minima.
6) Waliduj limity generacji (rate limiter per user) – 429 w razie przekroczenia.
7) Pobierz potrzebne zdjęcia (URLs) do AI: SELECT storage_path, photo_type LIMIT wymagane; wygeneruj signed URLs do wejścia dla AI.
8) Zbuduj prompt do OpenRouter (context + opcjonalny user prompt) i wywołaj AI; obsłuż timeout/503.
9) Upload wygenerowanych obrazów do Supabase Storage (`generated/` path), uzyskaj storage_path dla obu pozycji.
10) Wygeneruj signed URLs do zwrotu; zbuduj `GeneratedInspirationDTO` i zwróć 201.
11) Testy: ścieżki happy/validation/rate limit/AI failure/storage failure.
