<conversation_summary> 

<decisions>
1. Brak triggerów w DB: tworzenie domyślnego projektu (1 projekt na użytkownika) realizowane po stronie aplikacji, nie w Postgres.
2. room_photos.photo_type jako ENUM: wartości ('room', 'inspiration').
3. Brak walidacji w DB dla kompletności uploadu: minimum 1 zdjęcie pomieszczenia i 2 inspiracje oraz limity plików (np. max 10) egzekwowane w aplikacji, nie przez CHECK/trigger.
4. Rozdzielenie generacji i zapisów: osobno generated_inspirations (wszystkie warianty) i saved_inspirations (tylko zapisane karty), z relacją saved_inspirations -> generated_inspirations.
5. Osobna tabela obrazów wariantu: inspiration_images zamiast kolumn image_1_url/image_2_url w generated_inspirations.
6. Limit generacji: egzekwowany na poziomie wejścia do LLM (kontrola przez kredyty), bez tabel w bazie danych.
7. Goście (bez konta): brak danych domenowych w DB dla gości; stan po stronie klienta.
8. Tabela słownikowa typów pomieszczeń: room_types + FK z rooms.
9. Soft delete: używać deleted_at (co najmniej dla rooms, room_photos, saved_inspirations), filtrować w aplikacji.
10. Analityka: jedna tabela analytics_events z event_type + event_data (JSONB).
11. RLS: użytkownik ma dostęp tylko do swoich danych (projekty/pomieszczenia/zdjęcia/generacje/zapisy). analytics_events bez odczytu klienta (preferowany insert-only lub przez backend).
12. Indeksy: zgoda na rekomendowane indeksy dla FK i typowych filtrów/listowań (rooms, photos, inspirations, saved, analytics).
14. Storage: przechowywać w DB storage_path (nie public URL), organizować ścieżki/buckety per użytkownik i oprzeć dostęp o auth.uid() + powiązania DB.
</decisions> 

<matched_recommendations>

1. Utrzymać tabelę projects mimo „jednego domyślnego projektu” (przyszła rozbudowa do multi-project bez migracji relacji).
2. Stosować room_photos.photo_type jako ENUM room|inspiration.
3. Rozdzielić generated_inspirations i saved_inspirations (metryka wartości: liczba zapisów; zdarzenie InspirationSaved).
4. Wprowadzić inspiration_images (1:N do generated_inspirations) z position i unikalnością (generated_inspiration_id, position).
5. Limit generacji: egzekwowany na poziomie wejścia do LLM, bez mechanizmu w bazie danych.
6. Soft delete (deleted_at) + opcjonalne partial indexes dla deleted_at IS NULL.
7. analytics_events jako tabela uniwersalna (JSONB) + indeksy (event_type, created_at) oraz blokada odczytu przez RLS.
10. Strategia Storage: storage_path w DB, buckety/prefiksy per użytkownik, polityki dostępu oparte o auth.uid().

</matched_recommendations> 

<database_planning_summary>

### Główne wymagania dot. schematu DB (MVP)
1. Jeden domyślny projekt mieszkania na użytkownika (bez triggerów; aplikacja zakłada/wybiera projekt).
2. Pomieszczenia przypisane do projektu, wybierane jako kontekst pracy.
3. Upload zdjęć per pomieszczenie, z rozróżnieniem: zdjęcia „pomieszczenia” i „inspiracji”.
4. Generowanie wariantów dla pojedynczego pomieszczenia: każdy wariant ma 2 obrazy i bullet points (sugestie).
5. Zapis wariantu (soft-gate): wymaga konta; zapis zawiera nazwę (styl opcjonalny).
6. Limit generacji: kontrolowany przez kredyty dostępne w LLM, bez twardego limitu w aplikacji.
7. Analityka: zdarzenie InspirationSaved (i potencjalnie kolejne w przyszłości).

### Kluczowe encje i relacje (docelowy kierunek)
1. projects (1 użytkownik → 1 projekt w MVP) 
    1:N → rooms
2. room_types (słownik) 
    1:N → rooms (FK room_type_id)
3. rooms 
    1:N → room_photos (zdjęcia wejściowe; photo_type ENUM room|inspiration)
    1:N → generated_inspirations (warianty wygenerowane)
3. generated_inspirations
    1:N → inspiration_images (wygenerowane obrazy, z position)
    0..1 → saved_inspirations (zapisana karta; nazwa + opcjonalny styl)
4. analytics_events
    event_type + event_data JSONB + user_id (nullable) + created_at

### Bezpieczeństwo i skalowalność
1. RLS: pełna izolacja danych per użytkownik (projekty/pomieszczenia/zdjęcia/generacje/zapisy).
2. Goście: minimalizacja ryzyka przez brak danych domenowych w DB; pełna funkcjonalność bez konieczności przechowywania stanu w bazie.
3. Storage: prywatne ścieżki per użytkownik; w DB przechowujemy storage_path; polityki Storage powiązane z auth.uid() i rekordami DB.
4. Indeksy: na FK i typowe listowania (rooms po projekcie, photos po room, inspirations po room, saved po user/room, analytics po czasie/typie).
5. Soft delete: deleted_at dla zachowania historii i analityki; opcjonalnie partial indexes dla aktywnych rekordów.

### Rozwiązane kwestie techniczne
1. Bullet points: przechowywane jako JSONB (tablica stringów).
2. Limity generacji: kontrolowane przez kredyty LLM, bez mechanizmu w bazie danych.
</database_planning_summary> 

<unresolved_issues>
</unresolved_issues> 

</conversation_summary>