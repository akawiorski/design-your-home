# Specyfikacja Techniczna: Moduł Autentykacji
## Design Your Home - System Rejestracji, Logowania i Odzyskiwania Hasła

**Wersja:** 1.0  
**Data:** 23 stycznia 2026  
**Status:** Do implementacji

---

## 1. WPROWADZENIE

### 1.1 Cel dokumentu
Dokument definiuje architekturę techniczną modułu autentykacji użytkowników w aplikacji Design Your Home, obejmującego funkcjonalności: rejestracji, logowania, wylogowywania oraz odzyskiwania hasła. Specyfikacja zapewnia zgodność z wymaganiami US-007 z dokumentu PRD oraz integralność z istniejącą architekturą aplikacji.

### 1.2 Zakres funkcjonalny
Moduł autentykacji obejmuje:
- **Rejestrację** nowych użytkowników (email + hasło + potwierdzenie hasła)
- **Logowanie** istniejących użytkowników (email + hasło)
- **Wylogowywanie** z aktywnej sesji
- **Odzyskiwanie hasła** poprzez link resetujący wysyłany na email
- **Ochronę tras** wymagających autentykacji przed dostępem nieautoryzowanym
- **Zarządzanie sesją** z wykorzystaniem Supabase Auth

### 1.3 Założenia projektowe
- Brak zewnętrznych providerów OAuth (Google, GitHub) w MVP
- Wszystkie funkcje generowania inspiracji wymagają autentykacji
- Wykorzystanie Supabase Auth jako backend autentykacji
- Client-side session management z wykorzystaniem Supabase SDK
- Middleware Astro do udostępniania klienta Supabase w kontekście
- Walidacja danych po stronie klienta (React) i serwera (API endpoints)

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Struktura stron i widoków

#### 2.1.1 Strefa publiczna (bez wymaganej autentykacji)

**A. Strona główna (`/`)**
- **Plik:** `src/pages/index.astro` (istniejący)
- **Status:** Rozszerzenie istniejącej funkcjonalności
- **Opis:** Strona startowa z komponentem `AuthRedirector` automatycznie przekierowującym użytkownika
- **Zachowanie:**
  - Sprawdza sesję użytkownika po załadowaniu
  - Użytkownik zalogowany → przekierowanie do `/dashboard`
  - Użytkownik niezalogowany → przekierowanie do `/login`
  - Obsługa query param `returnTo` dla powrotu do żądanej strony po logowaniu
- **Komponenty:**
  - `AuthRedirector` (React, client:load) - istniejący
  - `Spinner` - wskaźnik ładowania podczas sprawdzania sesji

**B. Strona logowania (`/login`)**
- **Plik:** `src/pages/login.astro` (istniejący)
- **Status:** Rozszerzenie istniejącej funkcjonalności
- **Opis:** Dedykowana strona do logowania użytkowników
- **Zachowanie:**
  - Jeśli użytkownik ma aktywną sesję → automatyczne przekierowanie do `/dashboard`
  - Wyświetla formularz logowania
  - Obsługuje parametr `redirectTo` z query string
- **Elementy UI:**
  - Nagłówek: "Zaloguj się"
  - Podnagłówek: "Wprowadź adres email i hasło, aby uzyskać dostęp do swojego projektu."
  - Formularz logowania (`LoginForm`)
  - Link do rejestracji: "Nie masz konta? Zarejestruj się"
  - Link do odzyskiwania hasła: "Zapomniałeś hasła?"
- **Layout:** `Layout.astro` (bez nagłówka nawigacyjnego)
- **Modyfikacje:**
  - Dodanie linku do `/register`
  - Dodanie linku do `/forgot-password`

**C. Strona rejestracji (`/register`)**
- **Plik:** `src/pages/register.astro` (nowy)
- **Status:** Do utworzenia
- **Opis:** Dedykowana strona do rejestracji nowych użytkowników
- **Zachowanie:**
  - Jeśli użytkownik ma aktywną sesję → automatyczne przekierowanie do `/dashboard`
  - Wyświetla formularz rejestracji
  - Po sukcesie → przekierowanie do `/login` z komunikatem o konieczności potwierdzenia emaila
- **Elementy UI:**
  - Nagłówek: "Utwórz konto"
  - Podnagłówek: "Wprowadź swoje dane, aby rozpocząć projektowanie wnętrz."
  - Formularz rejestracji (`RegisterForm`)
  - Link do logowania: "Masz już konto? Zaloguj się"
- **Layout:** `Layout.astro` (bez nagłówka nawigacyjnego)

**D. Strona odzyskiwania hasła (`/forgot-password`)**
- **Plik:** `src/pages/forgot-password.astro` (nowy)
- **Status:** Do utworzenia
- **Opis:** Strona inicjująca proces odzyskiwania hasła
- **Zachowanie:**
  - Wyświetla formularz z polem email
  - Po wysłaniu → wyświetla komunikat o wysłaniu linku resetującego
  - Nie wymaga sesji (publiczna)
- **Elementy UI:**
  - Nagłówek: "Odzyskaj hasło"
  - Podnagłówek: "Podaj adres email, a wyślemy Ci link do resetowania hasła."
  - Formularz (`ForgotPasswordForm`)
  - Link powrotu: "Powrót do logowania"
- **Layout:** `Layout.astro` (bez nagłówka nawigacyjnego)

**E. Strona resetowania hasła (`/reset-password`)**
- **Plik:** `src/pages/reset-password.astro` (nowy)
- **Status:** Do utworzenia
- **Opis:** Strona do ustawienia nowego hasła po kliknięciu w link z emaila
- **Zachowanie:**
  - Waliduje token resetowania z query params
  - Wyświetla formularz z dwoma polami hasła
  - Po sukcesie → przekierowanie do `/login` z komunikatem o zmianie hasła
  - Przy nieprawidłowym/wygasłym tokenie → komunikat błędu
- **Elementy UI:**
  - Nagłówek: "Ustaw nowe hasło"
  - Podnagłówek: "Wprowadź nowe hasło dla swojego konta."
  - Formularz (`ResetPasswordForm`)
- **Layout:** `Layout.astro` (bez nagłówka nawigacyjnego)

#### 2.1.2 Strefa prywatna (wymaga autentykacji)

**A. Dashboard (`/dashboard`)**
- **Plik:** `src/pages/dashboard/index.astro` (istniejący)
- **Status:** Rozszerzenie o kontrolę dostępu
- **Modyfikacje:**
  - Dodanie server-side sprawdzania sesji
  - Przekierowanie do `/login?redirectTo=/dashboard` przy braku sesji
- **Layout:** `Layout.astro` z nagłówkiem zawierającym przycisk wylogowania

**B. Strona pokoju (`/rooms/[roomId]`)**
- **Plik:** `src/pages/rooms/[roomId].astro` (istniejący)
- **Status:** Rozszerzenie o kontrolę dostępu
- **Modyfikacje:**
  - Dodanie server-side sprawdzania sesji
  - Przekierowanie do `/login?redirectTo=/rooms/{roomId}` przy braku sesji
