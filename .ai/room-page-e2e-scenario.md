### Scenariusze testów E2E dla RoomPage

#### 1. Podstawowe wyświetlanie strony pokoju

1.1 Wyświetlanie pustego pokoju (bez zdjęć)

    Given: Zalogowany użytkownik z utworzonym pokojem bez zdjęć
    When: Użytkownik wchodzi na stronę /rooms/{roomId}
    Then:
    Widoczny nagłówek z nazwą typu pokoju (np. "Salon")
    Widoczny link "← Wróć do dashboardu"
    Widoczne daty utworzenia i aktualizacji
    Widoczna sekcja "Zdjęcia pomieszczenia" z opisem
    Widoczna sekcja "Zdjęcia inspiracji" z opisem
    Widoczny tracker wymagań z licznikami (0/1 room, 0/2 inspiration)
    Obie sekcje zdjęć są puste (brak zdjęć)
    Przyciski upload są aktywne

1.2 Wyświetlanie pokoju ze zdjęciami room

    Given: Zalogowany użytkownik z pokojem zawierającym zdjęcia room (min 1)
    When: Użytkownik wchodzi na stronę /rooms/{roomId}
    Then:
    Widoczna sekcja "Zdjęcia pomieszczenia" z kartami zdjęć
    Każda karta zawiera: miniaturę, opis (jeśli dodany), datę dodania
    Licznik pokazuje "room: 1/1" (lub więcej)
    Tracker wymagań pokazuje spełniony wymóg dla room (1/1)

1.3 Wyświetlanie pokoju ze zdjęciami inspiration

    Given: Zalogowany użytkownik z pokojem zawierającym zdjęcia inspiration (min 2)
    When: Użytkownik wchodzi na stronę /rooms/{roomId}
    Then:
    Widoczna sekcja "Zdjęcia inspiracji" z kartami zdjęć
    Każda karta zawiera: miniaturę, opis (jeśli dodany), datę dodania
    Licznik pokazuje "inspiration: 2/2" (lub więcej)
    Tracker wymagań pokazuje spełniony wymóg dla inspiration (2/2)


#### 2. Upload zdjęć pomieszczenia (room)

2.1 Upload zdjęcia room z opisem

    Given: Pokój na stronie /rooms/{roomId}
    When:
    Użytkownik wpisuje opis w pole tekstowe (max 500 znaków)
    Użytkownik klika "Wybierz zdjęcie" w sekcji "Zdjęcia pomieszczenia"
    Użytkownik wybiera plik zdjęcia
    Then:
    Po zakończeniu uploadu: nowa karta zdjęcia zawiera wpisany opis
    Pole opisu zostaje wyczyszczone
    Licznik zwiększa się o 1

2.2 Wyświetlanie wielu zdjęć room

    Given: Pokój z już dodanymi zdjęciami room
    When: Użytkownik dodaje kolejne zdjęcie room
    Then:
    Nowe zdjęcie pojawia się w siatce zdjęć
    Wszystkie zdjęcia są widoczne w formie kart
    Licznik pokazuje aktualną liczbę zdjęć

#### 3. Upload zdjęć inspiracji (inspiration)

3.1 Upload pierwszego zdjęcia inspiration

    Given: Pusty pokój na stronie /rooms/{roomId}
    When:
    Użytkownik klika "Wybierz zdjęcie" w sekcji "Zdjęcia inspiracji"
    Użytkownik wybiera plik zdjęcia
    Then:
    Po zakończeniu: nowa karta zdjęcia pojawia się w sekcji
    Licznik zmienia się na "inspiration: 1/2"
    Tracker wymagań pokazuje niezspełniony wymóg (1/2)

3.2 Upload drugiego zdjęcia inspiration - spełnienie wymogu

    Given: Pokój z 1 zdjęciem inspiration
    When: Użytkownik dodaje drugie zdjęcie inspiration
    Then:
    Licznik zmienia się na "inspiration: 2/2"
    Tracker wymagań pokazuje spełniony wymóg (2/2)

3.3 Upload zdjęcia inspiration z opisem

    Given: Pokój na stronie /rooms/{roomId}
    When:
    Użytkownik wpisuje opis w pole tekstowe
    Użytkownik dodaje zdjęcie inspiration
    Then:
    Nowa karta zdjęcia zawiera wpisany opis
    Pole opisu zostaje wyczyszczone
