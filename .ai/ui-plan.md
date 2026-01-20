# Architektura UI dla Home Inspiration Generator (MVP)

## 1. Przegląd struktury UI

Aplikacja MVP składa się z dwóch obszarów:

1) **Strefa publiczna (bez sesji)** – strony uwierzytelniania:
- `/login`
- `/register`

2) **Strefa prywatna (wymaga sesji)** – właściwa aplikacja:
- Dashboard z listą pokoi: `/dashboard`
- Widok pokoju (praca na zdjęciach + generowanie): `/rooms/{roomId}`

Założenia architektoniczne UI:
- **Astro jako shell / routing**, React dla interaktywnych fragmentów.
- **Astro View Transitions** dla płynnych przejść między widokami.
- **Jeden wspólny layout “App Shell”** dla strefy prywatnej (nagłówek, nawigacja, obszar treści, globalne toasty).
- **Spójny kontrakt błędów**: wszystkie błędy API prezentowane jako toasty + (gdzie ma sens) inline error (np. formularz).
- **Bezpieczeństwo**: brak dostępu do strefy prywatnej bez ważnej sesji; brak ekspozycji sekretów backendu; UI nie zakłada zaufania do danych bez walidacji.

## 2. Lista widoków

Poniżej: każdy widok zawiera cel, dane, komponenty oraz uwagi UX / dostępność / bezpieczeństwo.

### 2.1 Landing / Redirect
- **Nazwa widoku:** Redirect startowy
- **Ścieżka widoku:** `/`
- **Główny cel:** Skierować użytkownika do właściwego miejsca na podstawie sesji.
- **Kluczowe informacje:** Stan sesji (z Supabase Auth).
- **Kluczowe komponenty:** "Auth Redirect" (logika), wskaźnik ładowania.
- **UX / dostępność / bezpieczeństwo:**
  - Krótki stan ładowania, bez migotania.
  - Jeśli brak sesji → przekieruj do `/login`.
  - Jeśli sesja → przekieruj do `/dashboard`.

### 2.2 Logowanie
- **Nazwa widoku:** Logowanie
- **Ścieżka widoku:** `/login`
- **Główny cel:** Uwierzytelnić użytkownika.
- **Kluczowe informacje do wyświetlenia:**
  - Formularz email/hasło.
  - Link do rejestracji.
  - Informacje o błędach logowania.
- **Kluczowe komponenty widoku:**
  - `LoginForm` (React)
  - Inline błędy pól + toast dla błędów ogólnych
- **UX, dostępność i bezpieczeństwo:**
  - Etykiety pól, poprawne `autocomplete` (`email`, `current-password`).
  - Czytelny komunikat błędu (bez ujawniania szczegółów technicznych).
  - Ochrona przed przypadkowym wielokrotnym wysłaniem (disabled w trakcie requestu).

### 2.3 Rejestracja
- **Nazwa widoku:** Rejestracja
- **Ścieżka widoku:** `/register`
- **Główny cel:** Utworzyć konto i zalogować użytkownika.
- **Kluczowe informacje do wyświetlenia:**
  - Formularz email/hasło.
  - Link do logowania.
  - Informacje o błędach walidacji.
- **Kluczowe komponenty widoku:**
  - `RegisterForm` (React)
- **UX, dostępność i bezpieczeństwo:**
  - Etykiety pól, `autocomplete` (`email`, `new-password`).
  - Jasny stan “tworzenie konta…”.
  - Po sukcesie: przekierowanie do `/dashboard`.

### 2.4 Dashboard (lista pokoi)
- **Nazwa widoku:** Dashboard
- **Ścieżka widoku:** `/dashboard`
- **Główny cel:**
  - Pokazać listę pokoi użytkownika.
  - Umożliwić szybkie utworzenie pokoju.
  - Umożliwić wejście do wybranego pokoju.
- **Kluczowe informacje do wyświetlenia:**
  - Lista pokoi (typ pokoju, liczniki zdjęć: room/inspiration, daty).
  - Stan pusty (gdy brak pokoi).
- **Kluczowe komponenty widoku:**
  - `RoomsList` / `RoomsGrid` (React)
  - `CreateRoomDialog` (modal)
  - CTA dla stanu pustego („Stwórz swój pierwszy pokój”)
  - Globalne toasty
