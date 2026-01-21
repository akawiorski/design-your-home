# Plan implementacji widoku Pokój

## 1. Przegląd
Widok „Pokój” (`/rooms/{roomId}`) to główne miejsce pracy użytkownika w MVP: zarządzanie zdjęciami wejściowymi (2 typy: `room` i `inspiration`), prezentacja check-listy wymagań generacji oraz uruchamianie generowania inspiracji i wyświetlanie wyników (bez zapisu w DB).

Zakres MVP zgodny z PRD:
- Użytkownik musi być zalogowany (brak trybu anonimowego).
- Minimalne wymagania do generacji: ≥1 zdjęcie `room` oraz ≥2 zdjęcia `inspiration`.
- Limit łączny zdjęć w pokoju: 10.
- Generacja zwraca 2 obrazy + bullet points; wyniki są trzymane w pamięci UI.

## 2. Routing widoku
- Ścieżka: `/rooms/[roomId]`
- Implementacja routingu w Astro:
  - Utworzyć stronę: `src/pages/rooms/[roomId].astro`
  - W środku użyć istniejącego layoutu i osadzić komponent React:
    - `RoomPage` z propsem `roomId` pobranym z `Astro.params.roomId`.
  - Tryb renderowania jak na dashboardzie: `client:only="react"`.

## 3. Struktura komponentów
Proponowana struktura (feature-first):
- `src/pages/rooms/[roomId].astro` – strona Astro
- `src/components/room/RoomPage.tsx` – kontener widoku
- `src/components/room/RoomHeader.tsx`
- `src/components/room/PhotosSection.tsx`
- `src/components/room/PhotoGrid.tsx` + `src/components/room/PhotoCard.tsx`
- `src/components/room/UploadButton.tsx` (lub `UploadPhotoDialog.tsx` jeżeli dialog)
- `src/components/room/PhotoRequirementsTracker.tsx`
- `src/components/room/GenerateSection.tsx` (prompt + przycisk)
- `src/components/room/GenerationResultsList.tsx` + `GenerationResultCard.tsx`

Hooki i usługi:
- `src/components/hooks/use-room.ts` – metadane pokoju
- `src/components/hooks/use-room-photos.ts` – lista zdjęć + counts
- `src/components/hooks/use-photo-upload.ts` – flow uploadu
- `src/components/hooks/use-generate-inspiration.ts` – generacja
- Rozszerzenia `src/lib/api.ts` o brakujące wywołania

## 4. Szczegóły komponentów

### RoomPage
- Opis komponentu:
  - Kontener, który:
    - pobiera dane pokoju i zdjęć,
    - składa widok z sekcji header/photos/checklist/generation/results,
    - obsługuje stany ładowania i błędów (401/403/404/500),
    - utrzymuje stan wyników generacji w pamięci.
- Główne elementy:
  - `<main>` z logicznymi sekcjami i nagłówkami
  - `RoomHeader`
  - `PhotosSection` dla `photoType=room`
  - `PhotosSection` dla `photoType=inspiration`
  - `PhotoRequirementsTracker`
  - `GenerateSection`
  - `GenerationResultsList`
- Obsługiwane interakcje:
  - odświeżenie danych (retry)
  - upload zdjęcia (oba typy)
  - generacja
  - nawigacja (powrót do `/dashboard`)
- Walidacja:
  - `roomId` musi być UUID (frontend: szybka walidacja regexem; backend i tak waliduje)
  - „Generate” disabled dopóki counts < min
  - „Upload” disabled gdy `counts.total >= 10`
- Typy:
  - `RoomDTO` / `RoomWithPhotosDTO` (gdy endpoint istnieje)
  - `RoomPhotosListResponse`
  - lokalne VM: `RoomHeaderVM`, `PhotosSectionVM`, `PhotoRequirementsVM`, `GenerationResultVM`
- Propsy:
  - `roomId: string`

### RoomHeader
- Opis:
  - Nagłówek widoku: typ pokoju, metadane (daty), link powrotny.
- Główne elementy:
  - `<header>`
  - `<a href="/dashboard">` lub przycisk/link
  - `<h1>` z nazwą typu pokoju
  - `<dl>` z metadanymi (utworzono/zaktualizowano)
- Interakcje:
  - kliknięcie „Wróć”
- Walidacja:
  - brak
- Typy:
  - `RoomHeaderVM`
- Propsy:
  - `vm: RoomHeaderVM`

