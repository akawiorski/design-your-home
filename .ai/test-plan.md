# Plan testów – Home Inspiration Generator (MVP)

## 1. Wprowadzenie i cele testowania
Celem testów jest potwierdzenie, że aplikacja spełnia wymagania PRD oraz zapewnia bezpieczne i stabilne generowanie inspiracji na podstawie zdjęć. Testy mają zweryfikować krytyczne ścieżki użytkownika, poprawność integracji z Supabase i Openrouter oraz odporność na błędy.

## 2. Zakres testów
**W zakresie:**
- Uwierzytelnianie i autoryzacja (Supabase Auth, middleware, przekierowania).
- Zarządzanie pomieszczeniami i listą typów pomieszczeń.
- Upload zdjęć z walidacją (limity, formaty, opisy).
- Generowanie inspiracji i obsługa błędów (Openrouter).
- Analityka zdarzeń.

**Poza zakresem (MVP):** multi‑project, zapisywanie/gale­ria inspiracji, udostępnianie, retencja danych.

## 3. Typy testów do przeprowadzenia
- **Testy jednostkowe**: usługi i logika pomocnicza (np. walidacje, mapery).
- **Testy integracyjne**: API + Supabase (Auth, Postgres, Storage, RLS) oraz Openrouter.
- **Testy end‑to‑end (E2E)**: pełne scenariusze użytkownika w przeglądarce.
- **Testy bezpieczeństwa**: autoryzacja, RLS, dostęp do zasobów.
- **Testy użyteczności**: komunikaty, stany przycisków, spinnery.
- **Testy wydajnościowe (lekki zakres)**: czas odpowiedzi kluczowych API oraz stabilność generacji.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Uwierzytelnianie i dostęp
- Rejestracja z poprawnymi danymi oraz walidacja błędów.
- Logowanie poprawne i niepoprawne.
- Wymuszenie logowania (przekierowania z chronionych ścieżek).
- Wylogowanie i wygasła sesja.
- Reset hasła (żądanie i ustawienie nowego hasła).

### 4.2 Pomieszczenia
- Dodanie pomieszczenia z listy typów (room_types).
- Wybór pomieszczenia i poprawne związanie akcji z aktywnym pokojem.
- Brak dostępu do pomieszczeń innych użytkowników (RLS).

### 4.3 Upload zdjęć
- Minimalne wymagania (1× room + 2× inspiration).
- Limit 10 plików, walidacja formatów (jpg, png, heic).
- Opisy zdjęć i ich zapis.
- Upload przez signed URL oraz potwierdzenie zapisu w DB.

### 4.4 Generowanie inspiracji
- Generowanie pierwszego wariantu (2 obrazy + bullet points).
- Kolejne warianty dla tego samego pomieszczenia.
- Obsługa braku kredytów/limitów LLM.

### 4.5 Obsługa błędów
- Błędy generacji (timeout/5xx) i możliwość ponowienia bez utraty danych.
- Błędy uploadu (przerwane połączenie, błąd podpisu URL).

### 4.6 Analityka
- Wysłanie zdarzenia `InspirationGenerated` po udanej generacji.

## 5. Środowisko testowe
- Środowisko testowe z Supabase (Auth, Postgres, Storage, RLS).
- Skonfigurowane klucze Openrouter i limity testowe.
- Przeglądarki: Chrome, Firefox, Safari (macOS).
- Dane testowe: 2 użytkowników, zestawy zdjęć (poprawne i niepoprawne formaty).

## 6. Narzędzia do testowania
- **Vitest** + **React Testing Library**: testy jednostkowe i komponentowe.
- **MSW**: mockowanie API w testach UI.
- **Playwright** (rekomendowane): testy E2E.
- **Supabase CLI** (opcjonalnie): lokalna instancja do testów integracyjnych.
- **Lighthouse** (opcjonalnie): szybka ocena wydajności i UX.

## 7. Harmonogram testów
1. **Tydzień 1**: testy jednostkowe + integracyjne usług (rooms, photos, openrouter).
2. **Tydzień 2**: testy E2E kluczowych ścieżek + regresja P0.
3. **Po każdej zmianie**: szybka regresja krytycznych scenariuszy.

## 8. Kryteria akceptacji testów
- Wszystkie przypadki P0 i P1 zakończone sukcesem.
- Brak defektów blokujących logowanie, upload, generowanie i bezpieczeństwo danych.
- Stabilność kluczowych API (brak błędów krytycznych w 3 kolejnych przebiegach).

## 9. Role i odpowiedzialności
- **QA**: przygotowanie i wykonanie testów, raportowanie defektów.
- **Dev**: naprawa błędów, wsparcie przy debugowaniu.
- **PO/PM**: walidacja zgodności z PRD i decyzje o priorytetach.

## 10. Procedury raportowania błędów
- Zgłoszenie zawiera: opis, kroki, expected/actual, środowisko, logi i zrzuty ekranu.
- P0 zgłaszane natychmiast, P1/P2 w cyklu dziennym.

## 11. Priorytety testowe
- **P0**: uwierzytelnianie, autoryzacja, upload minimalny, generowanie, błędy generacji.
- **P1**: reset hasła, limity uploadu, błędy uploadu, kredyty LLM.
- **P2**: analityka, UX, wydajność.

## 12. Ryzyka
- Limity Openrouter i time‑outy generacji.
- Różnice w obsłudze HEIC między przeglądarkami.
- Nieprawidłowe konfiguracje RLS skutkujące wyciekiem danych.
- Wygasłe signed URL i opóźnienia Storage.

## 13. Zestaw regresyjny P0
- Rejestracja, logowanie, brak dostępu bez sesji.
- Dodanie i wybór pomieszczenia.
- Upload minimalny i aktywacja przycisku „Generuj”.
- Generowanie 1. i 2. wariantu.
- Obsługa błędów generacji.
