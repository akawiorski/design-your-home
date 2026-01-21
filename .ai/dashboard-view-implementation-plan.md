
# Plan implementacji widoku Dashboard

## 1. Przegląd
Dashboard (`/dashboard`) to prywatny widok po zalogowaniu. Jego zadaniem jest:
- wyświetlenie listy pokoi użytkownika (typ, liczniki zdjęć `room`/`inspiration`, daty),
- umożliwienie szybkiego utworzenia nowego pokoju (modal),
- nawigacja do szczegółów pokoju (`/rooms/{roomId}`).

Widok korzysta z Astro jako shell/routing oraz React do interakcji i pobierania danych. Dane są pobierane z API aplikacji (`/api/rooms`, `/api/room-types`, `/api/rooms` POST). Dla spójnego UX błędy i sukcesy są komunikowane toastami (shadcn/ui).

## 2. Routing widoku
- Ścieżka: `/dashboard`
- Plik routingu: `src/pages/dashboard/index.astro` (już istnieje jako placeholder)
- Renderowanie:
	- Astro odpowiada za layout i podstawowy szkielet.
	- Główny komponent interaktywny: React `DashboardPage` renderowany w `index.astro` z `client:only="react"` (lub `client:load`, jeśli chcesz SSR treści statycznej + hydratację).

Rekomendacja: `client:only="react"` dla prostoty, bo lista i modal zależą od fetchy oraz obsługi 401.

## 3. Struktura komponentów

Proponowana hierarchia (wysoki poziom):

- `DashboardPage` (React, kontener danych i logiki)
	- `DashboardHeader`
		- `CreateRoomButton` (otwiera modal)
	- `RoomsSection`
		- `RoomsLoadingState` / `RoomsErrorState` / `RoomsEmptyState` / `RoomsGrid`
			- `RoomCard` (link do `/rooms/{roomId}`)
	- `CreateRoomDialog` (Radix/shadcn Dialog)

Dodatkowo globalnie (w layoucie aplikacji):
- `Toaster` (shadcn/ui) – renderowany raz dla całej aplikacji.

## 4. Szczegóły komponentów

### 4.1 `DashboardPage`
- Opis: Orkiestruje pobranie listy pokoi, obsługę stanów (loading/empty/error), otwieranie modala, tworzenie pokoju oraz reakcję na `401`.
- Główne elementy:
	- kontener: `main` / `section` z nagłówkiem i sekcją listy,
	- warunkowe renderowanie: loader, błąd, pusty stan, grid.
- Obsługiwane zdarzenia:
	- `onMount` → fetch `GET /api/rooms`,
	- `onRetry` → ponowne pobranie `GET /api/rooms`,
	- `onOpenCreateDialog` / `onCloseCreateDialog`,
	- `onRoomCreated(room)` → optymistyczna aktualizacja listy + nawigacja.
- Walidacja:
	- brak walidacji formularzowej; waliduje odpowiedzi API (szczególnie `401`, `500`).
- Typy:
	- DTO: `RoomsListResponse`, `RoomDTO`, `ErrorResponse`
	- ViewModel: `RoomCardVM` (opis w sekcji „Typy”).
- Propsy:
	- Brak (top-level widok).

### 4.2 `DashboardHeader`
- Opis: Nagłówek widoku z tytułem i akcją „Utwórz pokój”.
- Główne elementy:
	- `header` z `h1`, opisem i przyciskiem.
	- Użyj `Button` z shadcn/ui (`src/components/ui/button.tsx`).
- Obsługiwane zdarzenia:
	- klik „Utwórz pokój” → `onCreateClick`.
- Walidacja:
	- brak.
- Typy:
	- brak DTO; prosty komponent UI.
- Propsy:
	- `onCreateClick: () => void`
	- `isCreateDisabled?: boolean` (opcjonalnie; np. gdy trwa ładowanie).