- **Layout:** `Layout.astro` z nagłówkiem zawierającym przycisk wylogowania

### 2.2 Komponenty React

#### 2.2.1 Istniejące komponenty do modyfikacji

**A. LoginForm (`src/components/auth/LoginForm.tsx`)**
- **Status:** Istniejący, wymaga rozszerzenia
- **Odpowiedzialności:**
  - Obsługa formularza logowania (email + hasło)
  - Walidacja po stronie klienta
  - Integracja z Supabase Auth (`signInWithPassword`)
  - Zarządzanie stanem formularza i błędów
  - Przekierowanie po sukcesie
- **Props:**
  - `redirectTo?: string | null` - cel przekierowania po logowaniu
  - `supabaseUrl?: string | null` - URL Supabase (fallback)
  - `supabaseKey?: string | null` - Supabase anon key (fallback)
- **Stan wewnętrzny:**
  - `values: { email: string, password: string }`
  - `touched: { email: boolean, password: boolean }`
  - `hasSubmitted: boolean`
  - `isSubmitting: boolean`
  - `formError: string | null`
  - `isCheckingSession: boolean`
  - `isSupabaseReady: boolean`
- **Walidacja:**
  - Email: required, format email
  - Hasło: required, minimum 4 znaki
- **Obsługa błędów:**
  - Mapowanie błędów Supabase na komunikaty w języku polskim
  - "Email not confirmed" → "Sprawdź skrzynkę i potwierdź adres email."
  - "Rate limit" → "Zbyt wiele prób. Spróbuj ponownie za chwilę."
  - Default → "Nieprawidłowy email lub hasło."
- **Modyfikacje:**
  - Dodanie linków do `/register` i `/forgot-password` (przekazanych jako props z Astro)

**B. AuthRedirector (`src/components/auth/AuthRedirector.tsx`)**
- **Status:** Istniejący, bez zmian
- **Odpowiedzialności:**
  - Sprawdzanie sesji przy załadowaniu strony głównej
  - Automatyczne przekierowanie do `/login` lub `/dashboard`
  - Obsługa parametru `returnTo`
  - Wyświetlanie spinnera podczas sprawdzania
- **Zachowanie:**
  - Wywołuje `supabaseClient.auth.getSession()`
  - Waliduje i sanitizuje parametr `returnTo` (bezpieczeństwo)
  - Przekierowanie window.location.href (client-side navigation)

#### 2.2.2 Nowe komponenty do utworzenia

**A. RegisterForm (`src/components/auth/RegisterForm.tsx`)**
- **Plik:** Nowy komponent
- **Odpowiedzialności:**
  - Obsługa formularza rejestracji
  - Walidacja email, hasła i potwierdzenia hasła
  - Integracja z Supabase Auth (`signUp`)
  - Wyświetlanie komunikatu o konieczności potwierdzenia emaila
- **Props:**
  - `supabaseUrl?: string | null`
  - `supabaseKey?: string | null`
- **Pola formularza:**
  - Email (type="email", required, aria-required, autocomplete="email")
  - Hasło (type="password", required, aria-required, autocomplete="new-password")
  - Potwierdzenie hasła (type="password", required, aria-required, autocomplete="new-password")
- **Stan wewnętrzny:**
  - `values: { email: string, password: string, confirmPassword: string }`
  - `touched: { email: boolean, password: boolean, confirmPassword: boolean }`
  - `hasSubmitted: boolean`
  - `isSubmitting: boolean`
  - `formError: string | null`
  - `registrationSuccess: boolean`
- **Walidacja:**
  - Email: required, format email
  - Hasło: required, minimum 4 znaki
  - Potwierdzenie: zgodność z hasłem
- **Komunikaty:**
  - Sukces: "Konto utworzone! Sprawdź swoją skrzynkę email i kliknij w link aktywacyjny."
  - Błąd "User already registered" → "Konto z tym adresem już istnieje."
- **Zachowanie po sukcesie:**
  - Wyświetlenie komunikatu sukcesu na stronie rejestracji
  - Wyświetlenie przycisku "Przejdź do logowania" → `/login`
  - NIE automatyczne logowanie (wymaga potwierdzenia emaila)

**B. ForgotPasswordForm (`src/components/auth/ForgotPasswordForm.tsx`)**
- **Plik:** Nowy komponent
- **Odpowiedzialności:**
  - Obsługa formularza z jednym polem (email)
  - Wywołanie Supabase Auth `resetPasswordForEmail`
  - Wyświetlanie komunikatu o wysłaniu linku
- **Props:**
  - `supabaseUrl?: string | null`
  - `supabaseKey?: string | null`
- **Pola formularza:**
  - Email (type="email", required)
- **Stan wewnętrzny:**
  - `email: string`
  - `isSubmitting: boolean`
  - `emailSent: boolean`
  - `formError: string | null`
- **Walidacja:**
  - Email: required, format email
- **Komunikaty:**
  - Sukces: "Jeśli konto z tym adresem istnieje, wyślemy na nie link do resetowania hasła."
  - Błąd: "Wystąpił błąd. Spróbuj ponownie."
- **Bezpieczeństwo:**
  - Nie ujawniamy czy email istnieje w bazie (zawsze ten sam komunikat sukcesu)

**C. ResetPasswordForm (`src/components/auth/ResetPasswordForm.tsx`)**
- **Plik:** Nowy komponent
- **Odpowiedzialności:**
  - Obsługa formularza z nowym hasłem i potwierdzeniem
  - Walidacja tokenu resetowania (z Supabase session)
  - Wywołanie Supabase Auth `updateUser` z nowym hasłem
  - Przekierowanie do logowania po sukcesie
- **Props:**
  - `supabaseUrl?: string | null`
  - `supabaseKey?: string | null`
- **Pola formularza:**
  - Nowe hasło (type="password", required)
  - Potwierdzenie nowego hasła (type="password", required)
- **Stan wewnętrzny:**
  - `values: { password: string, confirmPassword: string }`
  - `isSubmitting: boolean`
  - `tokenValid: boolean | null`
  - `formError: string | null`
  - `resetSuccess: boolean`
- **Walidacja:**
  - Hasło: required, minimum 4 znaki
  - Potwierdzenie: zgodność z hasłem
- **Zachowanie:**
  - Sprawdzenie obecności tokenu w URL (Supabase automatycznie parsuje hash)
  - Jeśli token nieważny → komunikat "Link wygasł lub jest nieprawidłowy. Spróbuj ponownie."
  - Po sukcesie → przekierowanie do `/login` z komunikatem "Hasło zostało zmienione. Możesz się teraz zalogować."

**D. UserMenu (`src/components/layout/UserMenu.tsx`)**
- **Plik:** Nowy komponent
- **Odpowiedzialności:**
  - Wyświetlanie przycisku wylogowania w nagłówku
  - Obsługa kliknięcia w wylogowanie
  - Wywołanie `supabaseClient.auth.signOut()`
  - Przekierowanie do `/login` po wylogowaniu
- **Props:**
  - `userEmail?: string` - opcjonalnie email użytkownika do wyświetlenia
