### Scenariusze testów E2E dla DashboardPage

#### 1. Podstawowe wyświetlanie strony
1.1 Wyświetlanie pustego dashboardu (pierwszy użytkownik)

    Given: Zalogowany użytkownik bez żadnych pokoi
    When: Użytkownik wchodzi na stronę /dashboard
    Then:
    Widoczny nagłówek "Dashboard"
    Widoczny przycisk "Utwórz pokój" w nagłówku
    Widoczna sekcja "Twoje pokoje"
    Widoczny komunikat "Brak pokoi"
    Widoczny przycisk "Stwórz swój pierwszy pokój"

1.2 Wyświetlanie dashboardu z pokojami

    Given: Zalogowany użytkownik z utworzonymi pokojami
    When: Użytkownik wchodzi na stronę /dashboard
    Then:
    Widoczny nagłówek "Dashboard"
    Widoczna lista kart pokoi w siatce
    Każda karta zawiera: nazwę typu pokoju, liczbę zdjęć (pomieszczenie/inspiracje), daty utworzenia i aktualizacji

#### 2. Tworzenie nowego pokoju
2.1 Otwieranie dialogu tworzenia pokoju przez nagłówek

    Given: Użytkownik na stronie /dashboard
    When: Użytkownik klika przycisk "Utwórz pokój" w nagłówku
    Then:
    Pojawia się modal "Utwórz pokój"
    Widoczna lista typów pokoi w select
    Przyciski "Anuluj" i "Utwórz" są widoczne
    Przycisk "Utwórz" jest disabled (brak wyboru)

2.2 Otwieranie dialogu tworzenia pierwszego pokoju

    Given: Użytkownik bez pokoi na stronie /dashboard
    When: Użytkownik klika "Stwórz swój pierwszy pokój"
    Then:
    Pojawia się modal "Utwórz pokój"
    Widoczna lista typów pokoi w select

2.3 Pomyślne utworzenie pokoju

    Given: Otwarty dialog tworzenia pokoju
    When:
    Użytkownik wybiera typ pokoju z listy (np. "Salon")
    Użytkownik klika przycisk "Utwórz"
    Then:
    Pojawia się toast z komunikatem "Pokój został utworzony"
    Użytkownik zostaje przekierowany na /rooms/{id}

2.4 Anulowanie tworzenia pokoju

    Given: Otwarty dialog tworzenia pokoju z wybranym typem
    When: Użytkownik klika "Anuluj"
    Then:
    Dialog zostaje zamknięty
    Użytkownik pozostaje na stronie /dashboard
    Nowy pokój nie został utworzony

2.5 Zamknięcie dialogu przez "X" lub kliknięcie poza nim

    Given: Otwarty dialog tworzenia pokoju
    When: Użytkownik zamyka dialog (X lub kliknięcie poza)
    Then:
    Dialog zostaje zamknięty
    Formularz zostaje zresetowany (brak zapamiętanej wartości przy ponownym otwarciu)

#### 3. Nawigacja do szczegółów pokoju
3.1 Przejście do szczegółów pokoju przez kliknięcie karty

    Given: Użytkownik na dashboardzie z widocznymi kartami pokoi
    When: Użytkownik klika na kartę pokoju
    Then:
    Użytkownik zostaje przekierowany na /rooms/{id}

3.2 Hover na karcie pokoju

    Given: Użytkownik na dashboardzie z widocznymi kartami pokoi
    When: Użytkownik najeżdża kursorem na kartę
    Then:
    Karta zmienia wygląd (hover state)
    Strzałka "→" zmienia kolor

####  4. Obsługa błędów
4.1 Błąd ładowania pokoi

    Given: Symulowany błąd API przy pobieraniu pokoi
    When: Użytkownik wchodzi na /dashboard
    Then:
    Widoczny komunikat błędu
    Widoczny przycisk "Spróbuj ponownie"

4.2 Retry po błędzie ładowania

    Given: Wyświetlony błąd ładowania pokoi
    When: Użytkownik klika "Spróbuj ponownie"
    Then:
    Ponowne zapytanie do API
    Przy sukcesie: wyświetlenie listy pokoi lub komunikatu o braku pokoi

4.3 Błąd tworzenia pokoju

Given: Otwarty dialog tworzenia pokoju, symulowany błąd API
When:
Użytkownik wybiera typ pokoju
Użytkownik klika "Utwórz"
Then:
Pojawia się toast z komunikatem błędu
Dialog pozostaje otwarty
Użytkownik może spróbować ponownie

4.4 Błąd autoryzacji podczas tworzenia pokoju

Given: Wygasła sesja użytkownika, otwarty dialog
When: Użytkownik próbuje utworzyć pokój
Then:
Użytkownik zostaje przekierowany na /login

#### 5. Stany ładowania

5.1 Loading state podczas ładowania pokoi

Given: Użytkownik wchodzi na /dashboard
When: Trwa ładowanie pokoi z API
Then:
Widoczny spinner z tekstem "Ładowanie pokoi..."
Przycisk "Utwórz pokój" jest disabled

5.2 Loading state podczas tworzenia pokoju

Given: Otwarty dialog, użytkownik wybrał typ pokoju
When: Użytkownik klika "Utwórz" i trwa wysyłanie żądania
Then:
Przycisk "Utwórz" pokazuje spinner i tekst "Tworzenie..."
Przycisk "Anuluj" jest disabled
Select typu pokoju jest disabled

5.3 Loading state typów pokoi w dialogu

Given: Użytkownik otwiera dialog tworzenia pokoju po raz pierwszy
When: Trwa ładowanie listy typów pokoi
Then:
Widoczny spinner z tekstem "Ładowanie typów..."
Select jest ukryty

#### 6. Responsywność

6.1 Widok mobilny (< 640px)

Given: Viewport o szerokości < 640px
When: Użytkownik przegląda dashboard
Then:
Nagłówek układa się w kolumnie
Karty pokoi w 1 kolumnie

6.2 Widok tablet (640px - 1024px)

Given: Viewport o szerokości 640-1024px
When: Użytkownik przegląda dashboard
Then:
Karty pokoi w 2 kolumnach

6.3 Widok desktop (> 1024px)

Given: Viewport o szerokości > 1024px
When: Użytkownik przegląda dashboard
Then:
Karty pokoi w 3 kolumnach

#### 7. Dostępność (a11y)

7.1 Nawigacja klawiaturą przez karty

Given: Użytkownik na dashboardzie z pokojami
When: Użytkownik nawiguje używając klawisza Tab
Then:
Karty pokoi są focusable
Widoczny focus ring
Enter otwiera szczegóły pokoju

7.2 Nawigacja klawiaturą w dialogu

Given: Otwarty dialog tworzenia pokoju
When: Użytkownik nawiguje klawiszem Tab
Then:
Focus przechodzi między: select → przycisk "Anuluj" → przycisk "Utwórz"
Escape zamyka dialog

7.3 ARIA labels i live regions

Given: Użytkownik korzystający ze screen readera
When: Przegląda dashboard
Then:
Loading states mają aria-live="polite"
Sekcje mają odpowiednie aria-labelledby
Błędy mają role="alert"

#### 8. Sortowanie i formatowanie

8.1 Sortowanie typów pokoi w dialogu

Given: Otwarty dialog z załadowanymi typami pokoi
When: Użytkownik przegląda listę w select
Then:
Typy pokoi posortowane alfabetycznie (polska kolejność)

8.2 Formatowanie dat

Given: Karty pokoi z datami utworzenia/aktualizacji
When: Użytkownik przegląda dashboard
Then:
Daty w formacie DD.MM.YYYY (polski format)