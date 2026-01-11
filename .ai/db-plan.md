# Schemat Bazy Danych PostgreSQL – Home Inspiration Generator

## 1. Tabele z kolumnami, typami danych i ograniczeniami

### 1.1 projects
Przechowuje projekty mieszkań użytkowników. W MVP każdy użytkownik ma jeden domyślny projekt.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator projektu |
| user_id | UUID | NOT NULL | Odniesienie do auth.users (Supabase Auth) |
| name | TEXT | NOT NULL, DEFAULT 'My Home' | Nazwa projektu |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Data utworzenia |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Data ostatniej modyfikacji |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Data soft delete |

**Ograniczenia:**
- `user_id` odnosi się do `auth.users(id)` (Supabase)

---

### 1.2 room_types
Słownik typów pomieszczeń (kitchen, bathroom, bedroom, living_room itp.).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | SERIAL | PRIMARY KEY | Unikalny identyfikator typu pomieszczenia |
| name | TEXT | NOT NULL, UNIQUE | Nazwa typu (snake_case, np. 'kitchen') |
| display_name | TEXT | NOT NULL | Nazwa wyświetlana użytkownikowi (np. 'Kuchnia') |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Data utworzenia |

**Przykładowe dane:**
- (1, 'kitchen', 'Kuchnia')
- (2, 'bathroom', 'Łazienka')
- (3, 'bedroom', 'Sypialnia')
- (4, 'living_room', 'Salon')

---

### 1.3 rooms
Pomieszczenia w projekcie mieszkania użytkownika.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator pomieszczenia |
| project_id | UUID | NOT NULL, FOREIGN KEY | Odniesienie do projects.id |
| room_type_id | INTEGER | NOT NULL, FOREIGN KEY | Odniesienie do room_types.id |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Data utworzenia |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Data ostatniej modyfikacji |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Data soft delete |

**Ograniczenia:**
- `FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE`
- `FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE RESTRICT`

---

### 1.4 room_photos
Zdjęcia wejściowe przypisane do pomieszczenia: zdjęcia "pomieszczenia" oraz "inspiracji".

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator zdjęcia |
| room_id | UUID | NOT NULL, FOREIGN KEY | Odniesienie do rooms.id |
| photo_type | photo_type_enum | NOT NULL | Typ zdjęcia: 'room' lub 'inspiration' |
| storage_path | TEXT | NOT NULL | Ścieżka do pliku w Supabase Storage |
| description | TEXT | NULL | Opcjonalny opis zdjęcia |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Data utworzenia |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Data soft delete |

**ENUM:**
```sql
CREATE TYPE photo_type_enum AS ENUM ('room', 'inspiration');
```

**Ograniczenia:**
- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`

---

### 1.5 generated_inspirations
Wygenerowane warianty inspiracji dla pomieszczenia. Każdy wariant zawiera bullet points z sugestiami.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator generacji |
| room_id | UUID | NOT NULL, FOREIGN KEY | Odniesienie do rooms.id |
| bullet_points | JSONB | NOT NULL | Tablica stringów z sugestiami funkcjonalnymi |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Data utworzenia |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Data soft delete |

**Format bullet_points:**
```json
["Strefowanie kuchni: gotowanie, przygotowanie, zmywanie", "Oświetlenie LED pod szafkami", "Wyspa jako dodatkowa powierzchnia robocza"]
```

**Ograniczenia:**
- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`

---

### 1.6 inspiration_images
Obrazy wygenerowane dla wariantu inspiracji. Każdy wariant ma 2 obrazy (position: 1 i 2).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator obrazu |
| generated_inspiration_id | UUID | NOT NULL, FOREIGN KEY | Odniesienie do generated_inspirations.id |
| storage_path | TEXT | NOT NULL | Ścieżka do pliku w Supabase Storage |
| position | SMALLINT | NOT NULL, CHECK (position IN (1, 2)) | Pozycja obrazu w wariancie (1 lub 2) |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Data utworzenia |

**Ograniczenia:**
- `FOREIGN KEY (generated_inspiration_id) REFERENCES generated_inspirations(id) ON DELETE CASCADE`
- `UNIQUE (generated_inspiration_id, position)` – każdy wariant ma dokładnie 2 obrazy
- `CHECK (position IN (1, 2))`

---

