# Plan implementacji widoku Rejestracja

## 1. Przegląd
Widok **Rejestracja** (`/register`) umożliwia utworzenie konta użytkownika w aplikacji (email + hasło) z wykorzystaniem **Supabase Auth**. Widok należy do „strefy publicznej” (bez sesji). Po poprawnej rejestracji (i uzyskaniu sesji) użytkownik jest przekierowywany do **`/dashboard`**.

Założenia kluczowe (zgodnie z PRD i UI planem):
- Aplikacja wymaga konta i logowania od pierwszego kroku (brak trybu anonimowego).
- Formularz ma walidację po stronie klienta oraz czytelną obsługę błędów zwracanych przez Supabase.
- UI nie ujawnia wrażliwych szczegółów technicznych; komunikaty są przyjazne i zrozumiałe.
- Zapobiegamy przypadkowemu wielokrotnemu wysyłaniu (blokada przycisku/inputs podczas requestu).

## 2. Routing widoku
- Ścieżka: **`/register`**
- Astro routing: strona **`src/pages/register.astro`**
- Zachowanie dodatkowe:
  - Jeżeli użytkownik ma już aktywną sesję → automatyczne przekierowanie do `/dashboard`.
  - Widok udostępnia link do `/login`.

## 3. Struktura komponentów
Widok powinien używać Astro jako „shell” i React dla interaktywnego formularza.

Proponowana hierarchia:

```
RegisterPage (Astro: src/pages/register.astro)
└─ AuthLayout (Astro: wspólny layout dla login/register)
   ├─ Header / Branding (Astro)
   └─ RegisterForm (React)
      ├─ EmailField (React)
      ├─ PasswordField (React)
      ├─ SubmitButton (React)
      ├─ InlineFieldErrors (React)
      └─ GlobalToastTrigger (React -> toast)
```

Uwaga: Jeśli w projekcie nie ma jeszcze infrastruktury toastów, warto wdrożyć ją wspólnie dla Login/Register, aby zachować spójny kontrakt błędów w UI.

## 4. Szczegóły komponentów

### 4.1 RegisterPage (Astro)
- Opis: Strona routingu `/register`, renderuje layout i osadza React `RegisterForm`.
- Główne elementy HTML:
  - `<main>` jako landmark
  - kontener centrujący formularz (np. `min-h-screen grid place-items-center`)
  - link tekstowy do `/login`
- Obsługiwane interakcje:
  - przekierowanie wstępne, jeśli sesja istnieje
- Obsługiwana walidacja:
  - brak (walidacja w `RegisterForm`)
- Typy:
  - brak DTO (to nie jest endpoint REST)
- Propsy:
  - opcjonalnie: `redirectTo` (jeśli projekt chce zachować spójność z loginem). Zgodnie z opisem widoku, minimum to redirect do `/dashboard`.

Proponowany kontrakt propsów (minimalny):
```ts
interface RegisterFormProps {}
```

Proponowany kontrakt propsów (rozszerzalny):
```ts
interface RegisterFormProps {
  redirectTo?: string | null;
}
```

### 4.2 AuthLayout (Astro)
- Opis: Prosty layout dla strefy publicznej (login/register) – minimalny chrome, spójne style.
- Główne elementy HTML:
  - `<main>` + `<slot />`
  - (opcjonalnie) komponent toastera (jeśli toast globalny)
- Obsługiwane interakcje: brak
- Walidacja: brak
- Typy: brak
- Propsy:
```ts
interface AuthLayoutProps {
  title?: string;
}
```

### 4.3 RegisterForm (React)
- Opis: Interaktywny formularz rejestracji (email + hasło). Obsługuje walidację, stan ładowania, błędy inline oraz komunikaty globalne (toast).
- Główne elementy HTML i dzieci:
  - `<form>`
  - `<label>` + `<input type="email">`
  - `<label>` + `<input type="password">`
  - przycisk submit (shadcn/ui `Button`)
  - sekcja błędu ogólnego (`role="alert"`) lub toast
  - link do `/login`