### 4.3 `RoomsSection`
- Opis: Sekcja odpowiedzialna za wyświetlenie listy pokoi i stanów pośrednich.
- Główne elementy:
	- `section` z `aria-labelledby`.
	- warunkowo:
		- `RoomsLoadingState` – skeleton/spinner,
		- `RoomsErrorState` – komunikat + retry,
		- `RoomsEmptyState` – CTA,
		- `RoomsGrid` – siatka kart.
- Obsługiwane zdarzenia:
	- `onRetry` (z error state),
	- `onCreateFirstRoom` (z empty state).
- Walidacja:
	- brak.
- Typy:
	- `RoomCardVM[]`.
- Propsy:
	- `state: RoomsViewState` (opis w sekcji „Zarządzanie stanem”)
	- `rooms: RoomCardVM[]`
	- `onRetry: () => void`
	- `onCreateFirstRoom: () => void`

### 4.4 `RoomsGrid`
- Opis: Prezentacja listy pokoi jako responsywnej siatki kart.
- Główne elementy:
	- kontener: `div` z klasami Tailwind dla grid (`grid gap-4 sm:grid-cols-2 lg:grid-cols-3`),
	- `RoomCard` dla każdego elementu.
- Obsługiwane zdarzenia:
	- brak (karty obsługują klik jako link).
- Walidacja:
	- brak.
- Typy:
	- `RoomCardVM`.
- Propsy:
	- `rooms: RoomCardVM[]`

### 4.5 `RoomCard`
- Opis: Klikalna karta reprezentująca pokój.
- Główne elementy:
	- link (`a`) do `/rooms/{roomId}` (ważne: focusable i działa z klawiaturą),
	- tytuł: `roomType.displayName`,
	- metadane: liczniki zdjęć (room/inspiration) i daty.
- Obsługiwane zdarzenia:
	- nawigacja po kliknięciu (zwykły link; bez ręcznego `onClick`).
- Walidacja:
	- jeśli brakuje danych w VM (np. `href`), komponent nie powinien się renderować (guard w mapowaniu VM).
- Typy:
	- `RoomCardVM`.
- Propsy:
	- `room: RoomCardVM`

### 4.6 `CreateRoomDialog`
- Opis: Modal tworzenia pokoju. Pobiera listę typów pokoi, pozwala wybrać typ i wysłać `POST /api/rooms`.
- Główne elementy:
	- shadcn/ui `Dialog` (Radix) z `DialogTrigger` (opcjonalnie) i `DialogContent`,
	- pole wyboru typu pokoju (shadcn/ui `Select` lub natywny `select`),
	- przyciski: „Anuluj”, „Utwórz”,
	- miejsce na błąd walidacji/serwera (inline) + toasty.
- Obsługiwane zdarzenia:
	- `onOpenChange(open)` – jeśli `open === true` i brak danych → fetch `GET /api/room-types`,
	- zmiana selekta: `onRoomTypeChange(roomTypeId)`,
	- submit: `onSubmit` → `POST /api/rooms`.
- Walidacja (zgodna z API):
	- `roomTypeId` wymagane, `int`, `> 0`.
	- submit zablokowany, gdy `roomTypeId` nie wybrane.
	- Obsłuż błędy:
		- `400 VALIDATION_ERROR` → pokaż inline pod selectem,
		- `404 NOT_FOUND` → inline + toast „Wybrany typ nie istnieje”,
		- `401 AUTHENTICATION_REQUIRED` → natychmiastowy redirect do `/login`,
		- `500 INTERNAL_ERROR` → toast + możliwość ponowienia.
- Typy:
	- DTO: `RoomTypesListResponse`, `RoomTypeDTO`, `CreateRoomCommand`, `RoomDTO`, `ErrorResponse`
	- ViewModel: `RoomTypeOptionVM` (opis w sekcji „Typy”).