- **API (cele):**
  - `GET /api/rooms` – pobranie listy pokoi
  - `GET /api/room-types` – zasilenie selecta w modalu
  - `POST /api/rooms` – utworzenie pokoju
  - (opcjonalnie) `POST /api/analytics/events` (`RoomCreated`)
- **UX, dostępność i bezpieczeństwo:**
  - Elementy listy jako linki/karty (klikalne, focusable, działają z klawiaturą).
  - Modal tworzenia pokoju ma poprawne zarządzanie fokusem (Radix Dialog).
  - Jeśli API zwróci `401` → natychmiastowe przekierowanie do `/login`.

### 2.5 Widok pokoju (szczegóły + zdjęcia + generowanie)
- **Nazwa widoku:** Pokój
- **Ścieżka widoku:** `/rooms/{roomId}`
- **Główny cel:**
  - Zarządzać zdjęciami wejściowymi (room + inspiration) dla pokoju.
  - Pokazać checklistę wymagań generacji.
  - Uruchomić generowanie i prezentować wyniki.
- **Kluczowe informacje do wyświetlenia:**
  - Typ pokoju i podstawowe metadane.
  - Dwie sekcje zdjęć:
    - „Zdjęcia Twojego pomieszczenia” (`photoType=room`)
    - „Twoje inspiracje” (`photoType=inspiration`)
  - Liczniki: `room: x/1`, `inspiration: y/2` (oraz informacja o limicie 10 łącznych)
  - Stan generacji (idle/loading/success/error)
  - Lista wyników generacji (najnowsze na górze), bez zapisu w DB.
- **Kluczowe komponenty widoku:**
  - `RoomHeader` (nazwa/typ, link powrotny do dashboardu)
  - `PhotosSection` ×2 (room/inspiration)
    - mini-galeria
    - przycisk uploadu
    - obsługa opisu zdjęcia (jeśli w MVP ma się pojawić jako część flow)
  - `UploadButton` + `FilePicker` (z walidacją typów: jpg/png/heic)
  - `PhotoRequirementsTracker` (checklista)
  - `GenerateButton` (disabled dopóki wymagania niespełnione)
  - `GenerationResultsList` (karty: 2 obrazy + bullet points)
  - `LoadingState` (spinner/skeleton) w obszarze wyników
  - Globalne toasty
- **API (cele):**
  - `GET /api/rooms/{roomId}` – nagłówek / metadane (opcjonalnie photos w odpowiedzi)
  - `GET /api/rooms/{roomId}/photos` – zdjęcia + counts (źródło check-listy)
  - `POST /api/rooms/{roomId}/photos/upload-url` – uzyskanie URL uploadu (z `photoType`, `fileName`, `contentType`)
  - Upload pliku do Storage (poza REST API – bezpośrednio do Supabase Storage przez `uploadUrl`)
  - `POST /api/rooms/{roomId}/photos` – zapis rekordu zdjęcia (opis opcjonalny)
  - `POST /api/rooms/{roomId}/generate` – generacja inspiracji
  - `POST /api/analytics/events` (`InspirationGenerated`, opcjonalnie `PhotoUploaded`)
- **UX, dostępność i bezpieczeństwo:**
  - Dwie sekcje zdjęć są jednoznaczne semantycznie (nagłówki H2/H3, opisy).
  - Przyciski uploadu mają czytelne etykiety i `aria-label` (np. „Dodaj zdjęcie pomieszczenia”).
  - Galeria zdjęć: miniatury z sensownym `alt` (np. opis lub domyślny tekst).
  - Generowanie: przycisk disabled + wyraźny stan ładowania; możliwość ponowienia po błędzie.
  - Obsługa `403` (pokój nie należy do usera): ekran błędu „Brak dostępu” + link do dashboardu.
  - Obsługa `404`: ekran „Nie znaleziono pokoju” + link do dashboardu.

### 2.6 Widoki systemowe (wspólne)
- **Nazwa widoku:** Not Found
- **Ścieżka widoku:** `/404` (oraz fallback)
- **Cel:** Przyjazna obsługa błędnych URL.
- **Komponenty:** komunikat + link do `/dashboard` lub `/login` (zależnie od sesji).