- **Elementy UI:**
  - Przycisk/link "Wyloguj" w prawym górnym rogu
  - Opcjonalnie: dropdown z emailem użytkownika i opcją wylogowania (dla lepszego UX)
- **Zachowanie:**
  - Kliknięcie w "Wyloguj" → wywołanie `signOut()` → window.location.href = "/login"
  - Wyświetlanie spinnera podczas wylogowywania (optional)

### 2.3 Modyfikacje layoutu

**A. Layout.astro (`src/layouts/Layout.astro`)**
- **Status:** Istniejący, wymaga rozszerzenia
- **Modyfikacje:**
  - Dodanie warunkowego renderowania nagłówka z `UserMenu`
  - Sprawdzenie sesji server-side w Astro frontmatter
  - Przekazanie informacji o sesji do komponentu nagłówka
- **Struktura:**
  ```astro
  ---
  const { title } = Astro.props;
  const supabase = Astro.locals.supabase;
  
  // Server-side session check
  let session = null;
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  }
  
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(Astro.url.pathname);
  const showHeader = session && !isAuthPage;
  ---
  
  <html>
    <head>...</head>
    <body>
      {showHeader && (
        <header>
          <nav>
            <a href="/dashboard">Dashboard</a>
            <UserMenu client:load userEmail={session.user.email} />
          </nav>
        </header>
      )}
      <div class="container">
        <slot />
      </div>
      <Toaster client:only="react" />
    </body>
  </html>
  ```

### 2.4 Walidacja i komunikaty błędów

#### 2.4.1 Walidacja client-side (React komponenty)

**Reguły walidacji:**

| Pole | Typ | Required | Min. długość | Maksymalna | Format | Komunikat błędu |
|------|-----|----------|--------------|------------|--------|-----------------|
| Email | text/email | Tak | - | 255 | email pattern | "Podaj poprawny adres email." |
| Hasło (login) | password | Tak | 4 | - | - | "Hasło powinno mieć co najmniej 4 znaków." |
| Hasło (rejestracja) | password | Tak | 4 | - | - | "Hasło powinno mieć co najmniej 4 znaków." |
| Potwierdzenie hasła | password | Tak | - | - | match | "Hasła nie są identyczne." |

**Wzorce walidacji:**
```typescript
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 4;
```

**Strategia wyświetlania błędów:**
- Błędy pól wyświetlane po:
  - Opuszczeniu pola (onBlur) - touched state
  - Próbie submit (hasSubmitted = true)
- Błędy formularza (auth errors) wyświetlane nad formularzem
- ARIA attributes: `aria-invalid`, `aria-describedby` dla pól z błędami

#### 2.4.2 Komunikaty błędów autentykacji

**Mapowanie błędów Supabase:**

| Kod błędu Supabase | Komunikat dla użytkownika |
|-------------------|---------------------------|
| `Invalid login credentials` | "Nieprawidłowy email lub hasło." |
| `Email not confirmed` | "Sprawdź skrzynkę i potwierdź adres email." |
| `User already registered` | "Konto z tym adresem już istnieje." |
| `Rate limit exceeded` | "Zbyt wiele prób. Spróbuj ponownie za chwilę." |
| `Invalid or expired token` | "Link wygasł lub jest nieprawidłowy." |
| Domyślny | "Wystąpił błąd. Spróbuj ponownie." |

#### 2.4.3 Komunikaty sukcesu

| Akcja | Komunikat | Lokalizacja |
|-------|-----------|-------------|
| Rejestracja | "Konto utworzone! Sprawdź swoją skrzynkę email i kliknij w link aktywacyjny." | RegisterForm (inline) |
| Wysłanie linku resetującego | "Jeśli konto z tym adresem istnieje, wyślemy na nie link do resetowania hasła." | ForgotPasswordForm (inline) |
| Reset hasła | "Hasło zostało zmienione. Możesz się teraz zalogować." | Toast po przekierowaniu do /login |
| Logowanie | Brak (automatyczne przekierowanie) | - |
| Wylogowanie | Brak (automatyczne przekierowanie) | - |

### 2.5 Accessibility (A11y)

**Wymagania dostępności:**
- Wszystkie pola formularzy z `<label>` powiązanymi przez `htmlFor`
- Błędy walidacji powiązane z polami przez `aria-describedby`
- `aria-invalid="true"` dla pól z błędami
- `aria-live="polite"` dla komunikatów błędów formularza
- `aria-busy="true"` podczas submitu
- Spinnery z `<span className="sr-only">` tekstem dla screen readerów
- Focus management: błędy focusują pierwsze nieprawidłowe pole
- Nawigacja klawiaturą (Tab, Enter) w pełni funkcjonalna
- Kontrast kolorów minimum 4.5:1 (WCAG AA)

---

## 3. LOGIKA BACKENDOWA

### 3.1 Endpointy API

Moduł autentykacji **NIE wymaga** tworzenia dedykowanych endpointów API w aplikacji Astro, ponieważ całość uwierzytelniania jest obsługiwana przez **Supabase Auth** bezpośrednio z klienta poprzez SDK.

**Supabase Auth SDK - metody wykorzystywane:**

| Metoda | Cel | Wywołanie z |
|--------|-----|-------------|
| `supabase.auth.signUp()` | Rejestracja użytkownika | RegisterForm.tsx |
| `supabase.auth.signInWithPassword()` | Logowanie użytkownika | LoginForm.tsx |
| `supabase.auth.signOut()` | Wylogowanie użytkownika | UserMenu.tsx |
| `supabase.auth.resetPasswordForEmail()` | Inicjacja resetowania hasła | ForgotPasswordForm.tsx |
| `supabase.auth.updateUser()` | Ustawienie nowego hasła | ResetPasswordForm.tsx |
| `supabase.auth.getSession()` | Pobranie aktywnej sesji | AuthRedirector, LoginForm, server-side |

### 3.2 Middleware Astro

**Plik:** `src/middleware/index.ts` (istniejący)

**Status:** Istniejący, wymaga rozszerzenia

**Aktualna funkcjonalność:**
- Udostępnia klienty Supabase w `context.locals`
- `context.locals.supabase` - klient z anon key
- `context.locals.supabaseAdmin` - klient z service role key

**Rozszerzenia:**
- Dodanie sprawdzania sesji server-side
- Udostępnienie informacji o sesji w `context.locals.session`
- Przekierowanie do `/login` dla chronionych tras bez sesji

**Implementacja:**

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient, supabaseServiceClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Existing: Provide Supabase clients
  context.locals.supabase = supabaseClient;
  context.locals.supabaseAdmin = supabaseServiceClient ?? supabaseClient;
  
  // New: Check session server-side
  let session = null;
  if (supabaseClient) {
    try {
      const { data } = await supabaseClient.auth.getSession();
      session = data.session;
    } catch (error) {
      console.error("Error getting session in middleware:", error);
    }
  }
  
  context.locals.session = session;
  
  // Protected routes - require authentication
  const protectedRoutes = ['/dashboard', '/rooms'];
  const pathname = context.url.pathname;
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Auth pages - redirect if already logged in
  const authPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPages.includes(pathname);
  
  if (isProtectedRoute && !session) {
    // Redirect to login with returnTo parameter
    const redirectTo = encodeURIComponent(pathname + context.url.search);
    return context.redirect(`/login?redirectTo=${redirectTo}`);
  }
  
  if (isAuthPage && session) {
    // Redirect to dashboard if already authenticated
    return context.redirect('/dashboard');
  }
  
  return next();
});
```

**Rozszerzenie typu Locals:**

**Plik:** `src/env.d.ts` (istniejący, wymaga rozszerzenia)

```typescript
/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client";
import type { Session } from "@supabase/supabase-js";