- Propsy:
	- `open: boolean`
	- `onOpenChange: (open: boolean) => void`
	- `onCreated: (room: RoomDTO) => void`

### 4.7 `Toaster` (globalny)
- Opis: Globalne toasty dla komunikatów sukcesu i błędu.
- Implementacja: shadcn/ui Toast (`useToast`, `Toaster`) – jeśli w projekcie jeszcze nie ma, należy dodać.
- Umieszczenie:
	- najlepiej raz w layoucie: `src/layouts/Layout.astro` (np. na końcu `<body>`),
	- albo w `DashboardPage` jako minimum (ale docelowo globalnie).

## 5. Typy

### 5.1 DTO (już istniejące w `src/types.ts`)
- `RoomsListResponse`:
	- `rooms: RoomDTO[]`
- `RoomDTO`:
	- `id: string`
	- `roomType: RoomTypeDTO`
	- `photoCount: { room: number; inspiration: number }`
	- `createdAt: string` (ISO)
	- `updatedAt: string` (ISO)
- `RoomTypesListResponse`:
	- `roomTypes: RoomTypeDTO[]`
- `RoomTypeDTO`:
	- `id: number`
	- `name: string`
	- `displayName: string`
- `CreateRoomCommand`:
	- `roomTypeId: number`
- `ErrorResponse`:
	- `error.code: string`
	- `error.message: string`
	- `error.details?: Record<string, unknown>`
	- `error.timestamp: string`

### 5.2 Nowe typy ViewModel (rekomendowane)

#### `RoomCardVM`
Cel: odseparować formatowanie danych (daty, labelki, href) od komponentów prezentacyjnych.
- `id: string`
- `href: string` (np. `/rooms/${id}`)
- `title: string` (np. `room.roomType.displayName`)
- `subtitle?: string` (opcjonalnie; np. „Ostatnia aktualizacja: …”)
- `photoCount: { room: number; inspiration: number }`
- `createdAtLabel: string` (sformatowana data)
- `updatedAtLabel: string` (sformatowana data)

#### `RoomTypeOptionVM`
Cel: prosty model do renderowania opcji w select.
- `value: number` (roomTypeId)
- `label: string` (displayName)

#### `RoomsViewState`
Cel: spójna reprezentacja stanu sekcji listy.
- `status: "idle" | "loading" | "success" | "error"`
- `error?: { message: string; code?: string }`

### 5.3 Mapowanie DTO → VM
- `RoomDTO` → `RoomCardVM`:
	- `title = room.roomType.displayName`
	- `href = /rooms/${room.id}`
	- `createdAtLabel/updatedAtLabel` – formatowanie przez `Intl.DateTimeFormat("pl-PL")`.

## 6. Zarządzanie stanem

Rekomendacja: lokalny stan w `DashboardPage` + małe custom hooki (bez wprowadzania globalnego store na tym etapie).

### 6.1 Stan w `DashboardPage`
- `roomsState: RoomsViewState`
- `rooms: RoomDTO[]` (źródło prawdy) lub od razu `RoomCardVM[]` (jeśli mapujesz przy fetchu)
- `isCreateDialogOpen: boolean`
- `roomTypesState` w obrębie modala:
	- `status: "idle" | "loading" | "success" | "error"`
	- `roomTypes: RoomTypeDTO[]`
- `createRoomState`:
	- `isSubmitting: boolean`
	- `error?: string`

### 6.2 Custom hooki (opcjonalnie, ale zalecane dla czytelności)

#### `useApiJson<T>()`
Cel: ujednolicić fetch JSON + obsługę `ErrorResponse` i 401.
- wejście: `url`, `init`, opcjonalnie `onUnauthorized`.
- wyjście: `{ data, error, status }` lub po prostu `async function request<T>()`.

#### `useUnauthorizedRedirect()`
Cel: centralne miejsce na logikę przekierowania na `/login` przy 401.
- zachowanie:
	- redirect do `/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`
	- (uwaga: w repo istnieją różne paramy: `redirectTo` w loginie, `returnTo` w AuthRedirector; rekomendacja: trzymać się `redirectTo`, bo login już to wspiera).