### PhotosSection
- Opis:
  - Sekcja zdjęć dla konkretnego `photoType`.
  - Pokazuje licznik `x / wymaganeMinimum` oraz „limit 10 łącznie”.
  - Renderuje mini-galerię oraz przycisk uploadu.
- Główne elementy:
  - `<section aria-labelledby=...>`
  - `<h2>` + opis
  - licznik w tekście (np. `room: 1/1`, `inspiration: 0/2`)
  - `UploadButton` (z `aria-label` zależnym od typu)
  - `PhotoGrid`
- Interakcje:
  - wybór pliku
  - retry uploadu (jeżeli błąd)
- Walidacja:
  - blokada uploadu po osiągnięciu `ValidationRules.MAX_PHOTOS_PER_ROOM`
  - walidacja typu pliku: jpg/png/heic
  - walidacja rozmiaru: ≤ `ValidationRules.MAX_FILE_SIZE_MB`
- Typy:
  - `PhotoType` (z `src/types.ts`)
  - `RoomPhotoDTO`
  - `PhotosSectionVM`
- Propsy:
  - `vm: PhotosSectionVM`
  - `onUploadRequested: (file: File, options: { photoType: PhotoType; description?: string }) => Promise<void>`
  - `onRetry?: () => void` (opcjonalnie)

### PhotoGrid / PhotoCard
- Opis:
  - `PhotoGrid` renderuje listę zdjęć.
  - `PhotoCard` pokazuje miniaturę (z `RoomPhotoDTO.url`), opis i datę.
- Główne elementy:
  - `<ul>` / `<li>`
  - `<img>` z sensownym `alt`:
    - jeżeli `description` istnieje: użyć jej
    - inaczej: np. `Zdjęcie pomieszczenia` / `Zdjęcie inspiracji`
- Interakcje (opcjonalne w MVP):
  - brak (tylko podgląd)
- Walidacja:
  - defensywnie: jeśli `url` puste → placeholder
- Typy:
  - `RoomPhotoDTO`
  - lokalny `PhotoCardVM`
- Propsy:
  - `photos: PhotoCardVM[]`

### UploadButton (i/lub UploadPhotoDialog)
- Opis:
  - Komponent wyzwalający wybór pliku.
  - Może być:
    - prosta kontrolka `<input type="file">` ukryta + przycisk,
    - lub dialog (shadcn `Dialog`) z dodatkowym polem opisu.
- Główne elementy:
  - `Button` (shadcn)
  - `<input type="file" accept="image/jpeg,image/png,image/heic">`
  - (opcjonalnie) `Dialog` z polem „Opis” (max 500)
- Interakcje:
  - onClick → otwarcie file pickera
  - onChange pliku → wywołanie upload flow
- Walidacja (frontend):
  - contentType tylko `image/jpeg|image/png|image/heic` (spójnie z API)
  - size limit: `MAX_FILE_SIZE_MB`
  - opis ≤ `PHOTO_DESCRIPTION_MAX_LENGTH`
- Typy:
  - `PhotoType`
  - `UploadIntentVM` (jeżeli potrzebne)
- Propsy:
  - `photoType: PhotoType`
  - `disabled?: boolean`
  - `onSelectFile: (file: File, description?: string) => void`

### PhotoRequirementsTracker
- Opis:
  - Checklist wymagań generacji (PRD 3.4):
    - ≥1 `room`
    - ≥2 `inspiration`
  - Wyświetla status spełnienia i krótkie wskazówki.
- Główne elementy:
  - `<section>`
  - lista wymagań (np. `<ul>`), każda pozycja z tekstem i stanem
  - `aria-live="polite"` dla dynamicznych zmian
- Interakcje:
  - brak
- Walidacja:
  - wyliczenie `isReadyToGenerate = counts.room >= 1 && counts.inspiration >= 2`
- Typy:
  - `PhotoRequirementsVM`
- Propsy:
  - `vm: PhotoRequirementsVM`

### GenerateSection
- Opis:
  - Sekcja uruchamiania generacji:
    - opcjonalne pole `prompt` (max 200)
    - przycisk „Generuj”
    - stan ładowania
- Główne elementy:
  - `<section>`
  - `<textarea>` (opcjonalne)
  - `Button` + `Spinner`
- Interakcje:
  - wpisywanie promptu
  - kliknięcie „Generuj”
