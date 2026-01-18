<conversation_summary> 

<decisions>
1. Brak koncepcji projektu w MVP: pomieszczenia (`rooms`) są przypisane bezpośrednio do użytkownika (`rooms.user_id`).
2. room_photos.photo_type jako ENUM: wartości ('room', 'inspiration').
3. Brak walidacji w DB dla kompletności uploadu: minimum 1 zdjęcie pomieszczenia i 2 inspiracje oraz limity plików (np. max 10) egzekwowane w aplikacji, nie przez CHECK/trigger.
4. Brak persystencji wygenerowanych inspiracji w MVP: wynik generacji (bullet points + 2 obrazy) jest zwracany z API bez zapisu w Postgres.
6. Limit generacji: egzekwowany na poziomie wejścia do LLM (kontrola przez kredyty), bez tabel w bazie danych.
7. Brak trybu anonimowego w tej iteracji MVP: użytkownik loguje się jako pierwszy krok.
8. Tabela słownikowa typów pomieszczeń: room_types + FK z rooms.
10. Analityka: jedna tabela analytics_events z event_type + event_data (JSONB).
11. RLS: użytkownik ma dostęp tylko do swoich danych (pomieszczenia/zdjęcia/generacje/zapisy). analytics_events bez odczytu klienta (preferowany insert-only lub przez backend).
12. Indeksy: zgoda na rekomendowane indeksy dla FK i typowych filtrów/listowań (rooms, photos, inspirations, saved, analytics).
14. Storage: przechowywać w DB storage_path (nie public URL), organizować ścieżki/buckety per użytkownik i oprzeć dostęp o auth.uid() + powiązania DB.
</decisions> 

<matched_recommendations>

1. Uprościć model: pominąć warstwę "projektu" i przypisać pomieszczenia bezpośrednio do użytkownika (mniej relacji i mniej zapytań).
2. Stosować room_photos.photo_type jako ENUM room|inspiration.
3. Nie utrwalać wyników generacji w DB w MVP (szybsza implementacja, mniejsza powierzchnia danych).
5. Limit generacji: egzekwowany na poziomie wejścia do LLM, bez mechanizmu w bazie danych.
7. analytics_events jako tabela uniwersalna (JSONB) + indeksy (event_type, created_at) oraz blokada odczytu przez RLS (opcjonalnie w MVP).
10. Strategia Storage: storage_path w DB, buckety/prefiksy per użytkownik, polityki dostępu oparte o auth.uid().

</matched_recommendations> 

<database_planning_summary>

### Główne wymagania dot. schematu DB (MVP)
1. Pomieszczenia przypisane bezpośrednio do użytkownika, wybierane jako kontekst pracy.
3. Upload zdjęć per pomieszczenie, z rozróżnieniem: zdjęcia „pomieszczenia” i „inspiracji”.
4. Generowanie wariantów dla pojedynczego pomieszczenia: każdy wariant ma 2 obrazy i bullet points (sugestie) zwracane w odpowiedzi API.
6. Limit generacji: kontrolowany przez kredyty dostępne w LLM, bez twardego limitu w aplikacji.
6. Analityka: opcjonalnie zdarzenie InspirationGenerated (i potencjalnie kolejne w przyszłości).

### Kluczowe encje i relacje (docelowy kierunek)
1. room_types (słownik) 
    1:N → rooms (FK room_type_id)
2. rooms 
    1:N → room_photos (zdjęcia wejściowe; photo_type ENUM room|inspiration)
3. analytics_events
    event_type + event_data JSONB + user_id (nullable) + created_at

### Bezpieczeństwo i skalowalność
1. RLS: pełna izolacja danych per użytkownik (pomieszczenia/zdjęcia/generacje/zapisy).
2. Brak trybu anonimowego w MVP: uproszczona autoryzacja (zawsze mamy kontekst user_id).
3. Storage: prywatne ścieżki per użytkownik; w DB przechowujemy storage_path; polityki Storage powiązane z auth.uid() i rekordami DB.
4. Indeksy: na FK i typowe listowania (rooms po user_id, photos po room, analytics po czasie/typie).

### Rozwiązane kwestie techniczne
1. Bullet points: zwracane przez API jako tablica stringów (bez zapisu w DB w MVP).
2. Limity generacji: kontrolowane przez kredyty LLM, bez mechanizmu w bazie danych.
</database_planning_summary> 

<unresolved_issues>
</unresolved_issues> 

</conversation_summary>