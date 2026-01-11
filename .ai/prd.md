# Dokument wymagań produktu (PRD) – Home Inspiration Generator

## 1. Przegląd produktu
Home Inspiration Generator to webowa aplikacja umożliwiająca użytkownikom generowanie wizualnych inspiracji aranżacji wnętrz na podstawie zdjęć własnego mieszkania w stanie niewykończonym oraz zdjęć inspiracyjnych. Produkt pomaga szybko zobaczyć możliwe warianty wykończenia poszczególnych pomieszczeń oraz uzyskać proste sugestie funkcjonalne, bez konieczności posiadania wiedzy architektonicznej.

Na etapie MVP użytkownik pracuje zawsze w obrębie jednego, domyślnego projektu mieszkania, który zawiera listę pomieszczeń. Nie ma funkcji tworzenia wielu projektów ani przełączania się między nimi.

Produkt działa w modelu soft-gate: użytkownik może generować inspiracje bez konta, natomiast zapis wyników wymaga rejestracji lub logowania.

## 2. Problem użytkownika
Użytkownicy planujący wykończenie lub remont mieszkania:
- mają trudność z wyobrażeniem sobie efektu końcowego na podstawie pustych lub niewykończonych pomieszczeń,
- nie potrafią łatwo przełożyć inspiracji z Internetu na własną przestrzeń,
- chcą szybko porównać kilka wariantów stylistycznych i funkcjonalnych,
- potrzebują wizualnych materiałów wspierających decyzje przed spotkaniem z architektem lub rozpoczęciem remontu.

Aplikacja rozwiązuje te problemy, generując realistyczne wizualizacje dopasowane do zdjęć konkretnego pomieszczenia oraz uzupełniając je o krótkie, zrozumiałe wskazówki aranżacyjne.

## 3. Wymagania funkcjonalne

### 3.1 Zarządzanie użytkownikiem
- Możliwość korzystania z aplikacji bez zakładania konta do momentu zapisu inspiracji.
- Rejestracja i logowanie użytkownika (np. email + hasło).
- Każdy użytkownik ma prywatny dostęp do swoich zapisanych inspiracji.
- Dane użytkownika są niedostępne dla innych użytkowników.

### 3.2 Struktura mieszkania
- Aplikacja posiada jeden domyślny projekt mieszkania.
- Projekt zawiera listę pomieszczeń.
- Brak możliwości tworzenia, usuwania lub przełączania projektów w MVP.

### 3.3 Pomieszczenia
- Dodawanie pomieszczeń do mieszkania z listy predefiniowanych typów (np. kuchnia, łazienka, sypialnia, salon).
- Każde pomieszczenie stanowi oddzielny kontekst generowania inspiracji.
- Użytkownik może wybrać istniejące pomieszczenie i kontynuować pracę nad nim.

### 3.4 Upload plików
- Upload zdjęć przypisanych do konkretnego pomieszczenia.
- Minimalne wymagania:
  - co najmniej 1 zdjęcie pomieszczenia w stanie niewykończonym,
  - co najmniej 2 zdjęcia inspiracji.
- Obsługiwane formaty: jpg, heic, png.
- Maksymalny łączny limit plików: 10.
- Możliwość dodania krótkiego opisu do każdego zdjęcia (co przedstawia).

### 3.5 Generowanie inspiracji
- Generowanie uruchamiane przyciskiem „Generuj”.
- Generacja dotyczy jednego pomieszczenia.
- Jeden wariant:
  - karta inspiracji zawierająca 2 obrazy tego samego pomysłu,
  - format: jpg, rozdzielczość 1080×720 px.
- Do każdego wariantu generowane są krótkie bullet points z ogólnymi sugestiami funkcjonalnymi (np. strefowanie, oświetlenie).
- Możliwość wygenerowania kolejnego wariantu dla tego samego pomieszczenia.
- Limit generacji: kontrolowany przez dostępne kredyty w LLM, bez twardego limitu dziennego w aplikacji.

### 3.6 Zapis inspiracji
- Możliwość zapisania pojedynczego wariantu jako karty inspiracji.
- Zapis wymaga posiadania konta (soft-gate).
- Podczas zapisu użytkownik:
  - nadaje nazwę karcie inspiracji,
  - karta jest przypisana do konkretnego pomieszczenia,
  - styl jest polem opcjonalnym.
- Galeria zapisanych inspiracji z możliwością filtrowania po pomieszczeniu.

### 3.7 Analityka
- Rejestrowane zdarzenia:
  - InspirationSaved.
- Dane wykorzystywane do oceny metryk sukcesu w horyzoncie 30 dni.

## 4. Granice produktu
- Brak aplikacji mobilnej (tylko web).
- Brak obsługi dokumentów innych niż obrazy (brak PDF, DOC itp.).
- Brak funkcji usuwania danych i zdefiniowanej retencji w MVP.
- Brak precyzyjnych planów technicznych, rzutów mebli i wymiarowania.
- Brak współdzielenia inspiracji z innymi użytkownikami.
- Brak obsługi wielu projektów mieszkań.