- Walidacja:
  - disabled, jeśli:
    - wymagania foto niespełnione
    - trwa upload (opcjonalnie blokada)
    - trwa generacja
    - prompt > `INSPIRATION_PROMPT_MAX_LENGTH`
- Typy:
  - `GenerateInspirationCommand`
  - `GenerateViewState` (lokalny)
- Propsy:
  - `canGenerate: boolean`
  - `state: GenerateViewState`
  - `onGenerate: (payload: GenerateInspirationCommand) => Promise<void>`

### GenerationResultsList / GenerationResultCard
- Opis:
  - Lista wyników generacji (najnowsze na górze), tylko w pamięci UI.
  - Każdy wynik ma 2 obrazy i bullet points.
- Główne elementy:
  - `<section>`
  - `<ol>`/`<div>` z kartami
  - `GenerationResultCard`: obrazy + lista `<ul>` bullet points
- Interakcje (MVP):
  - brak (opcjonalnie: „Generuj kolejny wariant” to po prostu kolejne kliknięcie w `GenerateSection`)
- Walidacja:
  - defensywnie: jeśli backend zwróci mniej/więcej niż 2 obrazy → pokazać to, ale oznaczyć jako błąd danych
- Typy:
  - `GeneratedInspirationDTO`
  - lokalny `GenerationResultVM`
- Propsy:
  - `items: GenerationResultVM[]`

## 5. Typy

### DTO (istniejące – źródło: src/types.ts)
- `RoomDTO`
- `RoomWithPhotosDTO`
- `RoomPhotoDTO`
- `PhotoType`
- `RoomPhotosListResponse` (`photos` + `counts: { room, inspiration, total }`)
- `GetUploadUrlCommand` / `GetUploadUrlResponse`
- `CreateRoomPhotoCommand` (potwierdzenie uploadu)
- `GenerateInspirationCommand`
- `GeneratedInspirationDTO` / `GeneratedImageDTO`
- `ErrorResponse`

### Nowe ViewModel (proponowane)
Poniższe VM są „frontend-friendly” i pozwalają odseparować DTO od UI.

#### RoomHeaderVM
- `roomId: string`
- `title: string` (np. `room.roomType.displayName`)
- `subtitle?: string` (opcjonalnie)
- `createdAtLabel: string`
- `updatedAtLabel: string`

#### PhotoCardVM
- `id: string`
- `url: string`
- `alt: string`
- `description?: string | null`
- `createdAtLabel: string`

#### PhotosSectionVM
- `photoType: PhotoType`
- `title: string` ("Zdjęcia Twojego pomieszczenia" / "Twoje inspiracje")
- `description: string` (krótka instrukcja)
- `countLabel: string` (np. `"room: 1/1"`)
- `limitLabel: string` (np. `"Limit łącznie: 10"`)
- `photos: PhotoCardVM[]`
- `canUpload: boolean`
- `uploadDisabledReason?: string`

#### PhotoRequirementsVM
- `roomCount: number`
- `inspirationCount: number`
- `roomMin: number` (= `ValidationRules.MIN_ROOM_PHOTOS`)
- `inspirationMin: number` (= `ValidationRules.MIN_INSPIRATION_PHOTOS`)
- `isReady: boolean`

#### GenerateViewState
Union typu:
- `{ status: "idle" }`
- `{ status: "loading" }`
- `{ status: "error"; error: { message: string; code?: string } }`

#### GenerationResultVM
- `id: string` (uuid po stronie UI)
- `createdAtLabel: string`
- `bulletPoints: string[]`
- `images: Array<{ url: string; position: 1 | 2 }>`

## 6. Zarządzanie stanem

### Stan w RoomPage
Minimalny zestaw stanów:
- `roomState`:
  - `{ status: "loading" | "success" | "error" }` + `error` (podobnie jak `RoomsViewState`)
- `room: RoomDTO | null`
- `photos: RoomPhotoDTO[]` (lub `PhotoCardVM[]`)
- `counts: { room: number; inspiration: number; total: number }`
- `uploadState`:
  - per-section lub global: `{ status: "idle" | "uploading" | "error" }`
  - opcjonalnie `uploadingPhotoType: PhotoType`
- `generateState: GenerateViewState`
- `prompt: string`
- `results: GenerationResultVM[]` (najnowsze na początku)

### Hooki

#### useRoom(roomId)
Cel:
- Pobranie metadanych pokoju.