### 1.7 saved_inspirations
Zapisane karty inspiracji. Wymaga konta użytkownika (soft-gate).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator zapisanej inspiracji |
| user_id | UUID | NOT NULL | Odniesienie do auth.users (Supabase Auth) |
| room_id | UUID | NOT NULL, FOREIGN KEY | Odniesienie do rooms.id |
| generated_inspiration_id | UUID | NOT NULL, FOREIGN KEY | Odniesienie do generated_inspirations.id |
| name | TEXT | NOT NULL | Nazwa nadana przez użytkownika |
| style | TEXT | NULL | Opcjonalny styl (np. 'Skandynawski', 'Industrialny') |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Data utworzenia |
| deleted_at | TIMESTAMP WITH TIME ZONE | NULL | Data soft delete |

**Ograniczenia:**
- `user_id` odnosi się do `auth.users(id)` (Supabase)
- `FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE`
- `FOREIGN KEY (generated_inspiration_id) REFERENCES generated_inspirations(id) ON DELETE CASCADE`

---

### 1.8 analytics_events
Zdarzenia analityczne (np. InspirationSaved) w formacie uniwersalnym.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator zdarzenia |
| event_type | TEXT | NOT NULL | Typ zdarzenia (np. 'InspirationSaved') |
| event_data | JSONB | NOT NULL | Dane zdarzenia w formacie JSONB |
| user_id | UUID | NULL | Odniesienie do auth.users (nullable dla gości) |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Data zdarzenia |

**Ograniczenia:**
- `user_id` odnosi się do `auth.users(id)` (Supabase)

**Przykładowe event_data dla InspirationSaved:**
```json
{
  "inspiration_id": "uuid",
  "room_id": "uuid",
  "room_type": "kitchen",
  "style": "Skandynawski"
}
```

---

## 2. Relacje między tabelami

### 2.1 Diagram relacji

```
auth.users (Supabase)
    ↓ 1:N
projects
    ↓ 1:N
rooms ← 1:N → room_types
    ↓ 1:N              ↓ 1:N
room_photos      generated_inspirations
                       ↓ 1:N              ↓ 0..1
                 inspiration_images    saved_inspirations → auth.users
                                                ↓
                                            analytics_events
```

### 2.2 Opis relacji

| Tabela źródłowa | Tabela docelowa | Relacja | Opis |
|----------------|-----------------|---------|------|
| auth.users | projects | 1:N | Jeden użytkownik ma wiele projektów (w MVP: 1 domyślny) |
| projects | rooms | 1:N | Jeden projekt ma wiele pomieszczeń |
| room_types | rooms | 1:N | Jeden typ pomieszczenia może być użyty w wielu pomieszczeniach |
| rooms | room_photos | 1:N | Jedno pomieszczenie ma wiele zdjęć |
| rooms | generated_inspirations | 1:N | Jedno pomieszczenie ma wiele wygenerowanych inspiracji |
| generated_inspirations | inspiration_images | 1:N | Jedna inspiracja ma wiele obrazów (dokładnie 2) |
| generated_inspirations | saved_inspirations | 0..1 | Jedna inspiracja może być zapisana (lub nie) |
| auth.users | saved_inspirations | 1:N | Jeden użytkownik ma wiele zapisanych inspiracji |
| rooms | saved_inspirations | 1:N | Jedno pomieszczenie ma wiele zapisanych inspiracji |
| auth.users | analytics_events | 1:N | Jeden użytkownik generuje wiele zdarzeń analitycznych |

---

## 3. Indeksy

### 3.1 Indeksy dla kluczy obcych i często używanych filtrów

```sql
-- projects
CREATE INDEX idx_projects_user_id ON projects(user_id) WHERE deleted_at IS NULL;

-- rooms
CREATE INDEX idx_rooms_project_id ON rooms(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_room_type_id ON rooms(room_type_id);

-- room_photos
CREATE INDEX idx_room_photos_room_id ON room_photos(room_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_room_photos_photo_type ON room_photos(photo_type);

-- generated_inspirations
CREATE INDEX idx_generated_inspirations_room_id ON generated_inspirations(room_id) WHERE deleted_at IS NULL;

-- inspiration_images
CREATE INDEX idx_inspiration_images_generated_inspiration_id ON inspiration_images(generated_inspiration_id);

-- saved_inspirations
CREATE INDEX idx_saved_inspirations_user_id ON saved_inspirations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_saved_inspirations_room_id ON saved_inspirations(room_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_saved_inspirations_generated_inspiration_id ON saved_inspirations(generated_inspiration_id);

-- analytics_events
CREATE INDEX idx_analytics_events_event_type_created_at ON analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_events_user_id_created_at ON analytics_events(user_id, created_at);
```

### 3.2 Uzasadnienie indeksów