#### `useRooms()`
Cel: pobranie i odświeżenie listy pokoi.
- API: `GET /api/rooms`.
- zwraca: `{ state, rooms, refresh }`.

## 7. Integracja API

### 7.1 `GET /api/rooms`
- Request: `fetch("/api/rooms", { method: "GET", credentials: "include" })`
- Response (200): `RoomsListResponse`
- Errors:
	- 401: `ErrorResponse` z `code=AUTHENTICATION_REQUIRED` → redirect do `/login`
	- 500: `ErrorResponse` → toast + możliwość retry

Frontend akcje:
- `DashboardPage` w `useEffect` pobiera rooms.
- Na sukces: render `RoomsGrid`.
- Na `rooms.length === 0`: render `RoomsEmptyState`.

### 7.2 `GET /api/room-types`
- Request: `fetch("/api/room-types", { method: "GET" })`
- Response (200): `RoomTypesListResponse`
- Errors:
	- 500: toast + komunikat w modalu

Frontend akcje:
- `CreateRoomDialog` fetchuje na otwarciu (lazy load) i cache’uje w stanie, żeby nie pobierać wielokrotnie.

### 7.3 `POST /api/rooms`
- Request body: `CreateRoomCommand` (`{ roomTypeId: number }`)
- Response (201): `RoomDTO`
- Errors:
	- 400 (`VALIDATION_ERROR`, `INVALID_JSON`) → inline w modalu
	- 401 → redirect do `/login`
	- 404 (`NOT_FOUND`) → inline + toast
	- 500 → toast

Frontend akcje:
- Po sukcesie:
	- zamknij modal,
	- pokaż toast sukcesu,
	- zaktualizuj listę: albo dopisz zwrócony `RoomDTO` na początek, albo odpal `refresh()`.
	- nawiguj do `/rooms/{roomId}`.

### 7.4 (Opcjonalnie) `POST /api/analytics/events` – `RoomCreated`
- Request: `TrackAnalyticsEventCommand`
	- `eventType: "RoomCreated"`
	- `eventData: RoomCreatedEventData` (`{ roomId, roomType }`)
- Response: `TrackAnalyticsEventResponse`

Frontend akcje:
- Wyślij „fire-and-forget” po sukcesie tworzenia pokoju.
- Brak blokowania UX: błąd analityki nie powinien wpływać na przejście do pokoju.

## 8. Interakcje użytkownika

1) Wejście na `/dashboard`
- Widzi loader listy.
- Po sukcesie: widzi listę lub pusty stan.

2) Klik „Utwórz pokój”
- Otwiera modal.
- Jeśli typy niezaładowane: loader w modalu.

3) Wybór typu pokoju
- Aktywuje przycisk „Utwórz”.

4) Submit tworzenia pokoju
- Disabled przycisków, spinner.
- Sukces:
	- toast „Pokój utworzony”,
	- przejście do `/rooms/{roomId}`.
- Błąd walidacji:
	- inline error w modalu.
- 401:
	- natychmiast redirect do `/login?redirectTo=/dashboard`.

5) Klik na kartę pokoju
- Przejście do `/rooms/{roomId}`.

6) Retry po błędzie `GET /api/rooms`
- Ponowny fetch.

## 9. Warunki i walidacja

### 9.1 Warunki UI wynikające z PRD i planu widoku
- Widok prywatny: brak sesji lub `401` z API → redirect do logowania.
- Elementy listy są linkami i muszą być:
	- klikalne,
	- focusable,
	- dostępne z klawiatury.

### 9.2 Walidacja tworzenia pokoju (zgodna z API)
- `roomTypeId`:
	- wymagane,
	- liczba całkowita,
	- `> 0`.

