<conversation_summary> 

<decisions>
1. Brak triggerów w DB: tworzenie domyślnego projektu (1 projekt na użytkownika) realizowane po stronie aplikacji, nie w Postgres.
2. room_photos.photo_type jako ENUM: wartości ('room', 'inspiration').
3. Brak walidacji w DB dla kompletności uploadu: minimum 1 zdjęcie pomieszczenia i 2 inspiracje oraz limity plików (np. max 10) egzekwowane w aplikacji, nie przez CHECK/trigger.
4. Rozdzielenie generacji i zapisów: osobno generated_inspirations (wszystkie warianty) i saved_inspirations (tylko zapisane karty), z relacją saved_inspirations -> generated_inspirations.
5. Osobna tabela obrazów wariantu: inspiration_images zamiast kolumn image_1_url/image_2_url w generated_inspirations.
6. Limit generacji 5/dzień: tabela generation_limits z obsługą zalogowanych i gości (per urządzenie). Na razie bez mechanizmu czyszczenia starych rekordów.
7. Goście (bez konta): brak danych domenowych w DB dla gości; stan po stronie klienta + w DB tylko generation_limits (per device_fingerprint_hash).
8. Fingerprint jako hash: przechowywać wyłącznie zahashowany identyfikator urządzenia (device_fingerprint_hash), nie surowy fingerprint.
9. Tabela słownikowa typów pomieszczeń: room_types + FK z rooms.
10. Soft delete: używać deleted_at (co najmniej dla rooms, room_photos, saved_inspirations), filtrować w aplikacji.
11. Analityka: jedna tabela analytics_events z event_type + event_data (JSONB).
12. RLS: użytkownik ma dostęp tylko do swoich danych (projekty/pomieszczenia/zdjęcia/generacje/zapisy). analytics_events bez odczytu klienta (preferowany insert-only lub przez backend).
13. Indeksy: zgoda na rekomendowane indeksy dla FK i typowych filtrów/listowań (rooms, photos, inspirations, saved, limits, analytics).
14. Storage: przechowywać w DB storage_path (nie public URL), organizować ścieżki/buckety per użytkownik i oprzeć dostęp o auth.uid() + powiązania DB.
</decisions> 

<matched_recommendations>

1. Utrzymać tabelę projects mimo „jednego domyślnego projektu” (przyszła rozbudowa do multi-project bez migracji relacji).
2. Stosować room_photos.photo_type jako ENUM room|inspiration.
3. Rozdzielić generated_inspirations i saved_inspirations (metryka wartości: liczba zapisów; zdarzenie InspirationSaved).
4. Wprowadzić inspiration_images (1:N do generated_inspirations) z position i unikalnością (generated_inspiration_id, position).
5. Dodać tabelę łącznikową wejść generacji: generation_inputs (generated_inspiration_id, room_photo_id) dla odtwarzalności i diagnostyki.
6. Limit generacji: generation_limits z user_id lub device_fingerprint_hash + generation_date + count, z unikalnościami per dzień.
7. Hashowanie fingerprintu urządzenia (PII minimization) i indeksowanie po (device_fingerprint_hash, generation_date).
8. Soft delete (deleted_at) + opcjonalne partial indexes dla deleted_at IS NULL.
9. analytics_events jako tabela uniwersalna (JSONB) + indeksy (event_type, created_at) oraz blokada odczytu przez RLS.
10. Strategia Storage: storage_path w DB, buckety/prefiksy per użytkownik, polityki dostępu oparte o auth.uid().

</matched_recommendations> 

<database_planning_summary>

### Główne wymagania dot. schematu DB (MVP)
1. Jeden domyślny projekt mieszkania na użytkownika (bez triggerów; aplikacja zakłada/wybiera projekt).
2. Pomieszczenia przypisane do projektu, wybierane jako kontekst pracy.
3. Upload zdjęć per pomieszczenie, z rozróżnieniem: zdjęcia „pomieszczenia” i „inspiracji”.
4. Generowanie wariantów dla pojedynczego pomieszczenia: każdy wariant ma 2 obrazy i bullet points (sugestie).
5. Zapis wariantu (soft-gate): wymaga konta; zapis zawiera nazwę (styl opcjonalny).
6. Limit generacji: max 5/dzień na użytkownika; dla gości per urządzenie/przeglądarka - można resetować limit po przejsciu z anonymous na zalogowanego
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
    (rekomendowane) 1:N → generation_inputs (mapowanie na room_photos użyte w generacji)
4. generation_limits
    agregacja dzienna: albo user_id, albo device_fingerprint_hash + generation_date + count
5. analytics_events
    event_type + event_data JSONB + user_id (nullable) + created_at

### Bezpieczeństwo i skalowalność
1. RLS: pełna izolacja danych per użytkownik (projekty/pomieszczenia/zdjęcia/generacje/zapisy).
2. Goście: minimalizacja ryzyka przez brak danych domenowych w DB (tylko generation_limits dla hashowanego urządzenia).
3. Storage: prywatne ścieżki per użytkownik; w DB przechowujemy storage_path; polityki Storage powiązane z auth.uid() i rekordami DB.
4. Indeksy: na FK i typowe listowania (rooms po projekcie, photos po room, inspirations po room, saved po user/room, limits po dacie, analytics po czasie/typie).
5. Soft delete: deleted_at dla zachowania historii i analityki; opcjonalnie partial indexes dla aktywnych rekordów.

### Obszary do doprecyzowania w kolejnym kroku (przed DDL/RLS)
1. Dokładna strategia „po zalogowaniu” dla limitu: czy limit dla gościa i użytkownika ma się sumować czy przełączać na user_id. Decyzja: nie trzeba przełączać
2. Jak przechowywać bullet points: tekst vs JSONB decyzja: JSONB jako tablica stringów
</database_planning_summary> 

<unresolved_issues>
</unresolved_issues> 

</conversation_summary>