## 5. Historyjki użytkowników

### US-001
ID: US-001  
Tytuł: Dodanie pomieszczenia do mieszkania  
Opis: Jako użytkownik chcę dodać pomieszczenie do mojego mieszkania, aby móc generować dla niego inspiracje.  
Kryteria akceptacji:
- Użytkownik może wybrać typ pomieszczenia z listy.
- Pomieszczenie pojawia się na liście pomieszczeń.

### US-002
ID: US-002  
Tytuł: Wybór pomieszczenia  
Opis: Jako użytkownik chcę wybrać konkretne pomieszczenie, aby pracować tylko na jego zdjęciach i inspiracjach.  
Kryteria akceptacji:
- Wybrane pomieszczenie jest jasno oznaczone jako aktywne.
- Dalsze akcje dotyczą tylko tego pomieszczenia.

### US-003
ID: US-003  
Tytuł: Upload zdjęć pomieszczenia i inspiracji  
Opis: Jako użytkownik chcę wgrać zdjęcia pomieszczenia oraz inspiracje, aby system mógł wygenerować warianty aranżacji.  
Kryteria akceptacji:
- System wymaga minimum 1 zdjęcia pomieszczenia i 2 inspiracji.
- Akceptowane są tylko formaty jpg, png.
- System blokuje upload powyżej 10 plików.
- Użytkownik może dodać opis do zdjęcia.

### US-004
ID: US-004  
Tytuł: Walidacja niekompletnego uploadu  
Opis: Jako użytkownik chcę otrzymać informację, gdy nie spełniam wymagań uploadu, aby wiedzieć co uzupełnić.  
Kryteria akceptacji:
- Przycisk „Generuj” jest nieaktywny przy niespełnionych wymaganiach.
- Wyświetlany jest komunikat o brakujących zdjęciach.

### US-005
ID: US-005  
Tytuł: Generowanie pierwszego wariantu  
Opis: Jako użytkownik chcę wygenerować inspirację dla pomieszczenia, aby zobaczyć możliwy wygląd wnętrza.  
Kryteria akceptacji:
- Po kliknięciu „Generuj” pojawia się karta z 2 obrazami.
- Wyświetlane są bullet points z sugestiami.

### US-006
ID: US-006  
Tytuł: Generowanie kolejnego wariantu  
Opis: Jako użytkownik chcę wygenerować kolejny wariant, aby porównać różne pomysły.  
Kryteria akceptacji:
- Każda generacja tworzy nową kartę.
- System działa w ramach dostępnych kredytów LLM.

### US-007
ID: US-007  
Tytuł: Zapis inspiracji przez zalogowanego użytkownika  
Opis: Jako zalogowany użytkownik chcę zapisać wybrany wariant, aby wrócić do niego później.  
Kryteria akceptacji:
- Użytkownik nadaje nazwę inspiracji.
- Inspiracja pojawia się w galerii.
- Rejestrowane jest zdarzenie InspirationSaved.

### US-008
ID: US-008  
Tytuł: Soft-gate przy zapisie inspiracji  
Opis: Jako niezalogowany użytkownik chcę zostać poproszony o założenie konta przy zapisie inspiracji.  
Kryteria akceptacji:
- Próba zapisu uruchamia rejestrację lub logowanie.
- Po zalogowaniu zapis jest kontynuowany.

### US-009
ID: US-009  
Tytuł: Uwierzytelnianie i bezpieczny dostęp  
Opis: Jako użytkownik chcę mieć pewność, że tylko ja mam dostęp do moich zapisanych inspiracji.  
Kryteria akceptacji:
- Dostęp do zapisanych inspiracji wymaga zalogowania.
- Użytkownik widzi wyłącznie swoje dane.
- Sesja użytkownika działa poprawnie po zalogowaniu i wylogowaniu.

### US-010
ID: US-010  
Tytuł: Przeglądanie galerii zapisanych inspiracji  
Opis: Jako użytkownik chcę przeglądać zapisane inspiracje i filtrować je po pomieszczeniu.  
Kryteria akceptacji:
- Galeria wyświetla wszystkie zapisane karty.
- Dostępny jest filtr po pomieszczeniu.

### US-011
ID: US-011  
Tytuł: Obsługa błędów generacji  
Opis: Jako użytkownik chcę otrzymać czytelną informację, gdy generacja się nie powiedzie.  
Kryteria akceptacji:
- Wyświetlany jest komunikat o błędzie.
- Użytkownik może ponowić próbę bez utraty danych.

## 6. Metryki sukcesu
- 30% wygenerowanych wariantów zostanie zapisanych jako karty inspiracji w okresie 30 dni.
- 50% użytkowników wygeneruje co najmniej 2 warianty w okresie 30 dni.
- Liczba zapisanych inspiracji jako główny wskaźnik wartości produktu.