declare namespace App {
  interface Locals {
    supabase: SupabaseClient | null;
    supabaseAdmin: SupabaseClient | null;
    session: Session | null; // New
  }
}
```

### 3.3 Modyfikacje endpointów API

**Status:** Istniejące endpointy wymagają modyfikacji

**Zmiana:** Usunięcie `DEFAULT_USER_ID` i wykorzystanie `locals.session.user.id`

**Przykładowy wzorzec:**

```typescript
// Before (MVP placeholder):
const userId = DEFAULT_USER_ID;

// After (with authentication):
const userId = locals.session?.user?.id;

if (!userId) {
  return errorResponse(
    401, 
    "AUTHENTICATION_REQUIRED", 
    "Authentication is required to access this resource."
  );
}
```

**Endpointy do modyfikacji:**
- `src/pages/api/rooms/index.ts` - GET, POST
- `src/pages/api/rooms/[roomId]/index.ts` - GET
- `src/pages/api/rooms/[roomId]/photos/index.ts` - GET, POST
- `src/pages/api/rooms/[roomId]/photos/upload-url.ts` - POST
- `src/pages/api/rooms/[roomId]/generate.ts` - POST
- `src/pages/api/rooms/[roomId]/generate-simple.ts` - POST
- `src/pages/api/analytics/events.ts` - POST

**Wspólny wzorzec modyfikacji:**

1. Usunięcie importu `DEFAULT_USER_ID`
2. Zamiana linii pobierania userId:
   ```typescript
   const userId = locals.session?.user?.id;
   ```
3. Dodanie sprawdzenia autentykacji (jeśli jeszcze nie istnieje):
   ```typescript
   if (!userId) {
     return errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
   }
   ```

### 3.4 Walidacja danych wejściowych

**Wykorzystanie:** Biblioteka Zod (już wykorzystywana w projekcie)

**Schematy walidacji dla formularzy (frontend):**

```typescript
// src/lib/validation/auth.schemas.ts (nowy plik)
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Podaj poprawny adres email."),
  password: z.string().min(4, "Hasło powinno mieć co najmniej 4 znaków."),
});

export const registerSchema = z.object({
  email: z.string().email("Podaj poprawny adres email."),
  password: z.string().min(4, "Hasło powinno mieć co najmniej 4 znaków."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są identyczne.",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Podaj poprawny adres email."),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(4, "Hasło powinno mieć co najmniej 4 znaków."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są identyczne.",
  path: ["confirmPassword"],
});
```

**Wykorzystanie w komponentach React:**

```typescript
// Przykład w RegisterForm.tsx
import { registerSchema } from "../../lib/validation/auth.schemas";

const validateForm = (values: RegisterFormValues) => {
  try {
    registerSchema.parse(values);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.flatten().fieldErrors;
    }
    return {};
  }
};
```

### 3.5 Obsługa wyjątków

**Strategia obsługi błędów:**

1. **Błędy Supabase Auth** - mapowane na komunikaty użytkownika
2. **Błędy walidacji** - wyświetlane inline przy polach
3. **Błędy sieciowe** - ogólny komunikat + retry
4. **Błędy konfiguracji** - komunikat o niedostępności usługi

**Wzorzec obsługi błędów w komponentach:**

```typescript
try {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });
  
  if (error) {
    // Map Supabase error to user-friendly message
    setFormError(mapAuthErrorMessage(error.message));
    return;
  }
  
  // Success - redirect
  window.location.href = redirectTo ?? "/dashboard";
  
} catch (error) {
  // Network or unexpected errors
  setFormError("Wystąpił błąd połączenia. Sprawdź połączenie internetowe.");
  console.error("Unexpected error:", error);
}
```

**Logowanie błędów:**

- **Development:** `console.error` dla debugowania
- **Production:** Supabase automatycznie loguje błędy Auth
- **Opcjonalnie:** Integracja z analytics service (istniejący `analytics.service.ts`)

---

## 4. SYSTEM AUTENTYKACJI

### 4.1 Supabase Auth - konfiguracja

**Provider:** Supabase Auth (managed service)

**Metoda autentykacji:** Email + Password

**Konfiguracja email templates (Supabase Dashboard):**

1. **Confirmation Email** (po rejestracji)
   - Template: "Potwierdź swój adres email"
   - Link aktywacyjny: `{{ .ConfirmationURL }}`
   - Redirect URL: `https://your-domain.com/login`

2. **Password Recovery Email**
   - Template: "Resetuj swoje hasło"
   - Link resetujący: `{{ .ResetURL }}`
   - Redirect URL: `https://your-domain.com/reset-password`

**Konfiguracja Redirect URLs (Supabase Dashboard):**
- Dodanie `https://your-domain.com/reset-password` do Redirect URLs
- Dodanie `http://localhost:4321/reset-password` dla development

**Token TTL:**
- Session token: 1 godzina (domyślnie)
- Refresh token: 30 dni (domyślnie)
- Password reset token: 1 godzina

### 4.2 Flow uwierzytelniania

#### 4.2.1 Flow rejestracji

1. **Użytkownik:**
   - Otwiera `/register`
   - Wypełnia formularz (email, hasło, potwierdzenie hasła)
   - Klika "Zarejestruj się"

2. **Frontend (RegisterForm):**
   - Waliduje dane client-side
   - Wywołuje `supabase.auth.signUp({ email, password })`
   - Odbiera odpowiedź z Supabase

3. **Supabase Auth:**
   - Tworzy użytkownika w bazie `auth.users`
   - Ustawia status `email_confirmed = false`
   - Wysyła email z linkiem potwierdzającym
   - Zwraca sukces do frontendu

4. **Frontend:**
   - Wyświetla komunikat: "Sprawdź email i kliknij w link aktywacyjny"
   - Pokazuje przycisk "Przejdź do logowania" → `/login`

5. **Użytkownik:**
   - Otwiera email
   - Klika w link potwierdzający
   - Zostaje przekierowany do `/login`

6. **Backend (Supabase):**
   - Zmienia status na `email_confirmed = true`
   - Użytkownik może się zalogować

#### 4.2.2 Flow logowania

1. **Użytkownik:**
   - Otwiera `/login` (bezpośrednio lub przekierowany z `/`)
   - Wypełnia formularz (email, hasło)
   - Klika "Zaloguj się"

2. **Frontend (LoginForm):**
   - Waliduje dane client-side
   - Wywołuje `supabase.auth.signInWithPassword({ email, password })`