- **Nazwa widoku:** Forbidden
- **Ścieżka widoku:** (np. `/forbidden` lub stan w ramach pokoju)
- **Cel:** Pokazać brak uprawnień (np. `403`).
- **Komponenty:** komunikat, CTA do dashboardu.

- **Nazwa widoku:** Error boundary
- **Ścieżka widoku:** (globalnie, jako boundary)
- **Cel:** Złapać nieobsłużone błędy UI i dać użytkownikowi powrót do działania.
- **Komponenty:** komunikat, przycisk „Odśwież” i link do dashboardu.

## 3. Mapa podróży użytkownika

### 3.1 Główny przypadek użycia: pierwszy wariant inspiracji dla nowego użytkownika
1) Użytkownik wchodzi na `/`.
2) Brak sesji → redirect do `/login`.
3) Użytkownik przechodzi do `/register`, tworzy konto.
4) Po sukcesie → redirect do `/dashboard`.
5) Na dashboardzie brak pokoi → stan pusty z CTA.
6) Użytkownik klika CTA → otwiera się modal tworzenia pokoju.
7) UI pobiera typy pokoi (`GET /api/room-types`), użytkownik wybiera typ.
8) UI wysyła `POST /api/rooms` → po sukcesie odświeża listę (`GET /api/rooms`) i przechodzi do `/rooms/{roomId}`.
9) W pokoju użytkownik widzi dwie sekcje zdjęć i checklistę wymagań.
10) Użytkownik dodaje co najmniej 1 zdjęcie pokoju:
    - `POST /api/rooms/{roomId}/photos/upload-url` → upload → `POST /api/rooms/{roomId}/photos`.
11) Użytkownik dodaje co najmniej 2 zdjęcia inspiracji (ten sam flow, `photoType=inspiration`).
12) Checklist spełniona → przycisk „Generuj” aktywny.
13) Użytkownik klika „Generuj”:
    - UI blokuje przycisk, pokazuje loader.
    - `POST /api/rooms/{roomId}/generate`.
14) Sukces → UI dodaje nową kartę wyniku na górze listy (2 obrazy + bullet points).
15) Użytkownik może wygenerować kolejne warianty (powtarza krok 13–14).

### 3.2 Powrót użytkownika
- Wejście na `/` z sesją → `/dashboard`.
- Wybór istniejącego pokoju z listy → `/rooms/{roomId}`.
- Dalsza praca na zdjęciach i generacji.

## 4. Układ i struktura nawigacji

### 4.1 Publiczna nawigacja
- Na `/login` i `/register` prosty layout (bez elementów aplikacji).
- Linki wzajemne między logowaniem a rejestracją.

### 4.2 Prywatna nawigacja (App Shell)
- Stały nagłówek:
  - Nazwa aplikacji (link do `/dashboard`).
  - Opcjonalnie: menu użytkownika (np. „Wyloguj”).
- W widoku pokoju:
  - Wyraźny link „← Wróć do dashboardu”.
  - Breadcrumb (opcjonalnie) `Dashboard / {RoomType}`.

### 4.3 Mechanika przejść
- Przejścia pomiędzy `/dashboard` ↔ `/rooms/{roomId}` realizowane przez routing + Astro View Transitions.

### 4.4 Zasady dostępu (guard)
- Wszystkie ścieżki poza `/login` i `/register` wymagają sesji.
- `401` z API:
  - UI czyści stan sesji i przekierowuje do `/login`.
- `403`:
  - UI pokazuje „Brak dostępu” (bez ujawniania szczegółów) + CTA.

## 5. Kluczowe komponenty

Poniższe komponenty są współdzielone między widokami lub krytyczne dla spójności UX.

1) **AuthGate / SessionProvider**
- Odpowiada za wykrycie sesji, przekierowania i odświeżanie stanu użytkownika.

2) **API Client (warstwa UI)**
- Ujednolicone wywołania endpointów, mapowanie błędów na komunikaty użytkownika, obsługa `401`.

3) **ToastProvider (shadcn/ui)**
- Globalny system komunikatów (błędy/sukcesy), z `aria-live`.

4) **RoomsStore (zustand / nanostores)**
- Globalny stan listy pokoi (cache po zalogowaniu, odświeżanie po `POST /api/rooms`).

5) **CreateRoomDialog**
- Modal z selectem typów pokoi, walidacją i stanem submit.