- Obsługiwane zdarzenia:
  - `onChange` (pola)
  - `onBlur` (opcjonalnie walidacja per pole)
  - `onSubmit` (rejestracja)
- Warunki walidacji (szczegółowo):
  - **Email**:
    - wymagany
    - poprawny format email (HTML5 + dodatkowa walidacja tekstowa)
    - `autocomplete="email"`, `inputMode="email"`
  - **Hasło**:
    - wymagane
    - rekomendowana minimalna długość: **≥ 8** (UX); jeśli produkt nie narzuca twardej polityki, traktuj to jako walidację klienta „miękką” (np. ostrzeżenie) lub dopasuj do polityki Supabase
    - `autocomplete="new-password"`
  - **Submit**:
    - disabled gdy trwa request (`isSubmitting === true`)
    - disabled gdy walidacja klienta nie przeszła
- Typy (DTO i ViewModel):
  - `RegisterFormValues` (ViewModel)
  - `RegisterFormErrors` (ViewModel)
  - typy Supabase: `AuthError`, `Session`, `User`
- Propsy:
  - minimalnie brak
  - opcjonalnie `redirectTo?: string | null`

Proponowany interfejs propsów (zalecany, jeśli obsługujemy redirect):
```ts
interface RegisterFormProps {
  redirectTo?: string | null;
}
```

### 4.4 EmailField (React) – opcjonalnie jako subkomponent
- Opis: Wydzielone pole email (spójne z loginem, łatwiejsze testowanie).
- Główne elementy HTML:
  - `<label htmlFor="email">`
  - `<input id="email" type="email" autocomplete="email" required>`
  - element na błąd inline (`<p id="email-error">` + `aria-describedby`)
- Obsługiwane zdarzenia:
  - `onChange`, `onBlur`
- Walidacja:
  - wymagane + format email
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
- Opis: Pole hasła do tworzenia konta.
- Główne elementy HTML:
  - `<label htmlFor="password">`
  - `<input id="password" type="password" autocomplete="new-password" required>`
  - element na błąd inline (`<p id="password-error">`)
- Obsługiwane zdarzenia:
  - `onChange`, `onBlur`
- Walidacja:
  - wymagane + polityka długości
- Propsy:
```ts
interface PasswordFieldProps {
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}
```

### 4.6 Toast / Toaster (globalnie)
- Opis: Mechanizm toastów do błędów ogólnych (sieć, błąd Supabase) oraz komunikatów systemowych (np. „Sprawdź email, aby potwierdzić konto”, jeśli Supabase nie zwraca sesji po rejestracji).
- Rekomendacja:
  - użyć shadcn/ui + Sonner (`sonner`) lub istniejącego rozwiązania w repo
  - dodać `<Toaster />` w layoucie `AuthLayout` (albo w globalnym layoucie, jeśli ma być używany w całej aplikacji)

## 5. Typy
Widok rejestracji nie korzysta z REST API z `src/types.ts`, więc DTO z backendu nie są wymagane. Potrzebne są typy **ViewModel** oraz typy Supabase.

### 5.1 ViewModel: RegisterFormValues
```ts
interface RegisterFormValues {
  email: string;
  password: string;
}
```

### 5.2 ViewModel: RegisterFormErrors
```ts
interface RegisterFormErrors {
  email?: string;
  password?: string;
  form?: string; // błąd ogólny (gdy nie przypisujemy do pola)
}
```

### 5.3 ViewModel: RegisterSubmitState
```ts
interface RegisterSubmitState {
  isSubmitting: boolean;
  lastError?: string;
}
```

### 5.4 ViewModel: RegisterOutcome (zalecane)
Cel: rozróżnić przypadek, gdy Supabase zwraca sesję (auto-login) vs gdy wymaga potwierdzenia email (brak sesji).

```ts
type RegisterOutcome =
  | { type: "signed-in"; redirectTo: string }
  | { type: "needs-confirmation"; message: string };
```

### 5.5 Typy Supabase
- `AuthError`
- `Session` / `User`