3. **Supabase Auth:**
   - Weryfikuje credentials
   - Sprawdza status `email_confirmed`
   - Generuje session token (JWT) i refresh token
   - Zapisuje sesję w localStorage/sessionStorage (Supabase SDK)
   - Zwraca sesję i user object

4. **Frontend:**
   - Zapisuje sesję w Supabase client (automatycznie przez SDK)
   - Przekierowuje do `redirectTo` lub `/dashboard`

5. **Middleware (kolejne requesty):**
   - Sprawdza sesję server-side przez `supabase.auth.getSession()`
   - Udostępnia `locals.session` dla stron i API

#### 4.2.3 Flow wylogowania

1. **Użytkownik:**
   - Klika "Wyloguj" w UserMenu

2. **Frontend (UserMenu):**
   - Wywołuje `supabase.auth.signOut()`

3. **Supabase Auth:**
   - Usuwa sesję z localStorage
   - Invaliduje refresh token
   - Zwraca sukces

4. **Frontend:**
   - Przekierowuje do `/login`

5. **Middleware (kolejne requesty):**
   - `locals.session` będzie `null`
   - Chronione trasy przekierują do `/login`

#### 4.2.4 Flow odzyskiwania hasła

1. **Użytkownik:**
   - Otwiera `/login`
   - Klika "Zapomniałeś hasła?"
   - Zostaje przekierowany do `/forgot-password`

2. **Frontend (ForgotPasswordForm):**
   - Użytkownik podaje email
   - Klika "Wyślij link resetujący"
   - Formularz wywołuje `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })`

3. **Supabase Auth:**
   - Sprawdza czy email istnieje w bazie
   - Generuje jednorazowy token resetowania
   - Wysyła email z linkiem: `https://your-domain.com/reset-password#token=...`
   - Zwraca sukces (niezależnie czy email istnieje - bezpieczeństwo)

4. **Frontend:**
   - Wyświetla komunikat: "Jeśli konto istnieje, wysłaliśmy link"

5. **Użytkownik:**
   - Otwiera email
   - Klika w link resetujący
   - Zostaje przekierowany do `/reset-password#token=...`

6. **Frontend (ResetPasswordForm):**
   - Supabase SDK automatycznie parsuje token z hash
   - Tworzy tymczasową sesję z tokenem resetowania
   - Formularz wywołuje `supabase.auth.updateUser({ password: newPassword })`

7. **Supabase Auth:**
   - Weryfikuje token
   - Aktualizuje hasło użytkownika
   - Invaliduje token
   - Zwraca sukces

8. **Frontend:**
   - Wyświetla toast: "Hasło zmienione"
   - Przekierowuje do `/login`

### 4.3 Zarządzanie sesją

**Storage:** Supabase SDK automatycznie zarządza przechowywaniem sesji

**Lokalizacja:**
- `localStorage` - domyślnie (persist between tabs)
- Klucz: `supabase.auth.token`
- Wartość: JSON z `access_token`, `refresh_token`, `expires_at`, `user`

**Lifecycle:**
- **Access token TTL:** 1 godzina
- **Refresh token TTL:** 30 dni
- **Auto-refresh:** Supabase SDK automatycznie odświeża token przed wygaśnięciem

**Server-side session check:**

```typescript
// W middleware lub w Astro page frontmatter
const { data } = await supabase.auth.getSession();
const session = data.session; // null jeśli brak sesji
const user = session?.user; // user object jeśli zalogowany
```

**Client-side session check:**

```typescript
// W komponencie React
const { data } = await supabaseClient.auth.getSession();
const session = data.session;
```

**Session refresh handling:**
- Supabase SDK automatycznie odświeża token w tle
- Jeśli refresh token wygasł → sesja staje się null
- Middleware przekierowuje do `/login`

**Session events (optional):**

```typescript
// Nasłuchiwanie na zmiany sesji (optional dla zaawansowanych przypadków)
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Clear local state
  }
  if (event === 'SIGNED_IN') {
    // Update local state
  }
});
```

### 4.4 Bezpieczeństwo

#### 4.4.1 Ochrona przed atakami

**Cross-Site Scripting (XSS):**
- React automatycznie escapuje dane wejściowe
- Nie używamy `dangerouslySetInnerHTML` w formularzach
- Sanityzacja parametrów URL (`redirectTo`)

**Cross-Site Request Forgery (CSRF):**
- Supabase Auth używa JWT bez cookies (immune to CSRF)
- Same-Site policy dla ewentualnych cookies

**SQL Injection:**
- Brak bezpośrednich SQL queries w auth flow
- Supabase API używa parametryzowanych zapytań

**Brute Force:**
- Supabase ma wbudowane rate limiting
- Limit: ~10 nieudanych prób logowania / godzinę / IP
- Komunikat: "Zbyt wiele prób. Spróbuj ponownie za chwilę."

**Password Security:**
- Minimalna długość: 4 znaki
- Hashowanie: bcrypt (Supabase default)
- Brak przechowywania hasła w plain text (nigdy)

#### 4.4.2 Walidacja parametrów URL

**Funkcja sanityzacji `redirectTo`:**

```typescript
const getSafeRedirectPath = (value?: string | null): string | null => {
  if (!value) return null;
  
  const trimmed = value.trim();
  
  // Must start with /
  if (!trimmed.startsWith("/")) return null;
  
  // Prevent protocol-relative URLs (//evil.com)
  if (trimmed.startsWith("//") || trimmed.includes("://")) return null;
  
  return trimmed;
};
```

**Wykorzystanie:**
- W `LoginForm` - po sukcesie logowania
- W `AuthRedirector` - przy przekierowaniach
- W middleware - przy przekierowaniach do `/login`

#### 4.4.3 Email confirmation

**Wymaganie:** Potwierdzenie emaila przed pierwszym logowaniem

**Konfiguracja w Supabase Dashboard:**
- Authentication > Settings > Enable email confirmations: **ON**

**Obsługa w aplikacji:**
- Użytkownik po rejestracji nie może się zalogować bez potwierdzenia
- Błąd Supabase: "Email not confirmed"
- Komunikat: "Sprawdź skrzynkę i potwierdź adres email."

**Re-sending confirmation email (optional future enhancement):**
- Przycisk "Wyślij ponownie email" na `/login`
- Wywołanie `supabase.auth.resend({ type: 'signup', email })`

#### 4.4.4 Token security

**Access Token (JWT):**
- Przechowywany w localStorage (XSS risk mitigation: CSP headers)
- Krótki TTL (1h) minimalizuje ryzyko przejęcia
- Zawiera: user id, email, role, exp

**Refresh Token:**
- Przechowywany w localStorage
- Długi TTL (30 dni)
- Używany tylko do odświeżania access token
- Rotacja przy każdym refresh (Supabase default)

**Password Reset Token:**
- Jednorazowy, krótki TTL (1h)
- Przesyłany w URL hash (nie w query - bezpieczniejsze)
- Invalidowany po użyciu

**Content Security Policy (optional, recommended):**

```html
<!-- W Layout.astro <head> -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co;"
/>
```

---

## 5. KONTRAKT DANYCH

### 5.1 Typy TypeScript