6) **PhotosSection**
- Sekcja galerii zdjęć dla `photoType=room` lub `photoType=inspiration`.

7) **UploadFlow (UploadButton + walidacja + progres)**
- Walidacja formatów (jpg/png/heic), czytelne błędy, obsługa limitu 10 zdjęć.

8) **PhotoRequirementsTracker**
- Checklist: `room >= 1`, `inspiration >= 2`, wizualny postęp + wyjaśnienie wymagań.

9) **GeneratePanel**
- Przycisk generowania + loader + obsługa retry + blokada podczas requestu.

10) **GenerationResultsList / ResultCard**
- Lista wyników w stanie lokalnym (bez persystencji), newest-first.

---

## Mapowanie na API (zgodność)

UI korzysta z endpointów zgodnie z planem API:
- Room types: `GET /api/room-types` (publiczne – ale używane głównie po zalogowaniu w modalu)
- Rooms: `GET /api/rooms`, `POST /api/rooms`, `GET /api/rooms/{roomId}`
- Photos: `GET /api/rooms/{roomId}/photos`, `POST /api/rooms/{roomId}/photos/upload-url`, `POST /api/rooms/{roomId}/photos`
- Generation: `POST /api/rooms/{roomId}/generate`
- Analytics: `POST /api/analytics/events` (opcjonalnie)

Każda operacja wymagająca autoryzacji jest wykonywana wyłącznie w kontekście ważnej sesji. UI zakłada, że backend egzekwuje własność zasobów (szczególnie dla `{roomId}`).

## Mapowanie historyjek użytkownika (PRD) do UI

- **US-001 Dodanie pomieszczenia** → Dashboard + `CreateRoomDialog` (`GET /api/room-types`, `POST /api/rooms`).
- **US-002 Wybór pomieszczenia** → Dashboard lista pokoi → nawigacja do `/rooms/{roomId}`.
- **US-003 Upload zdjęć** → Widok pokoju + dwie `PhotosSection` + flow uploadu (`upload-url` → upload → `POST /photos`).
- **US-004 Walidacja niekompletnego uploadu** → `PhotoRequirementsTracker` + disabled „Generuj” + komunikat co brakuje.
- **US-005 Generowanie pierwszego wariantu** → `GeneratePanel` + `GenerationResultsList` (loader → wynik).
- **US-006 Generowanie kolejnego wariantu** → `GenerationResultsList` (dopisuje nową kartę na górze).
- **US-011 Obsługa błędów generacji** → toasty + stan błędu w panelu generowania + retry.

## Mapowanie wymagań (PRD) na elementy UI

- **Wymóg logowania od pierwszego kroku** → redirect `/` + guard na strefę prywatną + osobne `/login` i `/register`.
- **Lista pomieszczeń przypisana do użytkownika** → `/dashboard` z `GET /api/rooms`.
- **Upload min. 1 room i min. 2 inspiration** → `PhotoRequirementsTracker` + disabled “Generuj” do momentu spełnienia.
- **Limit 10 plików** → komunikat w sekcjach zdjęć + obsługa błędu `413` w toście.
- **Wyniki generacji bez zapisu w DB** → stan lokalny `GenerationResultsList` + brak “history” po refresh (zgodnie z MVP).
- **Czytelne błędy** → globalne toasty + inline błędy formularzy.

## Przypadki brzegowe i stany błędów (UX)

1) **Brak pokoi**: Dashboard pokazuje stan pusty + CTA.
2) **Sesja wygasła / 401**: natychmiastowy redirect do `/login` + toast „Sesja wygasła”.
3) **Brak dostępu / 403**: komunikat „Brak dostępu do tego pokoju” + link do dashboardu.
4) **Pokój nie istnieje / 404**: komunikat „Nie znaleziono pokoju” + link do dashboardu.
5) **Limit zdjęć / 413**: toast z informacją o limicie i sugestią usunięcia (jeśli dodane w przyszłości) lub wykorzystania istniejących.
6) **Niepoprawny format pliku / 400**: inline błąd przy uploadzie + toast.
7) **Błąd generacji (timeout / 5xx / credits)**: karta błędu + retry; komunikat prosty, bez danych technicznych.
8) **Słabe łącze / offline**: komunikat „Brak połączenia” + przycisk ponów.