## 6. Zarządzanie stanem
Stan jest lokalny dla formularza (React). Zalecany model:
- `values: RegisterFormValues`
- `errors: RegisterFormErrors`
- `isSubmitting: boolean`
- `hasSubmitted: boolean` (opcjonalnie, do kontroli wyświetlania błędów)
- `outcome?: RegisterOutcome` (opcjonalnie, jeśli obsługujemy flow „potwierdź email”)

### 6.1 Custom hook (rekomendowany): useRegisterForm
Cel: skupić logikę walidacji, submitu i mapowania błędów Supabase.

Przykładowa sygnatura:
```ts
function useRegisterForm(options: { redirectTo?: string | null }): {
  values: RegisterFormValues;
  errors: RegisterFormErrors;
  isSubmitting: boolean;
  canSubmit: boolean;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  submit: () => Promise<void>;
};
```

### 6.2 Hook pomocniczy (zalecany): useSafeRedirect
Cel: bezpiecznie wyliczyć docelową ścieżkę przekierowania (chroni przed open redirect).

Zasada:
- akceptuj wyłącznie ścieżki lokalne zaczynające się od `/`
- odrzucaj pełne URL (`http(s)://...`) oraz `//...`

## 7. Integracja API

### 7.1 Supabase Auth (bez REST)
Rejestracja realizowana przez Supabase SDK:
- `supabase.auth.signUp({ email, password })`

Oczekiwane rezultaty:
- sukces:
  - **wariant A (auto-login w Supabase)**: `data.session` istnieje → użytkownik jest zalogowany i można przekierować do `/dashboard`.
  - **wariant B (wymagane potwierdzenie email)**: `data.session` jest `null` → UI wyświetla informację „Sprawdź email, aby potwierdzić konto” (bez przekierowania), albo przekierowuje do `/login` z komunikatem.
- błąd: `error` (np. email już zajęty, niepoprawny email, zbyt słabe hasło, rate limit, problemy sieciowe)

### 7.2 Redirect po sukcesie
Minimalnie (zgodnie z opisem widoku):
- zawsze przekieruj do `/dashboard` po sukcesie z sesją.

Opcjonalnie (spójność z loginem):
- jeśli `redirectTo` istnieje i jest bezpieczne → przekieruj do `redirectTo`, inaczej do `/dashboard`.

### 7.3 Uwagi o kliencie Supabase w przeglądarce (ważne w tym repo)
W repo istnieje [src/db/supabase.client.ts](src/db/supabase.client.ts) używany w middleware (SSR / API). Dla widoku `/register` potrzebny jest klient Supabase działający w przeglądarce.

Wymagania i ryzyka:
- anon key jest bezpieczny do użycia po stronie klienta, ale musi być dostępny w bundlu.
- w Astro/Vite zmienne środowiskowe udostępniane do klienta zwykle wymagają prefixu `PUBLIC_`.

Rekomendacja planu implementacji:
- utworzyć osobny moduł np. `src/db/supabase.browser.ts` używający `import.meta.env.PUBLIC_SUPABASE_URL` i `import.meta.env.PUBLIC_SUPABASE_ANON_KEY`.
- zostawić ewentualny service role wyłącznie po stronie serwera (API routes), nigdy w React.

## 8. Interakcje użytkownika
1. Użytkownik wpisuje email i hasło.
2. UI waliduje pola:
   - przy `onBlur` lub przy `onSubmit` (decyzja implementacyjna; dla MVP wystarczy walidacja przy submit + wyczyszczenie błędu przy zmianie pola).
3. Użytkownik klika „Utwórz konto”.
4. UI:
   - ustawia `isSubmitting=true`
   - blokuje pola i przycisk
   - wywołuje `supabase.auth.signUp`
5. Sukces:
   - jeśli jest sesja → przekierowanie do `/dashboard`
   - jeśli sesji brak → informacja o konieczności potwierdzenia email (toast + inline message)
6. Błąd:
   - jeśli błąd związany z polem (np. invalid email) → inline pod polem
   - jeśli błąd ogólny → toast + opcjonalnie `errors.form`

## 9. Warunki i walidacja

### 9.1 Warunki weryfikowane przez UI
- Email:
  - niepusty
  - poprawny format