Implementacja:
- Preferowane: `GET /api/rooms/{roomId}` → `RoomWithPhotosDTO` lub `RoomDTO`.
- Fallback (jeśli endpoint nie istnieje jeszcze):
  - pobrać `GET /api/rooms` i znaleźć `roomId` po stronie klienta.

Zwraca:
- `room: RoomDTO | null`
- `state`
- `refresh()`

#### useRoomPhotos(roomId)
Cel:
- Pobranie zdjęć + counts.

Implementacja:
- `GET /api/rooms/{roomId}/photos` (bez `photoType`, bo potrzebujemy `counts.total`).
- Dodatkowo można pobierać filtrowane listy per sekcja przez `photoType` (opcjonalnie), ale najprościej w MVP:
  - pobrać całość raz i dzielić w UI na 2 listy.

Zwraca:
- `photos: RoomPhotoDTO[]`
- `counts`
- `state`
- `refresh()`

#### usePhotoUpload(roomId)
Cel:
- Obsłużyć 2-step upload:
  1) `POST /api/rooms/{roomId}/photos/upload-url`
  2) upload pliku na `uploadUrl`
  3) `POST /api/rooms/{roomId}/photos` (potwierdzenie) – o ile endpoint istnieje

Zwraca:
- `upload(file, { photoType, description? })`
- `state` (+ ewentualnie progress)

#### useGenerateInspiration(roomId)
Cel:
- Odpalić generację i zwrócić wynik do UI.

Implementacja:
- `POST /api/rooms/{roomId}/generate` z `GenerateInspirationCommand`.
- W repo endpoint zwraca obecnie `501` (scaffolding) – UI powinno pokazać czytelny komunikat, że funkcja jest chwilowo niedostępna.

Zwraca:
- `generate(payload)`
- `state`

## 7. Integracja API

### Rozszerzenia w src/lib/api.ts
Dodać funkcje (z zachowaniem wzorca `requestJson` i `ApiError`):

1) `getRoom(roomId: string)`
- `GET /api/rooms/{roomId}`
- Response: `RoomWithPhotosDTO` (docelowo)
- Fallback w hooku, jeśli endpoint nie istnieje.

2) `getRoomPhotos(roomId: string, params?: GetRoomPhotosQueryParams)`
- `GET /api/rooms/{roomId}/photos?photoType=...`
- Response: `RoomPhotosListResponse`

3) `getUploadUrl(roomId: string, payload: GetUploadUrlCommand)`
- `POST /api/rooms/{roomId}/photos/upload-url`
- Response: `GetUploadUrlResponse`

4) `confirmPhoto(roomId: string, payload: CreateRoomPhotoCommand)`
- `POST /api/rooms/{roomId}/photos`
- Response: (zgodnie z API plan – jeśli ustalone; w types brak dedykowanego response, więc można przyjąć `RoomPhotoDTO` lub `SuccessMessageResponse`)
- Uwaga: endpoint nie jest jeszcze zaimplementowany w repo.

5) `generateInspiration(roomId: string, payload: GenerateInspirationCommand)`
- `POST /api/rooms/{roomId}/generate`
- Response: docelowo `GeneratedInspirationDTO`
- Uwaga: endpoint zwraca obecnie `501`.

6) (opcjonalnie) `trackAnalyticsEvent(payload: TrackAnalyticsEventCommand)`
- `POST /api/analytics/events`
- Response: `TrackAnalyticsEventResponse`

### Upload pliku na presigned URL
- Wykonać `fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": contentType } })`.
- Obsłużyć błędy sieciowe i `!ok`.

## 8. Interakcje użytkownika

1) Wejście na `/rooms/{roomId}`
- UI pokazuje loading.
- Równolegle pobiera:
  - metadane pokoju (preferowane `GET /api/rooms/{roomId}`),
  - zdjęcia + counts (`GET /api/rooms/{roomId}/photos`).

2) Upload zdjęcia (room/inspiration)
- Użytkownik klika „Dodaj zdjęcie …” → wybiera plik.
- UI waliduje:
  - typ MIME,
  - rozmiar,
  - limit total.
- UI odpala upload flow:
  - `upload-url` → PUT na `uploadUrl` → confirm (jeśli dostępne).
- Po sukcesie:
  - toast „Dodano zdjęcie”,
  - odświeżenie `useRoomPhotos.refresh()`.

3) Wpisanie opisu zdjęcia (jeśli w MVP)
- Użytkownik uzupełnia opis w dialogu uploadu.
- Walidacja max 500 znaków.