**Plik:** `src/types.ts` (istniejący, wymaga rozszerzenia)

```typescript
// Existing imports...
import type { User, Session } from "@supabase/supabase-js";

// =============================================================================
// Authentication Types
// =============================================================================

/**
 * User session information from Supabase Auth
 */
export type AuthSession = Session;

/**
 * Authenticated user information
 */
export type AuthUser = User;

/**
 * Login form values
 */
export interface LoginFormValues {
  email: string;
  password: string;
}

/**
 * Registration form values
 */
export interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Forgot password form values
 */
export interface ForgotPasswordFormValues {
  email: string;
}

/**
 * Reset password form values
 */
export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

/**
 * Authentication error response from Supabase
 */
export interface AuthError {
  message: string;
  status?: number;
}
```

**Plik:** `src/env.d.ts` (rozszerzenie)

```typescript
/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client";
import type { Session } from "@supabase/supabase-js";

declare namespace App {
  interface Locals {
    supabase: SupabaseClient | null;
    supabaseAdmin: SupabaseClient | null;
    session: Session | null; // NEW
  }
}
```

### 5.2 Struktura sesji (Supabase)

**Session Object:**

```typescript
{
  access_token: string;        // JWT token
  refresh_token: string;       // Refresh token
  expires_in: number;          // TTL w sekundach
  expires_at: number;          // Unix timestamp
  token_type: "bearer";
  user: {
    id: string;                // UUID użytkownika
    aud: string;               // Audience (authenticated)
    role: string;              // Rola (authenticated)
    email: string;             // Email użytkownika
    email_confirmed_at: string; // ISO timestamp potwierdzenia
    created_at: string;        // ISO timestamp utworzenia
    updated_at: string;        // ISO timestamp aktualizacji
  }
}
```

### 5.3 User Object (Supabase)

```typescript
{
  id: string;                  // UUID
  aud: string;                 // Audience
  role: string;                // Role
  email: string;               // Email
  email_confirmed_at: string;  // Confirmation timestamp
  created_at: string;          // Creation timestamp
  updated_at: string;          // Update timestamp
  app_metadata: object;        // Application metadata
  user_metadata: object;       // User metadata (custom fields)
}
```

---

## 6. PLAN MIGRACJI

### 6.1 Migracja bazy danych

**Status:** Nie wymagana

**Uzasadnienie:**
- Supabase Auth zarządza tabelą `auth.users` automatycznie
- Tabela `rooms` już ma kolumnę `user_id uuid` z foreign key do `auth.users(id)`
- RLS policies mogą być włączone, ale w MVP API używa service_role key z własną autoryzacją

**Opcjonalne (dla lepszego zabezpieczenia w przyszłości):**

```sql
-- RLS policy dla tabeli rooms (opcjonalne)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rooms"
  ON rooms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rooms"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rooms"
  ON rooms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rooms"
  ON rooms FOR DELETE
  USING (auth.uid() = user_id);
```

### 6.2 Usunięcie DEFAULT_USER_ID

**Kroki:**

1. Zmodyfikuj wszystkie endpointy API (lista w sekcji 3.3)
2. Zamień `const userId = DEFAULT_USER_ID` na `const userId = locals.session?.user?.id`
3. Upewnij się, że sprawdzenie `if (!userId)` zwraca 401
4. Usuń eksport `DEFAULT_USER_ID` z `src/db/supabase.client.ts`
5. Usuń import `DEFAULT_USER_ID` ze wszystkich plików API

**Weryfikacja:**
- Uruchom testy API (istniejące testy wymagają aktualizacji - mock sesji)
- Przetestuj ręcznie flow logowania i dostęp do API

### 6.3 Aktualizacja testów

**Pliki do modyfikacji:**
- `src/components/auth/LoginForm.test.tsx` (istniejący, jeśli istnieje)
- `src/components/auth/AuthRedirector.test.tsx` (istniejący)
- `src/pages/api/rooms/[roomId]/index.test.ts` (istniejący)
- `src/pages/api/rooms/[roomId]/photos/index.test.ts` (istniejący)

**Nowe testy do utworzenia:**
- `src/components/auth/RegisterForm.test.tsx`
- `src/components/auth/ForgotPasswordForm.test.tsx`
- `src/components/auth/ResetPasswordForm.test.tsx`
- `src/components/layout/UserMenu.test.tsx`

**Mock sesji w testach API:**

```typescript
// Mock Astro locals with session
const mockLocals = {
  session: {
    user: { id: "test-user-id" }
  },
  supabase: mockSupabaseClient,
  supabaseAdmin: mockSupabaseAdminClient,
};
```

---

## 7. SCENARIUSZE UŻYCIA

### 7.1 Rejestracja nowego użytkownika

**Krok 1:** Użytkownik otwiera `/register`
- **Frontend:** Renderuje `RegisterForm`
- **Warunek:** Jeśli zalogowany → przekierowanie do `/dashboard` (middleware)

**Krok 2:** Użytkownik wypełnia formularz
- Email: user@example.com
- Hasło: Pass1234
- Potwierdzenie: Pass1234

**Krok 3:** Użytkownik klika "Zarejestruj się"
- **Walidacja client-side:** Sprawdzenie formatu email, długości hasła, zgodności haseł
- **Jeśli błąd:** Wyświetlenie komunikatów pod polami

**Krok 4:** Wysłanie request do Supabase
- **Frontend:** `supabase.auth.signUp({ email, password })`
- **Supabase:** Tworzy użytkownika, wysyła email

**Krok 5:** Sukces rejestracji
- **Frontend:** Wyświetla komunikat "Sprawdź email i kliknij w link"
- **UI:** Przycisk "Przejdź do logowania"

**Krok 6:** Użytkownik potwierdza email
- **Klik w link:** Przekierowanie do `/login`
- **Supabase:** Ustawia `email_confirmed_at`

**Krok 7:** Użytkownik może się zalogować
- Przejście do scenariusza logowania

### 7.2 Logowanie użytkownika

**Krok 1:** Użytkownik otwiera `/login`
- **Jeśli już zalogowany:** Middleware przekierowuje do `/dashboard`

**Krok 2:** Użytkownik wypełnia formularz
- Email: user@example.com
- Hasło: Pass1234

**Krok 3:** Użytkownik klika "Zaloguj się"
- **Walidacja client-side:** Format email, długość hasła

**Krok 4:** Wysłanie request do Supabase
- **Frontend:** `supabase.auth.signInWithPassword({ email, password })`

**Krok 5a:** Sukces logowania
- **Supabase:** Zwraca sesję i user object
- **Frontend:** Zapisuje sesję (automatycznie przez SDK)
- **Przekierowanie:** Do `redirectTo` lub `/dashboard`

**Krok 5b:** Błąd logowania - niepotwierdzone konto
- **Supabase:** Error "Email not confirmed"
- **Frontend:** Wyświetla "Sprawdź skrzynkę i potwierdź adres email."

**Krok 5c:** Błąd logowania - złe credentials
- **Supabase:** Error "Invalid login credentials"
- **Frontend:** Wyświetla "Nieprawidłowy email lub hasło."