- Hasło:
  - niepuste
  - minimalna długość zgodna z polityką (minimum rekomendowane ≥ 8)

### 9.2 Jak warunki wpływają na UI
- `SubmitButton` disabled, gdy:
  - trwa request (`isSubmitting`)
  - walidacja klienta nie przeszła
- Błędy per pole:
  - renderowane jako tekst pod polem
  - `aria-invalid=true` na input
  - `aria-describedby` wskazuje element błędu
- Błąd ogólny:
  - toast (preferowane) lub blok `role="alert"` nad przyciskiem
- Stan „tworzenie konta…”:
  - zmiana tekstu na przycisku
  - opcjonalnie spinner

### 9.3 Warunki wymagane przez „API” (Supabase Auth) i jak je mapować
- Supabase wymaga:
  - poprawnego email
  - hasła spełniającego minimalne wymagania (konfigurowalne)
- UI powinien mapować typowe błędy:
  - email w złym formacie → `errors.email`
  - email już użyty → komunikat ogólny (nie sugerować nadmiernie szczegółów) lub pod email
  - słabe hasło → `errors.password`
  - rate limit / problemy sieciowe → toast + `errors.form`

## 10. Obsługa błędów

### 10.1 Scenariusze błędów (rekomendowane pokrycie)
- Email już istnieje / konto już utworzone:
  - komunikat: „Nie udało się utworzyć konta. Spróbuj się zalogować lub użyj innego emaila.”
  - CTA: link do `/login`
- Niepoprawny email:
  - inline pod polem email
- Hasło zbyt słabe / zbyt krótkie:
  - inline pod polem hasła
- Brak internetu / timeout:
  - toast: „Problem z połączeniem. Spróbuj ponownie.”
- Supabase zwraca brak sesji (wymagana weryfikacja email):
  - toast / inline: „Sprawdź skrzynkę i potwierdź email, aby dokończyć rejestrację.”
  - opcjonalnie: przycisk „Przejdź do logowania”
- Nieoczekiwany błąd:
  - toast ogólny + logowanie do konsoli (tylko w dev)

### 10.2 Zasady bezpieczeństwa i prywatności
- Nie wyświetlać surowych komunikatów technicznych.
- Nie logować wrażliwych danych (hasła) do konsoli.
- Nie przechowywać hasła w localStorage.

## 11. Kroki implementacji
1. Dodać stronę routingu `src/pages/register.astro` z osadzeniem `RegisterForm` (React) oraz linkiem do `/login`.
2. Ustalić wspólny layout dla strefy publicznej:
   - wykorzystać istniejący `src/layouts/Layout.astro` albo dodać `src/layouts/AuthLayout.astro`.
3. Zaimplementować klienta Supabase dla przeglądarki:
   - upewnić się, że używane env var są dostępne po stronie klienta (np. `PUBLIC_*`).
4. Dodać `RegisterForm` (React) oraz (opcjonalnie) subkomponenty `EmailField` i `PasswordField`.
5. Dodać walidację klienta:
   - required + email format + minimalna długość hasła.
6. Zaimplementować `useRegisterForm`:
   - stan, walidacja, mapowanie błędów Supabase, blokada submitu.
7. Dodać stan „tworzenie konta…”:
   - disabled inputs + spinner/zmiana tekstu.
8. Obsłużyć sukces:
   - jeśli sesja → redirect do `/dashboard`.
   - jeśli brak sesji → komunikat „potwierdź email” i CTA do `/login`.
9. Dodać obsługę błędów:
   - inline dla pól, toast dla błędów ogólnych.
10. Dodać przekierowanie wstępne (gdy user ma sesję):
   - w `RegisterPage` lub w samym `RegisterForm`.
11. Sprawdzić dostępność:
   - poprawne `label`, `autocomplete`, `aria-invalid`, `aria-describedby`, focus states.
12. (Opcjonalnie) Ujednolicić zachowanie `/login` i `/register`:
   - wspólne komponenty pól, wspólny toast, wspólne helpery (np. `useSafeRedirect`).
