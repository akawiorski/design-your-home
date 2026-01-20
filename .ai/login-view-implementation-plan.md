
# Plan implementacji widoku Logowanie

## 1. Przegląd
Widok **Logowanie** (`/login`) służy do uwierzytelnienia użytkownika w aplikacji (email + hasło) z wykorzystaniem **Supabase Auth**. Widok jest częścią „strefy publicznej” (bez sesji) i po poprawnym logowaniu przekierowuje użytkownika do strefy prywatnej (docelowo: `/dashboard`).

Założenia kluczowe:
- Logowanie jest wymagane od pierwszego kroku (PRD: brak trybu anonimowego).
- UI nie ujawnia wrażliwych szczegółów błędu (np. czy email istnieje), komunikuje błąd w sposób przyjazny.
- Formularz ma walidację po stronie klienta + obsługę błędów zwracanych przez Supabase.
- Zapobiegamy przypadkowemu wielokrotnemu wysyłaniu (disabled podczas requestu).

## 2. Routing widoku
- Ścieżka: **`/login`**
- Astro routing: plik strony **`src/pages/login.astro`**
- Zachowanie dodatkowe:
	- Jeżeli użytkownik ma już aktywną sesję → automatyczne przekierowanie do `/dashboard` (lub do `redirectTo`, jeśli przekazano w query).
	- Opcjonalny query param: `redirectTo` (np. `/rooms/{roomId}`), używany po sukcesie logowania.

## 3. Struktura komponentów
Docelowo widok powinien używać Astro jako „shell” i React dla interaktywnego formularza.

Proponowana hierarchia:

```
LoginPage (Astro: src/pages/login.astro)
└─ AuthLayout (Astro: np. src/layouts/AuthLayout.astro lub Layout.astro)
	 ├─ Header / Branding (Astro)
	 └─ LoginForm (React)
			├─ EmailField (React)
			├─ PasswordField (React)
			├─ SubmitButton (React)
			├─ InlineFieldErrors (React)
			└─ GlobalToastTrigger (React -> toast)
```

Uwaga: jeśli w projekcie nie ma jeszcze infrastruktury toastów, można w tym samym wdrożeniu dodać globalny „toaster” w layoucie aplikacji.

## 4. Szczegóły komponentów

### 4.1 LoginPage (Astro)
- Opis: Strona routingu `/login`, renderuje layout i osadza komponent React `LoginForm`.
- Główne elementy:
	- `<main>` jako landmark
	- kontener centrujący formularz (np. `min-h-screen grid place-items-center`)
	- link do `/register`
- Obsługiwane interakcje:
	- brak (poza przekierowaniem wstępnym, jeśli sesja istnieje)
- Obsługiwana walidacja:
	- brak (walidacja w `LoginForm`)
- Typy:
	- brak DTO (to nie jest endpoint REST)
- Propsy:
	- przekazanie `redirectTo` (string | null) do `LoginForm` jako prop (wartość z query)

**Proponowany kontrakt propsów do React:**
```ts
interface LoginFormProps {
	redirectTo?: string | null;
}
```

### 4.2 AuthLayout (Astro)
- Opis: Prosty layout dla strefy publicznej (login/register) – minimalny chrome, spójne style.
- Główne elementy:
	- `<html>`, `<head>`, `<body>` (może bazować na `src/layouts/Layout.astro`)
	- `<main>` + `<slot />`
	- (opcjonalnie) komponent toastera (jeśli toast globalny)
- Obsługiwane interakcje:
	- brak
- Obsługiwana walidacja:
	- brak
- Typy:
	- brak
- Propsy:
	- `title?: string`

### 4.3 LoginForm (React)
- Opis: Interaktywny formularz logowania. Obsługuje pola email/hasło, walidację, stan ładowania, błędy inline oraz toast dla błędów ogólnych.
- Główne elementy:
	- `<form>`
	- `<label>` + `<input type="email">`
	- `<label>` + `<input type="password">`
	- przycisk submit (shadcn `Button`)
	- sekcja na błąd ogólny (`role="alert"` lub toast)
	- link do `/register`
- Obsługiwane zdarzenia:
	- `onChange` (pola)
	- `onBlur` (opcjonalnie: walidacja per pole)
	- `onSubmit` (logowanie)
- Obsługiwana walidacja (szczegółowo):
	- **Email**:
		- wymagany
		- poprawny format (np. prosty regex lub walidacja z biblioteki/HTML5)
		- przy błędzie: komunikat inline pod polem
	- **Hasło**:
		- wymagane
		- minimalna długość (rekomendacja: ≥ 8 znaków; jeśli produkt nie narzuca, traktuj jako walidację UX, nie twardą)
		- przy błędzie: komunikat inline pod polem
	- **Submit**:
		- disabled, gdy:
			- trwa request (`isSubmitting === true`), lub
			- walidacja klienta nie przeszła
- Typy (DTO i ViewModel):
	- `LoginFormValues` (ViewModel)
	- `LoginFormErrors` (ViewModel)
	- typy Supabase: `AuthError`, `Session` (z `@supabase/supabase-js`)
- Propsy:
	- `redirectTo?: string | null`