**Krok 6:** Po przekierowaniu do `/dashboard`
- **Middleware:** Sprawdza `locals.session` → istnieje
- **Frontend:** Renderuje dashboard z `UserMenu`

### 7.3 Wylogowanie użytkownika

**Krok 1:** Użytkownik jest na `/dashboard`
- **UI:** Widoczny przycisk "Wyloguj" w prawym górnym rogu

**Krok 2:** Użytkownik klika "Wyloguj"
- **Frontend:** `UserMenu` wywołuje `supabase.auth.signOut()`

**Krok 3:** Supabase usuwa sesję
- **Supabase:** Invaliduje refresh token
- **Frontend:** Usuwa sesję z localStorage (automatycznie przez SDK)

**Krok 4:** Przekierowanie do `/login`
- **Frontend:** `window.location.href = "/login"`

**Krok 5:** Kolejne requesty
- **Middleware:** `locals.session` = null
- **Dostęp do `/dashboard`:** Przekierowanie do `/login`

### 7.4 Odzyskiwanie hasła

**Krok 1:** Użytkownik otwiera `/login`
- **UI:** Link "Zapomniałeś hasła?"

**Krok 2:** Użytkownik klika link
- **Przekierowanie:** Do `/forgot-password`

**Krok 3:** Użytkownik podaje email
- Email: user@example.com
- Klika "Wyślij link resetujący"

**Krok 4:** Wysłanie request do Supabase
- **Frontend:** `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })`
- **Supabase:** Generuje token, wysyła email

**Krok 5:** Komunikat sukcesu
- **Frontend:** "Jeśli konto istnieje, wysłaliśmy link"
- **Uwaga:** Ten sam komunikat niezależnie czy email istnieje (bezpieczeństwo)

**Krok 6:** Użytkownik otwiera email
- **Klik w link:** `https://domain.com/reset-password#access_token=...`

**Krok 7:** Strona `/reset-password`
- **Frontend:** `ResetPasswordForm` automatycznie wykrywa token (Supabase SDK parsuje hash)
- **UI:** Formularz z polami "Nowe hasło" i "Potwierdzenie"

**Krok 8:** Użytkownik wypełnia formularz
- Nowe hasło: NewPass456
- Potwierdzenie: NewPass456
- Klika "Zmień hasło"

**Krok 9:** Wysłanie request do Supabase
- **Frontend:** `supabase.auth.updateUser({ password: newPassword })`
- **Supabase:** Weryfikuje token, aktualizuje hasło

**Krok 10:** Sukces
- **Frontend:** Toast "Hasło zmienione"
- **Przekierowanie:** Do `/login`

**Krok 11:** Użytkownik loguje się nowym hasłem
- Przejście do scenariusza logowania

### 7.5 Dostęp do chronionej trasy

**Scenariusz A: Użytkownik zalogowany**

**Krok 1:** Użytkownik wpisuje `/rooms/abc-123` w przeglądarce
- **Middleware:** Sprawdza `locals.session`
- **Wynik:** Sesja istnieje

**Krok 2:** Middleware przepuszcza request
- **Strona:** Renderuje się normalnie
- **API calls:** Używają `locals.session.user.id`

**Scenariusz B: Użytkownik niezalogowany**

**Krok 1:** Użytkownik wpisuje `/rooms/abc-123` w przeglądarce
- **Middleware:** Sprawdza `locals.session`
- **Wynik:** Sesja = null

**Krok 2:** Middleware przekierowuje
- **Target:** `/login?redirectTo=/rooms/abc-123`

**Krok 3:** Użytkownik loguje się
- **Po sukcesie:** `LoginForm` odczytuje `redirectTo` z query
- **Przekierowanie:** Do `/rooms/abc-123`

---

## 8. WSKAŹNIKI SUKCESU

### 8.1 Kryteria akceptacji (zgodność z US-007)

| Wymaganie | Status | Weryfikacja |
|-----------|--------|-------------|
| Logowanie i rejestracja na dedykowanych stronach | ✅ | Strony `/login` i `/register` istnieją |
| Logowanie wymaga email + hasło | ✅ | `LoginForm` ma pola email i password |
| Rejestracja wymaga email + hasło + potwierdzenie | ✅ | `RegisterForm` ma wszystkie pola |
| Użytkownik NIE MOŻE generować bez logowania | ✅ | Middleware chroni `/rooms/*` i `/dashboard` |
| Przycisk logowania/wylogowania w prawym górnym rogu | ✅ | `UserMenu` w `Layout.astro` |
| Brak zewnętrznych serwisów logowania | ✅ | Tylko email + password |
| Możliwość odzyskiwania hasła | ✅ | Flow `/forgot-password` → `/reset-password` |

### 8.2 Metryki techniczne

- **Test coverage:** Minimum 80% dla nowych komponentów autentykacji
- **Response time:** Middleware session check < 100ms
- **Security:** Żadne hasła w plain text, wszystkie endpointy wymagają sesji
- **Error handling:** 100% błędów Supabase zmapowanych na komunikaty PL
- **Accessibility:** WCAG 2.1 Level AA compliance dla formularzy

### 8.3 Scenariusze testowe

1. **Test rejestracji:**
   - Rejestracja z poprawnym email i hasłem → sukces
   - Rejestracja z istniejącym email → błąd "Konto już istnieje"
   - Rejestracja z nieprawidłowym hasłem → błędy walidacji

2. **Test logowania:**
   - Logowanie z poprawnymi credentials → przekierowanie do `/dashboard`
   - Logowanie z niepotwierdzoną email → komunikat o potwierdzeniu
   - Logowanie z błędnymi credentials → błąd "Nieprawidłowy email lub hasło"

3. **Test wylogowania:**
   - Kliknięcie "Wyloguj" → przekierowanie do `/login`
   - Dostęp do `/dashboard` po wylogowaniu → przekierowanie do `/login`

4. **Test odzyskiwania hasła:**
   - Wysłanie linku resetującego → komunikat sukcesu
   - Ustawienie nowego hasła z linku → sukces i przekierowanie
   - Użycie wygasłego tokenu → komunikat błędu

5. **Test ochrony tras:**
   - Dostęp do `/dashboard` bez sesji → przekierowanie do `/login`
   - Dostęp do `/login` z sesją → przekierowanie do `/dashboard`
   - Dostęp do API bez sesji → 401 Unauthorized

---

## 9. ZALEŻNOŚCI I RYZYKA

### 9.1 Zależności zewnętrzne

| Zależność | Wersja | Krytyczność | Opis |
|-----------|--------|-------------|------|
| Supabase Auth | Latest | Krytyczna | Backend autentykacji |
| @supabase/supabase-js | ^2.x | Krytyczna | SDK klienta |
| Astro | 5.x | Krytyczna | Framework aplikacji |
| React | 19.x | Krytyczna | Komponenty UI |
| Zod | Latest | Średnia | Walidacja schematów |

