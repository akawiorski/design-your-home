# Plan implementacji widoku Landing / Redirect

## 1. Przegląd
Widok `Landing / Redirect` jest stroną startową (`/`) aplikacji. Jego jedynym celem jest sprawdzenie stanu uwierzytelnienia użytkownika po stronie klienta i natychmiastowe przekierowanie go do odpowiedniej sekcji aplikacji:
- Do widoku logowania (`/login`), jeśli użytkownik nie jest zalogowany.
- Do głównego panelu (`/dashboard`), jeśli użytkownik ma aktywną sesję.
Podczas sprawdzania sesji, użytkownikowi prezentowany jest prosty wskaźnik ładowania, aby zapobiec wrażeniu "pustej strony".

## 2. Routing widoku
Widok będzie dostępny pod główną, korzenną ścieżką aplikacji:
- **Ścieżka:** `/`

## 3. Struktura komponentów
Widok ten jest stroną Astro, która renderuje jeden komponent React odpowiedzialny za logikę przekierowania.

- `src/pages/index.astro` (Strona Astro)
  - `AuthRedirector.tsx` (Komponent React)
    - `Spinner.tsx` (Komponent UI, np. z biblioteki `shadcn/ui`)

## 4. Szczegóły komponentów
### `AuthRedirector`
- **Opis komponentu:** Komponent ten jest sercem widoku. Po zamontowaniu, używa klienta Supabase do sprawdzenia aktualnego stanu sesji użytkownika. Na podstawie wyniku, wykonuje przekierowanie po stronie klienta. W trakcie sprawdzania, wyświetla komponent `Spinner`.
- **Główne elementy:** Komponent renderuje warunkowo: albo komponent `Spinner`, albo `null` po wykonaniu przekierowania. Cała logika zawarta jest w hooku `useEffect`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji użytkownika. Komponent działa automatycznie.
- **Obsługiwana walidacja:** Brak walidacji. Logika opiera się wyłącznie na stanie sesji zwróconym przez Supabase.
- **Typy:** `Session` (z `@supabase/supabase-js`).
- **Propsy:** Brak.

## 5. Typy
Do implementacji tego widoku nie są wymagane żadne nowe, niestandardowe typy ani ViewModels. Wykorzystany zostanie istniejący typ `Session` z biblioteki `@supabase/supabase-js`, który opisuje obiekt sesji użytkownika.

## 6. Zarządzanie stanem
Zarządzanie stanem w tym komponencie jest minimalne i ogranicza się do jednego stanu lokalnego.

- **`isLoading` (typu `boolean`):**
  - **Cel:** Kontroluje widoczność komponentu `Spinner`.
  - **Działanie:** Inicjalizowany jako `true`. Po zakończeniu sprawdzania sesji i zainicjowaniu przekierowania, jego wartość jest ustawiana na `false`.
  - **Hook:** `useState` z Reacta.

Nie ma potrzeby tworzenia niestandardowego hooka dla tak prostej logiki.

## 7. Integracja API
Komponent nie wchodzi w interakcję z API REST aplikacji. Zamiast tego, komunikuje się bezpośrednio z klientem Supabase po stronie przeglądarki.

- **Wywołanie:** `supabase.auth.getSession()`
  - **Cel:** Pobranie informacji o bieżącej sesji użytkownika.
  - **Typ odpowiedzi:** `{ data: { session: Session | null }, error: AuthError | null }`
- **Akcja na froncie:**
  - Jeśli `session` istnieje, wykonaj `window.location.href = '/dashboard'`.
  - Jeśli `session` jest `null`, wykonaj `window.location.href = '/login'`.

## 8. Interakcje użytkownika
Użytkownik nie wchodzi w bezpośrednią interakcję z tym widokiem. Jedyne, czego doświadcza, to krótki moment ładowania, po którym następuje automatyczne przekierowanie.

## 9. Warunki i walidacja
Jedynym warunkiem weryfikowanym przez komponent jest istnienie obiektu `session` w odpowiedzi od klienta Supabase.
- **Warunek:** `session !== null`
- **Komponent:** `AuthRedirector.tsx`
- **Wpływ na stan:** Na podstawie tego warunku podejmowana jest decyzja o docelowym URL przekierowania.

## 10. Obsługa błędów
Głównym potencjalnym scenariuszem błędu jest problem z komunikacją z Supabase podczas pobierania sesji.

- **Scenariusz:** Wywołanie `supabase.auth.getSession()` zwraca błąd.
- **Obsługa:** W przypadku błędu, komponent powinien przyjąć bezpieczne założenie, że użytkownik nie jest zalogowany. Zaloguje błąd do konsoli i przekieruje użytkownika na stronę logowania (`/login`). Zapewnia to, że aplikacja nie zablokuje się na ekranie ładowania.

## 11. Kroki implementacji
1. **Utworzenie strony Astro:** Stwórz plik `src/pages/index.astro`.
2. **Import i renderowanie komponentu:** Wewnątrz `index.astro`, zaimportuj i umieść komponent `AuthRedirector`, pamiętając o dyrektywie `client:load`, aby uruchomić go natychmiast po stronie klienta.
3. **Stworzenie komponentu React:** Stwórz plik `src/components/auth/AuthRedirector.tsx`.
4. **Implementacja logiki:** Wewnątrz `AuthRedirector.tsx`:
    a. Dodaj stan `isLoading` za pomocą `useState`, domyślnie `true`.
    b. Użyj hooka `useEffect` (z pustą tablicą zależności `[]`), aby logika uruchomiła się tylko raz po zamontowaniu komponentu.
    c. Wewnątrz `useEffect`, wywołaj asynchroniczną funkcję, która:
        i. Wywołuje `supabase.auth.getSession()`.
        ii. Na podstawie obecności `data.session`, ustawia docelowy URL.
        iii. W bloku `catch` lub po sprawdzeniu `error`, obsłuż błąd (log do konsoli, ustaw URL na `/login`).
        iv. Wykonaj przekierowanie za pomocą `window.location.href`.
        v. Ustaw `isLoading` na `false`.
5. **Implementacja widoku:** Komponent powinien renderować komponent `Spinner` (lub inny wskaźnik ładowania), gdy `isLoading` jest `true`.
6. **Konfiguracja Supabase:** Upewnij się, że klient Supabase jest poprawnie zainicjowany i dostępny w komponencie (np. poprzez kontekst lub globalny singleton).
7. **Testowanie:** Sprawdź oba scenariusze:
    a. Wejście na stronę `/` bez aktywnej sesji (powinno przekierować do `/login`).
    b. Wejście na stronę `/` z aktywną sesją (powinno przekierować do `/dashboard`).