- **projects, rooms, room_photos, generated_inspirations, saved_inspirations:** Partial indexes z `WHERE deleted_at IS NULL` dla wydajności listowania aktywnych rekordów (soft delete).
- **analytics_events:** Composite indexes dla typowych zapytań analitycznych (po typie zdarzenia i czasie, po użytkowniku i czasie).

---

## 4. Zasady PostgreSQL (Row Level Security – RLS)

### 4.1 Włączenie RLS na wszystkich tabelach

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
```

### 4.2 Polityki RLS dla projects

```sql
-- SELECT: Użytkownik widzi tylko swoje projekty
CREATE POLICY select_own_projects ON projects
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Użytkownik może tworzyć projekty tylko dla siebie
CREATE POLICY insert_own_projects ON projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Użytkownik może aktualizować tylko swoje projekty
CREATE POLICY update_own_projects ON projects
    FOR UPDATE
    USING (auth.uid() = user_id);

-- DELETE: Użytkownik może usuwać tylko swoje projekty
CREATE POLICY delete_own_projects ON projects
    FOR DELETE
    USING (auth.uid() = user_id);
```

### 4.3 Polityki RLS dla rooms

```sql
-- SELECT: Użytkownik widzi pomieszczenia ze swoich projektów
CREATE POLICY select_own_rooms ON rooms
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = rooms.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- INSERT: Użytkownik może tworzyć pomieszczenia tylko w swoich projektach
CREATE POLICY insert_own_rooms ON rooms
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = rooms.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- UPDATE: Użytkownik może aktualizować tylko pomieszczenia ze swoich projektów
CREATE POLICY update_own_rooms ON rooms
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = rooms.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- DELETE: Użytkownik może usuwać tylko pomieszczenia ze swoich projektów
CREATE POLICY delete_own_rooms ON rooms
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = rooms.project_id
            AND projects.user_id = auth.uid()
        )
    );
```

### 4.4 Polityki RLS dla room_photos

```sql
-- SELECT: Użytkownik widzi zdjęcia ze swoich pomieszczeń
CREATE POLICY select_own_room_photos ON room_photos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            JOIN projects ON projects.id = rooms.project_id
            WHERE rooms.id = room_photos.room_id
            AND projects.user_id = auth.uid()
        )
    );

-- INSERT: Użytkownik może dodawać zdjęcia tylko do swoich pomieszczeń
CREATE POLICY insert_own_room_photos ON room_photos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM rooms
            JOIN projects ON projects.id = rooms.project_id
            WHERE rooms.id = room_photos.room_id
            AND projects.user_id = auth.uid()
        )
    );

-- UPDATE: Użytkownik może aktualizować tylko zdjęcia ze swoich pomieszczeń
CREATE POLICY update_own_room_photos ON room_photos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            JOIN projects ON projects.id = rooms.project_id
            WHERE rooms.id = room_photos.room_id
            AND projects.user_id = auth.uid()
        )
    );

-- DELETE: Użytkownik może usuwać tylko zdjęcia ze swoich pomieszczeń
CREATE POLICY delete_own_room_photos ON room_photos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            JOIN projects ON projects.id = rooms.project_id
            WHERE rooms.id = room_photos.room_id
            AND projects.user_id = auth.uid()
        )
    );
```

### 4.5 Polityki RLS dla generated_inspirations

```sql
-- SELECT: Użytkownik widzi inspiracje ze swoich pomieszczeń
CREATE POLICY select_own_generated_inspirations ON generated_inspirations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            JOIN projects ON projects.id = rooms.project_id
            WHERE rooms.id = generated_inspirations.room_id
            AND projects.user_id = auth.uid()
        )
    );

-- INSERT: Użytkownik może tworzyć inspiracje tylko dla swoich pomieszczeń
CREATE POLICY insert_own_generated_inspirations ON generated_inspirations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM rooms
            JOIN projects ON projects.id = rooms.project_id
            WHERE rooms.id = generated_inspirations.room_id
            AND projects.user_id = auth.uid()
        )
    );

-- UPDATE: Użytkownik może aktualizować tylko swoje inspiracje
CREATE POLICY update_own_generated_inspirations ON generated_inspirations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            JOIN projects ON projects.id = rooms.project_id
            WHERE rooms.id = generated_inspirations.room_id
            AND projects.user_id = auth.uid()
        )
    );

-- DELETE: Użytkownik może usuwać tylko swoje inspiracje
CREATE POLICY delete_own_generated_inspirations ON generated_inspirations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM rooms
            JOIN projects ON projects.id = rooms.project_id
            WHERE rooms.id = generated_inspirations.room_id
            AND projects.user_id = auth.uid()
        )
    );