### 9.2 Potencjalne ryzyka

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| Awaria Supabase Auth | Niskie | Wysoki | Graceful degradation, komunikat o niedostępności |
| Rate limiting Supabase | Średnie | Średni | Komunikat o zbyt wielu próbach, retry logic |
| Email nie dostarczony | Średnie | Średni | Opcja "Wyślij ponownie", link help |
| Token wygasł | Wysokie | Niski | Jasny komunikat, łatwy retry flow |
| XSS przez parametry URL | Niskie | Wysoki | Sanityzacja `redirectTo`, CSP headers |

### 9.3 Wymagania infrastrukturalne

**Supabase:**
- Email provider skonfigurowany (SMTP lub Supabase default)
- Redirect URLs dodane w dashboard
- Email templates skonfigurowane

**Zmienne środowiskowe:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**DNS/Hosting:**
- SSL certificate (HTTPS required dla Supabase Auth)
- Custom domain dla email links

---

## 10. HARMONOGRAM IMPLEMENTACJI

### Faza 1: Przygotowanie (1 dzień)
- [ ] Konfiguracja email templates w Supabase Dashboard
- [ ] Dodanie redirect URLs w Supabase Dashboard
- [ ] Utworzenie pliku `src/lib/validation/auth.schemas.ts`
- [ ] Rozszerzenie `src/types.ts` o typy autentykacji
- [ ] Rozszerzenie `src/env.d.ts` o `session` w Locals

### Faza 2: Middleware i ochrona tras (1 dzień)
- [ ] Modyfikacja `src/middleware/index.ts` - session check, redirects
- [ ] Testowanie middleware dla chronionych tras
- [ ] Testowanie middleware dla stron auth

### Faza 3: Komponenty rejestracji (2 dni)
- [ ] Utworzenie `src/components/auth/RegisterForm.tsx`
- [ ] Utworzenie `src/pages/register.astro`
- [ ] Implementacja walidacji i obsługi błędów
- [ ] Testy jednostkowe `RegisterForm.test.tsx`
- [ ] Testy manualne flow rejestracji

### Faza 4: Komponenty odzyskiwania hasła (2 dni)
- [ ] Utworzenie `src/components/auth/ForgotPasswordForm.tsx`
- [ ] Utworzenie `src/pages/forgot-password.astro`
- [ ] Utworzenie `src/components/auth/ResetPasswordForm.tsx`
- [ ] Utworzenie `src/pages/reset-password.astro`
- [ ] Testy jednostkowe dla obydwu komponentów
- [ ] Testy manualne flow odzyskiwania hasła

### Faza 5: Wylogowanie i UserMenu (1 dzień)
- [ ] Utworzenie `src/components/layout/UserMenu.tsx`
- [ ] Modyfikacja `src/layouts/Layout.astro` - dodanie UserMenu
- [ ] Implementacja logiki wylogowania
- [ ] Testy jednostkowe `UserMenu.test.tsx`

### Faza 6: Modyfikacje istniejących komponentów (1 dzień)
- [ ] Modyfikacja `LoginForm.tsx` - dodanie linków do `/register` i `/forgot-password`
- [ ] Modyfikacja `login.astro` - dodanie linków
- [ ] Aktualizacja testów `LoginForm.test.tsx`

### Faza 7: Modyfikacje API endpoints (1 dzień)
- [ ] Usunięcie `DEFAULT_USER_ID` z wszystkich endpointów (lista w sekcji 3.3)
- [ ] Aktualizacja testów API - mock sesji
- [ ] Weryfikacja wszystkich endpointów zwracają 401 bez sesji

### Faza 8: Testy integracyjne (2 dni)
- [ ] Testy E2E flow rejestracji (Playwright/Cypress)
- [ ] Testy E2E flow logowania
- [ ] Testy E2E flow wylogowania
- [ ] Testy E2E flow odzyskiwania hasła
- [ ] Testy E2E ochrony tras

### Faza 9: Finalizacja (1 dzień)
- [ ] Przegląd bezpieczeństwa (checklist)
- [ ] Przegląd accessibility (checklist)
- [ ] Dokumentacja użytkownika (README)
- [ ] Deployment na staging
- [ ] Weryfikacja na produkcji

**Całkowity czas: ~12 dni roboczych**

---

## 11. ZAŁĄCZNIKI

### 11.1 Checklist bezpieczeństwa

- [ ] Wszystkie hasła hashowane (Supabase default bcrypt)
- [ ] Brak przechowywania hasła w plain text (nigdzie w kodzie)
- [ ] Sanityzacja parametru `redirectTo`
- [ ] Email confirmation włączone w Supabase
- [ ] Rate limiting włączony w Supabase
- [ ] HTTPS wymuszony dla produkcji
- [ ] Tokens mają odpowiednie TTL
- [ ] Komunikaty błędów nie ujawniają szczegółów (czy email istnieje)
- [ ] React escapuje wszystkie dane wejściowe (default)
- [ ] Brak `dangerouslySetInnerHTML` w formularzach
- [ ] Supabase service role key tylko server-side (nie w bundle)

### 11.2 Checklist accessibility

- [ ] Wszystkie pola z `<label>` i `htmlFor`
- [ ] Błędy walidacji powiązane przez `aria-describedby`
- [ ] `aria-invalid` na polach z błędami
- [ ] `aria-live` dla komunikatów błędów formularza
- [ ] `aria-busy` podczas submitu
- [ ] Spinnery z tekstem w `sr-only`
- [ ] Focus management dla błędów
- [ ] Nawigacja klawiaturą (Tab, Enter)
- [ ] Kontrast kolorów minimum 4.5:1
- [ ] Testy z screen readerem (NVDA/VoiceOver)

### 11.3 Struktura plików - podsumowanie

**Nowe pliki:**
```
src/
  components/
    auth/
      RegisterForm.tsx          # Nowy
      ForgotPasswordForm.tsx    # Nowy
      ResetPasswordForm.tsx     # Nowy
    layout/
      UserMenu.tsx              # Nowy
  pages/
    register.astro              # Nowy
    forgot-password.astro       # Nowy
    reset-password.astro        # Nowy
  lib/
    validation/
      auth.schemas.ts           # Nowy
```

**Modyfikowane pliki:**
```
src/
  middleware/index.ts           # Rozszerzenie - session check, redirects
  layouts/Layout.astro          # Rozszerzenie - UserMenu w nagłówku
  components/auth/
    LoginForm.tsx               # Rozszerzenie - linki do rejestracji i odzyskiwania
  pages/
    login.astro                 # Rozszerzenie - linki
  types.ts                      # Rozszerzenie - typy autentykacji
  env.d.ts                      # Rozszerzenie - session w Locals
  db/supabase.client.ts         # Usunięcie DEFAULT_USER_ID
  pages/api/                    # Wszystkie endpointy - usunięcie DEFAULT_USER_ID
```

---

## KONIEC SPECYFIKACJI

**Status dokumentu:** Gotowy do implementacji  
**Następny krok:** Review zespołu → Rozpoczęcie implementacji Faza 1

**Kontakt w sprawie pytań:**
- Backend/Supabase: [Supabase Docs](https://supabase.com/docs/guides/auth)
- Frontend/Astro: [Astro Docs](https://docs.astro.build)
- Accessibility: [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
