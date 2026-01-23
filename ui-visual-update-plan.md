# Plan aktualizacji stylów UI (Fluent 2)

## Cel

Ujednolicić wygląd aplikacji z zasadami Fluent 2 (https://fluent2.microsoft.design/) przy zachowaniu istniejącego stacku (Astro + React + Tailwind + shadcn/ui).

## Zakres

- Komponenty UI (shadcn/ui + własne komponenty)
- Layouty Astro
- Typografia, kolory, promienie, cienie, spacing
- Stany interakcji (hover/focus/active/disabled)
- Animacje i mikrointerakcje
- Dostępność (ARIA, fokus, kontrast)

## 1. Fundamenty wizualne

### 1.1 Typografia

- Ustawić skalę typograficzną zgodną z Fluent 2 (np. 12/14/16/20/24/32/40).
- Zwiększyć czytelność tekstu pomocniczego (minimalnie 14px).
- Spójne line-height: 1.2–1.5 w zależności od roli tekstu.
- Ustalić semantyczne klasy (np. heading, title, subtitle, body, caption) w global.css.

### 1.2 Kolory

- Zdefiniować paletę tła i powierzchni: base, subtle, elevated, card.
- Wprowadzić akcenty: primary, info, success, warning, danger.
- Zapewnić kontrast WCAG AA w trybie jasnym i ciemnym.
- Wprowadzić tokeny kolorów w Tailwind theme (semantic tokens), zamiast stałych wartości.

### 1.3 Promienie i obrysy

- Ujednolicić promienie: 6–10px dla kart, 4–6px dla inputów.
- Wprowadzić subtelne obrysy (1px) dla kart i paneli.
- Dodać delikatne cienie zgodne z Fluent 2 (multi-layer, niska intensywność).

### 1.4 Spacing i siatka

- Zastosować siatkę 8px i konsekwentny spacing.
- Zwiększyć whitespace wokół sekcji i kart.

## 2. Komponenty UI

### 2.1 Przycisk

- Wprowadzić warianty Fluent 2: primary, secondary, ghost.
- Dopasować wysokości (min 36–40px) i padding.
- Stany: hover, active, focus-visible z delikatnym halo.

### 2.2 Inputy, textarea, select

- Subtelne tła + obrysy.
- Focus ring w kolorze akcentu.
- Placeholder w niższym kontraście.

### 2.3 Karty i panele

- Lekki cień + obrys + różnicowanie tła.
- Zastosować „elevation” w kluczowych sekcjach (np. generator wyników).

### 2.4 Toasty i powiadomienia

- Delikatne tło z ikoną i akcentowym paskiem.
- Spójna typografia i spacing.

### 2.5 Dialogi

- Tło z lekkim blur (jeśli zgodne z Tailwind/astro).
- Wyraźny header i CTA.

## 3. Interakcje i animacje

- Hover: subtelne rozjaśnienie tła lub cień.
- Focus-visible: halo z kolorem akcentu.
- Transition: 150–250ms ease-out.
- Animacje spójne w całej aplikacji.

## 4. Dostępność

- Kontrast tekstu i przycisków min. AA.
- Wyraźne focus ringi.
- Opisy ARIA dla interaktywnych elementów bez etykiet.

## 5. Integracja w kodzie

### 5.1 Tailwind

- Zdefiniować tokeny kolorów w konfiguracji Tailwind.
- Użyć @layer w global.css dla podstawowych klas.

### 5.2 Shadcn/ui

- Nadpisać style bazowe komponentów (Button, Input, Dialog, Toast) aby odzwierciedlały Fluent 2.

### 5.3 Komponenty custom

- PhotosSection, GenerateSection, RoomHeader: dostosować spacing, border, typografię.
- Karty zdjęć i wyników: dostosować elevation, rounded, layout.

## 6. Priorytety wdrożenia

1. Fundamenty: kolory, typografia, spacing.
2. Przycisk + inputy + textarea.
3. Karty i panele (sekcje na stronie pokoju).
4. Toasty i dialogi.
5. Mikrointerakcje i animacje.

## 7. Kryteria akceptacji

- Spójny wygląd zgodny z Fluent 2.
- Brak regresji dostępności.
- Jednolite spacingi i typografia w całej aplikacji.
- Przyciski i inputy reagują zgodnie z nowym stylem.

## 8. Etapy wdrożenia

- Etap 1: Przegląd istniejących tokenów i stylów.
- Etap 2: Aktualizacja global.css i Tailwind config.
- Etap 3: Aktualizacja shadcn/ui.
- Etap 4: Aktualizacja kluczowych widoków (np. /rooms/[roomId]).
- Etap 5: QA wizualny i dostępności.