```

### 4.6 Polityki RLS dla inspiration_images

```sql
-- SELECT: Użytkownik widzi obrazy ze swoich inspiracji
CREATE POLICY select_own_inspiration_images ON inspiration_images
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM generated_inspirations
            JOIN rooms ON rooms.id = generated_inspirations.room_id
            JOIN projects ON projects.id = rooms.project_id
            WHERE generated_inspirations.id = inspiration_images.generated_inspiration_id
            AND projects.user_id = auth.uid()
        )
    );

-- INSERT: Użytkownik może dodawać obrazy tylko do swoich inspiracji
CREATE POLICY insert_own_inspiration_images ON inspiration_images
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM generated_inspirations
            JOIN rooms ON rooms.id = generated_inspirations.room_id
            JOIN projects ON projects.id = rooms.project_id
            WHERE generated_inspirations.id = inspiration_images.generated_inspiration_id
            AND projects.user_id = auth.uid()
        )
    );

-- UPDATE: Użytkownik może aktualizować tylko swoje obrazy inspiracji
CREATE POLICY update_own_inspiration_images ON inspiration_images
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM generated_inspirations
            JOIN rooms ON rooms.id = generated_inspirations.room_id
            JOIN projects ON projects.id = rooms.project_id
            WHERE generated_inspirations.id = inspiration_images.generated_inspiration_id
            AND projects.user_id = auth.uid()
        )
    );

-- DELETE: Użytkownik może usuwać tylko swoje obrazy inspiracji
CREATE POLICY delete_own_inspiration_images ON inspiration_images
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM generated_inspirations
            JOIN rooms ON rooms.id = generated_inspirations.room_id
            JOIN projects ON projects.id = rooms.project_id
            WHERE generated_inspirations.id = inspiration_images.generated_inspiration_id
            AND projects.user_id = auth.uid()
        )
    );
```

### 4.7 Polityki RLS dla saved_inspirations

```sql
-- SELECT: Użytkownik widzi tylko swoje zapisane inspiracje
CREATE POLICY select_own_saved_inspirations ON saved_inspirations
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Użytkownik może zapisywać inspiracje tylko dla siebie
CREATE POLICY insert_own_saved_inspirations ON saved_inspirations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Użytkownik może aktualizować tylko swoje zapisane inspiracje
CREATE POLICY update_own_saved_inspirations ON saved_inspirations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- DELETE: Użytkownik może usuwać tylko swoje zapisane inspiracje
CREATE POLICY delete_own_saved_inspirations ON saved_inspirations
    FOR DELETE
    USING (auth.uid() = user_id);
```

### 4.8 Polityki RLS dla analytics_events

```sql
-- SELECT: Brak polityki SELECT – klient nie może odczytywać zdarzeń analitycznych
-- (Tylko backend/admin może czytać przez service_role key)

-- INSERT: Użytkownik może zapisywać zdarzenia (tylko INSERT dozwolony)
CREATE POLICY insert_analytics_events ON analytics_events
    FOR INSERT
    WITH CHECK (true);

-- Brak UPDATE i DELETE dla klientów
```

### 4.9 Uwagi dotyczące RLS

- **room_types:** Tabela słownikowa dostępna dla wszystkich użytkowników (read-only dla klientów, write dla admina).
- **Supabase Storage:** Polityki Storage należy skonfigurować osobno, aby ograniczyć dostęp do plików per użytkownik na podstawie `auth.uid()` i powiązań z tabelami `room_photos` i `inspiration_images`.

```sql
-- Polityka dla room_types (read-only dla wszystkich)
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_room_types ON room_types
    FOR SELECT
    USING (true);