**Proponowany interfejs propsów:**
```ts
interface LoginFormProps {
	redirectTo?: string | null;
}
```

### 4.4 EmailField (React) – opcjonalnie jako subkomponent
- Opis: Wydzielone pole email (ułatwia testowanie i spójność z Register).
- Główne elementy:
	- `<label htmlFor="email">`
	- `<input id="email" type="email" autocomplete="email" inputMode="email" required>`
	- element na błąd inline (`<p id="email-error">`)
- Obsługiwane zdarzenia:
	- `onChange`, `onBlur`
- Walidacja:
	- wymagane + format email
- Typy:
	- `value: string`, `error?: string`
- Propsy:
```ts
interface EmailFieldProps {
	value: string;
	error?: string;
	disabled?: boolean;
	onChange: (value: string) => void;
	onBlur?: () => void;
}
```

### 4.5 PasswordField (React) – opcjonalnie jako subkomponent
- Opis: Pole hasła z poprawnym `autocomplete`.
- Główne elementy:
	- `<label htmlFor="password">`
	- `<input id="password" type="password" autocomplete="current-password" required>`
	- (opcjonalnie) „pokaż/ukryj hasło” (w MVP niekonieczne)
- Obsługiwane zdarzenia:
	- `onChange`, `onBlur`
- Walidacja:
	- wymagane, rekomendowana minimalna długość
- Propsy analogiczne do EmailField

### 4.6 Toast / Toaster (globalnie)
- Opis: Mechanizm toastów do błędów ogólnych (np. sieć, błąd Supabase) oraz komunikatów systemowych.
- Rekomendacja wdrożenia:
	- shadcn/ui często używa **Sonner** (`sonner`) lub własnego `Toast` na Radix.
	- Jeśli wybieramy Sonner:
		- dodać dependency `sonner`
		- dodać `<Toaster />` w layoucie (np. `AuthLayout` lub globalny `Layout`)
		- w `LoginForm` wywoływać `toast.error("...")`

## 5. Typy
Widok logowania nie korzysta z REST API z `src/types.ts`, więc typy DTO z backendu nie są wymagane. Potrzebne są typy **ViewModel** (lokalne dla widoku/komponentów) oraz typy Supabase.

### 5.1 ViewModel: LoginFormValues
```ts
interface LoginFormValues {
	email: string;
	password: string;
}
```

### 5.2 ViewModel: LoginFormErrors
```ts
interface LoginFormErrors {
	email?: string;
	password?: string;
	form?: string; // błąd ogólny, gdy nie przypisujemy do pola
}
```

### 5.3 ViewModel: LoginSubmitState
```ts
interface LoginSubmitState {
	isSubmitting: boolean;
	lastError?: string;
}
```

### 5.4 Typy Supabase
- `AuthError` – błąd logowania (np. błędne dane)
- `Session` / `User` – informacja o sesji po logowaniu

Uwaga architektoniczna: docelowo (gdy backend będzie sprawdzał sesję) warto dodać typ w `context.locals`, np. `locals.session`, ale to wykracza poza sam widok – zależne od decyzji o integracji SSR.

## 6. Zarządzanie stanem
Stan jest lokalny dla formularza (React). Zalecany model:

- `values: LoginFormValues`
- `errors: LoginFormErrors`
- `isSubmitting: boolean`
- `hasSubmitted: boolean` (opcjonalnie, do kontroli wyświetlania błędów)

### 6.1 Custom hook (rekomendowany): useLoginForm
Cel: skupić logikę walidacji, submitu i mapowania błędów Supabase w jednym miejscu, aby `LoginForm` pozostał prosty.

**Sygnatura (przykład):**
```ts
function useLoginForm(options: { redirectTo?: string | null }): {
	values: LoginFormValues;
	errors: LoginFormErrors;
	isSubmitting: boolean;
	canSubmit: boolean;
	setEmail: (v: string) => void;
	setPassword: (v: string) => void;
	submit: () => Promise<void>;
};
```

### 6.2 Custom hook (opcjonalny): useSupabaseBrowserClient
Cel: udostępnić singleton klienta Supabase w przeglądarce (anon key).
- Może używać obecnego klienta z `src/db/supabase.client.ts` (anon key jest bezpieczny w kliencie).
- Alternatywnie: osobny plik np. `src/db/supabase.browser.ts` (czytelniejsze rozdzielenie).

## 7. Integracja API
### 7.1 Supabase Auth (bez REST)
Logowanie realizujemy bezpośrednio przez Supabase SDK:

- Wywołanie:
	- `supabase.auth.signInWithPassword({ email, password })`
- Oczekiwany rezultat:
	- sukces → zwraca `data.session` i zapisuje sesję po stronie klienta
	- błąd → `error` (np. invalid login)

### 7.2 Redirect po logowaniu
Po sukcesie:
- jeśli `redirectTo` istnieje i jest bezpieczne → przekieruj do `redirectTo`
- w przeciwnym razie → przekieruj do `/dashboard`

**Bezpieczeństwo redirectu (ważne):**
- akceptuj tylko ścieżki lokalne zaczynające się od `/`
- odrzuć pełne URL (np. `https://...`) oraz `//...`