Wpływ na UI:
- Brak wyboru → `Create` disabled.
- Błędy 400/404 → inline w modalu + opcjonalnie toast.

## 10. Obsługa błędów

Scenariusze i rekomendacje:
- `401 AUTHENTICATION_REQUIRED` (dowolny endpoint dashboardu):
	- natychmiastowy redirect do `/login?redirectTo=...`.
- `500 INTERNAL_ERROR` przy `GET /api/rooms`:
	- pokaż `RoomsErrorState` + przycisk „Spróbuj ponownie”,
	- toast z krótkim komunikatem.
- `500` przy `GET /api/room-types`:
	- modal pokazuje komunikat „Nie udało się pobrać typów”,
	- przycisk retry w modalu.
- `400 VALIDATION_ERROR` przy `POST /api/rooms`:
	- inline błąd (np. „Wybierz typ pokoju”).
- Błędy sieci (`TypeError: Failed to fetch`):
	- komunikat „Problem z połączeniem. Spróbuj ponownie.”

Zasada UX: błędy nie powinny usuwać danych z formularza w modalu.

## 11. Kroki implementacji

1) Zastąp placeholder w `src/pages/dashboard/index.astro` szkieletem widoku:
	 - zachowaj `Layout`,
	 - dodaj React `DashboardPage` jako `client:only="react"`.

2) Dodaj komponenty React w `src/components/dashboard/`:
	 - `DashboardPage.tsx`
	 - `DashboardHeader.tsx`
	 - `RoomsSection.tsx`, `RoomsGrid.tsx`, `RoomCard.tsx`
	 - `CreateRoomDialog.tsx`

3) Dodaj (lub zaplanuj dodanie) system toastów shadcn/ui:
	 - komponent `Toaster` i hook `useToast` (standard shadcn),
	 - zamontuj `Toaster` w `src/layouts/Layout.astro` (jednorazowo dla całej aplikacji).

4) Zaimplementuj klienta API dla frontu (minimalny wrapper):
	 - np. `src/lib/api.ts` z funkcjami:
		 - `getRooms(): Promise<RoomsListResponse>`
		 - `getRoomTypes(): Promise<RoomTypesListResponse>`
		 - `createRoom(cmd: CreateRoomCommand): Promise<RoomDTO>`
	 - centralna obsługa `ErrorResponse` i mapowanie 401.

5) Zaimplementuj `useUnauthorizedRedirect` (lub prostą funkcję) używaną we wszystkich requestach dashboardu.

6) Zaimplementuj `DashboardPage`:
	 - `useEffect` do `GET /api/rooms`,
	 - `RoomsViewState` + retry,
	 - mapowanie `RoomDTO` → `RoomCardVM`.

7) Zaimplementuj `CreateRoomDialog`:
	 - lazy load `GET /api/room-types` na open,
	 - walidacja `roomTypeId` (disabled submit),
	 - `POST /api/rooms` + stany submit,
	 - po sukcesie: toast + `onCreated(room)`.

8) Po `onCreated` w `DashboardPage`:
	 - dopisz pokój do listy lub zrób `refresh()`,
	 - nawiguj do `/rooms/{roomId}`,
	 - opcjonalnie wyślij `POST /api/analytics/events` (`RoomCreated`) bez blokowania UI.

9) Dopasuj UI/UX:
	 - responsywny grid,
	 - czytelne copy dla pustego stanu,
	 - format dat w `pl-PL`.

10) Dostępność:
	 - `h1` na stronie,
	 - `aria-live` tylko dla krótkich statusów,
	 - dialog z poprawnym fokusowaniem (Radix/shadcn),
	 - linki/karty działające z klawiaturą.

11) Weryfikacja manualna:
	 - bez pokoi → pusty stan + CTA,
	 - tworzenie pokoju → przejście do `/rooms/{roomId}`,
	 - wymuszone `401` (np. wylogowanie) → redirect do login.