```

---

## 5. Dodatkowe uwagi i wyjaśnienia

### 5.1 Soft Delete
- Tabele `projects`, `rooms`, `room_photos`, `generated_inspirations`, `saved_inspirations` używają `deleted_at` do soft delete.
- Partial indexes z `WHERE deleted_at IS NULL` zapewniają wydajność dla zapytań dotyczących aktywnych rekordów.
- Filtrowanie rekordów usuniętych odbywa się po stronie aplikacji.

### 5.2 Storage Path
- Kolumny `storage_path` w tabelach `room_photos` i `inspiration_images` przechowują ścieżkę do pliku w Supabase Storage (nie publiczny URL).
- Organizacja ścieżek: `<user_id>/<room_id>/<photo_id>.<ext>` lub podobna struktura.
- Polityki Supabase Storage oparte o `auth.uid()` i powiązania z tabelami DB.

### 5.3 Analytics Events
- `event_data` jako JSONB pozwala na elastyczne rozszerzanie struktury zdarzeń bez zmian w schemacie.
- RLS blokuje odczyt dla klientów – tylko INSERT jest dozwolony.
- Backend może czytać zdarzenia przez `service_role` key.

### 5.4 Bullet Points
- `bullet_points` w `generated_inspirations` jako JSONB zawiera tablicę stringów.
- Przykład: `["Strefowanie kuchni", "Oświetlenie LED"]`.

### 5.5 Relation: generated_inspirations → saved_inspirations
- Relacja 0..1: jedna inspiracja może być zapisana lub nie.
- `saved_inspirations.generated_inspiration_id` jest kluczem obcym.
- Rejestracja zdarzenia `InspirationSaved` odbywa się podczas INSERT do `saved_inspirations`.

### 5.6 Domyślny Projekt
- Tworzenie domyślnego projektu dla użytkownika odbywa się po stronie aplikacji (nie przez trigger w DB).
- Każdy użytkownik ma jeden domyślny projekt w MVP.

### 5.7 Formatowanie i Typy
- UUID dla wszystkich ID (wyjątek: room_types używa SERIAL).
- TIMESTAMP WITH TIME ZONE dla wszystkich dat.
- ENUM dla `photo_type`.
- JSONB dla `bullet_points` i `event_data`.

### 5.8 Walidacja
- Minimalna walidacja w DB (np. `CHECK (position IN (1, 2))`).
- Większość walidacji (np. min 1 zdjęcie pomieszczenia, 2 inspiracje, max 10 plików) egzekwowana po stronie aplikacji.
- Limit generacji (5 wariantów dziennie) egzekwowany na poziomie wejścia do LLM, nie w bazie danych.

### 5.9 Skalowalność
- Indeksy na FK i typowe filtry zapewniają wydajność.
- Soft delete umożliwia zachowanie historii bez usuwania danych.
- JSONB dla event_data umożliwia elastyczne rozszerzanie analityki.
- Struktura DB pozwala na przyszłą rozbudowę (np. multi-project, współdzielenie inspiracji).

---

## 6. Przykładowe Zapytania

### 6.1 Pobranie pomieszczeń użytkownika
```sql
SELECT r.id, r.project_id, rt.display_name AS room_type, r.created_at
FROM rooms r
JOIN room_types rt ON rt.id = r.room_type_id
JOIN projects p ON p.id = r.project_id
WHERE p.user_id = auth.uid()
AND r.deleted_at IS NULL
ORDER BY r.created_at DESC;
```

### 6.2 Pobranie zapisanych inspiracji użytkownika dla pomieszczenia
```sql
SELECT si.id, si.name, si.style, si.created_at,
       gi.bullet_points,
       ARRAY_AGG(ii.storage_path ORDER BY ii.position) AS image_paths
FROM saved_inspirations si
JOIN generated_inspirations gi ON gi.id = si.generated_inspiration_id
LEFT JOIN inspiration_images ii ON ii.generated_inspiration_id = gi.id
WHERE si.user_id = auth.uid()
AND si.room_id = '<room_id>'
AND si.deleted_at IS NULL
GROUP BY si.id, si.name, si.style, si.created_at, gi.bullet_points
ORDER BY si.created_at DESC;
```

### 6.3 Rejestracja zdarzenia InspirationSaved
```sql
INSERT INTO analytics_events (event_type, event_data, user_id)
VALUES (
    'InspirationSaved',
    '{"inspiration_id": "<uuid>", "room_id": "<uuid>", "room_type": "kitchen", "style": "Skandynawski"}'::jsonb,
    auth.uid()
);
```

---

## 7. Podsumowanie

Schemat bazy danych spełnia wszystkie wymagania PRD i decyzje z sesji planowania:
- ✅ Jeden domyślny projekt na użytkownika (bez triggerów)
- ✅ Pomieszczenia z typami (room_types)
- ✅ Upload zdjęć (room_photos) z rozróżnieniem photo_type (ENUM)
- ✅ Generowanie wariantów (generated_inspirations) z bullet points (JSONB)
- ✅ Obrazy wariantów (inspiration_images) z position i unikalnością
- ✅ Zapis inspiracji (saved_inspirations) z soft-gate
- ✅ Limit generacji egzekwowany na poziomie wejścia do LLM (nie w DB)
- ✅ Soft delete (deleted_at) dla historii
- ✅ Analityka (analytics_events) w formacie JSONB
- ✅ RLS: pełna izolacja danych per użytkownik
- ✅ Storage: storage_path w DB (nie URL)
- ✅ Indeksy dla wydajności

Schemat jest gotowy do implementacji migracji w Supabase.