4) Generacja
- Użytkownik klika „Generuj”.
- UI blokuje przycisk i pokazuje spinner.
- Po sukcesie:
  - prepend nowego wyniku do listy.
- Po błędzie:
  - toast + możliwość ponowienia.

5) Wygenerowanie kolejnego wariantu
- Ponowne kliknięcie „Generuj” dodaje nową kartę na górze.

## 9. Warunki i walidacja

### Warunki z PRD i API (UI-level)
- Wymagania do generacji:
  - `counts.room >= ValidationRules.MIN_ROOM_PHOTOS`
  - `counts.inspiration >= ValidationRules.MIN_INSPIRATION_PHOTOS`
- Limit zdjęć:
  - `counts.total < ValidationRules.MAX_PHOTOS_PER_ROOM` → można uploadować
  - w przeciwnym razie blokada przycisków uploadu + komunikat
- Typy plików:
  - `image/jpeg`, `image/png`, `image/heic`
- Rozmiar pliku:
  - `file.size <= MAX_FILE_SIZE_MB * 1024 * 1024`
- Prompt:
  - długość `<= INSPIRATION_PROMPT_MAX_LENGTH`

### Jak wpływają na UI
- `GenerateButton`:
  - `disabled` gdy brak wymagań lub gdy `generateState.status === "loading"`.
- `UploadButton`:
  - `disabled` gdy osiągnięty limit lub gdy upload w toku.
- `PhotoRequirementsTracker`:
  - pokazuje spełnione/niespełnione wymagania.

## 10. Obsługa błędów

### Kluczowe scenariusze
- `401` (brak autoryzacji):
  - użyć `useUnauthorizedRedirect()` (tak jak w `useRooms`).
- `404` (pokój nie istnieje lub brak dostępu – backend zwraca 404 dla security):
  - ekran/sekcja „Nie znaleziono pokoju” + link do `/dashboard`.
- `403` (jeśli endpoint kiedykolwiek zwróci):
  - ekran „Brak dostępu” + link do dashboardu.
- `413` z upload-url:
  - toast „Osiągnięto limit 10 zdjęć”.
- Błąd uploadu do storage:
  - toast + możliwość retry (przez ponowny wybór pliku lub przycisk „Spróbuj ponownie”).
- `501` z generate endpointu (aktualny stan repo):
  - czytelny toast/inline: „Generowanie jest chwilowo niedostępne (MVP: w trakcie implementacji).”

### Standard komunikatów
- Używać istniejącego `toast` (`src/components/ui/use-toast`) z `variant: "destructive"` dla błędów.
- Unikać pokazywania surowych stack trace; korzystać z `ApiError.message`.

## 11. Kroki implementacji
1) Dodać routing:
   - utworzyć `src/pages/rooms/[roomId].astro` analogicznie do dashboardu.
2) Utworzyć `src/components/room/RoomPage.tsx` jako kontener.
3) Dodać VM helpery (format dat, mapowanie DTO → VM) w `RoomPage` lub osobnym pliku (np. `src/components/room/mappers.ts`).
4) Dodać hooki:
   - `use-room.ts`, `use-room-photos.ts`, `use-photo-upload.ts`, `use-generate-inspiration.ts`.
5) Rozszerzyć `src/lib/api.ts` o brakujące endpointy (opis w sekcji 7).
6) Zaimplementować komponenty UI:
   - `RoomHeader`, `PhotosSection`, `PhotoGrid/PhotoCard`, `PhotoRequirementsTracker`, `GenerateSection`, `GenerationResultsList`.
7) Spiąć walidacje UI z `ValidationRules` z `src/types.ts` (jeden source of truth).
8) Dodać obsługę błędów i przekierowań (401 → login).
9) Dodać UX/accessibility:
   - poprawne nagłówki, `aria-label` na uploadach, `aria-live` na dynamicznych statusach.
10) (Opcjonalnie) Testy:
   - testy hooków dla mapowania błędów `ApiError` oraz logiki `isReadyToGenerate`.

Checklist „gotowe do review”:
- wejście na `/rooms/{roomId}` działa i renderuje layout
- 2 sekcje zdjęć + liczniki są spójne z `counts`
- upload waliduje typ/rozmiar/limit i pokazuje toasty
- generate jest blokowane dopóki wymagania niespełnione
- 401 przekierowuje do login z `redirectTo`
- 404 pokazuje ekran „Nie znaleziono pokoju" z CTA