### 7.3 Sesja na SSR (kontekst projektu)
Obecnie API w repo używa `DEFAULT_USER_ID` jako placeholder. Po wdrożeniu logowania, kolejnym krokiem w projekcie będzie:
- egzekwowanie sesji w middleware (np. `locals.session`) i w endpointach
- przekierowania dla strefy prywatnej

Ten krok nie jest wymagany do samego widoku `/login`, ale warto go uwzględnić w implementacji, jeśli od razu budujemy pełny flow.

## 8. Interakcje użytkownika
1. Użytkownik wpisuje email i hasło.
2. UI waliduje pola:
	 - przy blur lub submit (zgodnie z decyzją)
3. Użytkownik klika „Zaloguj się”.
4. UI:
	 - ustawia `isSubmitting=true`
	 - blokuje pola i przycisk
	 - wysyła request do Supabase
5. Sukces:
	 - toast „Zalogowano” (opcjonalnie)
	 - redirect do `/dashboard` (lub `redirectTo`)
6. Błąd:
	 - błąd związany z danymi (np. invalid credentials): komunikat ogólny (nie ujawnia czy email istnieje)
	 - błąd sieci / inny: toast z komunikatem „Nie udało się zalogować. Spróbuj ponownie.”

## 9. Warunki i walidacja
### 9.1 Warunki UI
- `email`:
	- `required`
	- format email
	- `autocomplete="email"`
- `password`:
	- `required`
	- `autocomplete="current-password"`
- `submit`:
	- disabled, gdy `isSubmitting` lub walidacja nie przeszła

### 9.2 Warunki „wymagane przez API” (Supabase)
- Supabase Auth wymaga poprawnych danych i skonfigurowanego projektu Supabase.
- Weryfikacja na poziomie komponentu:
	- sprawdzenie, że `import.meta.env.SUPABASE_URL` oraz `import.meta.env.SUPABASE_KEY` są dostępne (opcjonalnie: fallback błąd konfiguracyjny na UI)
	- obsługa kodów błędów Supabase w sposób nieujawniający informacji

## 10. Obsługa błędów
Potencjalne scenariusze:
- **Niepoprawny email/hasło** → komunikat ogólny: „Nieprawidłowy email lub hasło.”
- **Brak potwierdzenia email (jeśli włączone)** → komunikat: „Sprawdź skrzynkę i potwierdź adres email.”
- **Rate limit / zbyt wiele prób** → komunikat: „Spróbuj ponownie za chwilę.”
- **Błąd sieci** → toast: „Problem z połączeniem. Sprawdź internet i spróbuj ponownie.”
- **Błąd konfiguracji (brak env)** → komunikat developerski tylko w dev (np. console), a w UI: „Usługa logowania jest chwilowo niedostępna.”

Zasady:
- Nie wyświetlaj surowych komunikatów technicznych użytkownikowi.
- Loguj pełny błąd do `console.error` w trybie dev.
- Utrzymuj spójny format błędów inline (pod polami) i ogólnych (toast/alert).

## 11. Kroki implementacji
1. Dodaj stronę routingu:
	 - utwórz `src/pages/login.astro`.
	 - użyj `Layout.astro` lub utwórz `src/layouts/AuthLayout.astro` dla login/register.
2. Dodaj komponent formularza:
	 - utwórz `src/components/auth/LoginForm.tsx` (React).
	 - użyj `src/components/ui/button.tsx` dla przycisku.
	 - jeśli brakuje komponentów Input/Label/Card – dodaj je (shadcn/ui) albo użyj HTML + Tailwind.
3. Dodaj walidację klienta:
	 - walidacja required + format email.
	 - opcjonalnie: zod po stronie klienta (spójnie z backendem), np. `z.string().email()`.
4. Zintegruj Supabase Auth:
	 - użyj `supabaseClient.auth.signInWithPassword({ email, password })`.
	 - obsłuż `error` i mapuj na komunikaty UX.
5. Dodaj ochronę przed wielokrotnym wysłaniem:
	 - `isSubmitting` → disable inputów i buttona.
6. Dodaj toasty (jeśli wymagane w UI planie):
	 - wybierz mechanizm (np. Sonner).
	 - dodaj `<Toaster />` do layoutu.
	 - używaj toastów dla błędów ogólnych.
7. Dodaj redirect po sukcesie:
	 - pobierz `redirectTo` z query i przekaż do `LoginForm`.
	 - waliduj `redirectTo` (tylko lokalne ścieżki).
8. Dodaj „already authenticated” guard:
	 - przy wejściu na `/login`, jeśli jest sesja (client-side check) → redirect do `/dashboard`.
	 - docelowo (gdy SSR auth będzie wdrożone) można przenieść to na middleware.
9. A11y i UX:
	 - upewnij się, że pola mają label, `aria-invalid`, `aria-describedby` dla błędów.
	 - błędy ogólne w `role="alert"` lub toast.
10. Smoke test manualny:
	 - logowanie poprawnymi danymi
	 - logowanie błędnymi danymi
	 - blokada wielokrotnego submitu
	 - poprawne `autocomplete`
