## Rozszerzony opis projektu

Projekt zakłada stworzenie webowej aplikacji, która pomaga użytkownikom zaprojektować wykończenie lub remont mieszkania poprzez generowanie realistycznych inspiracji wnętrz. Użytkownik dostarcza zdjęcia swojego mieszkania w stanie niewykończonym oraz zestaw zdjęć inspiracji, a system generuje propozycje aranżacji pomieszczenie po pomieszczeniu w postaci wariantów wizualnych oraz krótkich sugestii funkcjonalnych dotyczących układu.

### Cel produktu i problem użytkownika

Użytkownicy chcą szybko zobaczyć, jak mogłoby wyglądać ich mieszkanie w różnych wariantach stylistycznych i funkcjonalnych, bez konieczności posiadania wiedzy architektonicznej. Produkt ma także wspierać osoby, które chcą wyrobić sobie wstępną wizję przed spotkaniem z architektem. Kluczowe obszary wsparcia decyzji to:

* ogląd różnych wariantów projektu mieszkania/pomieszczenia,
* ogólne wskazówki dotyczące rozplanowania funkcji i stref w pomieszczeniu,
* inspiracje w zakresie doboru materiałów i dodatków wykończeniowych,
* inspiracje i wskazówki dotyczące oświetlenia.

### Grupa docelowa (persony)
1.	Osoba bez wiedzy architektonicznej – planuje wykończenie mieszkania lub remont i potrzebuje prostych, wizualnych podpowiedzi oraz inspiracji, które ułatwią podjęcie decyzji.
2.	Osoba przygotowująca się do współpracy z architektem – chce zebrać pomysły i ułożyć wstępną koncepcję, aby spotkanie z architektem było bardziej konkretne i efektywne.

## Zakres MVP

MVP obejmuje wyłącznie aplikację webową, skupioną na prostym przepływie: użytkownik → pomieszczenia → upload → generacja.

### Kluczowe funkcjonalności
* Zarządzanie listą pomieszczeń przypisaną do użytkownika (bez koncepcji projektu w MVP).
* Dodawanie pomieszczeń z listy predefiniowanych typów (np. kuchnia, łazienka, sypialnia).
* Upload plików dla wybranego pomieszczenia:
	* minimum: 1 zdjęcie danego pomieszczenia (stan niewykończony),
	* minimum: 2 zdjęcia inspiracji dla tego pomieszczenia,
	* obsługiwane formaty: jpg, heic, png,
	* łączny limit plików: do 10 (zależnie od finalnej implementacji limitów per projekt/pomieszczenie).
* Generowanie inspiracji po kliknięciu „Generuj”:
	* generacja dotyczy pojedynczego pomieszczenia,
	* jeden „wariant” to karta zawierająca 2 ujęcia tego samego pomysłu,
	* parametry obrazu: jpg, 1080×720 px,
	* możliwość kliknięcia przycisku „Wygeneruj kolejny wariant”.
* Sugestie tekstowe układu:
	* do każdego wariantu generowane są proste bullet points, które wspierają decyzje dot. ogólnego rozplanowania (na MVP bez precyzyjnych planów czy rzutów mebli).

### Ograniczenia MVP
* Brak aplikacji mobilnej (tylko web).
* Brak obsługi innych dokumentów niż obrazy (brak PDF/DOC itp.).
* Brak funkcji usuwania danych i zdefiniowanej retencji w MVP.
* Prywatność: pliki i projekty są dostępne wyłącznie dla użytkownika (kontrola dostępu).

### Limity i kontrola użycia
* Limit generacji: użytkownik może wygenerować maksymalnie 5 wariantów dziennie (limit oparty o zdarzenie GenerationCompleted).
* W tej iteracji MVP aplikacja wymaga logowania — limity są egzekwowane per użytkownik.

### Doświadczenie użytkownika (wysoki poziom)
1.	Użytkownik loguje się / tworzy konto.
2.	Dodaje pomieszczenie z listy.
4.	Uploaduje 1 zdjęcie pomieszczenia + 2 inspiracje (oznaczone jako to pomieszczenie).
5.	Klika „Generuj” i otrzymuje wariant (karta) z 2 ujęciami + bullet points z sugestiami.
6.	Może wygenerować kolejny wariant (aż do limitu dziennego).

## Analityka i kryteria sukcesu

### W MVP wdrażane są zdarzenia:
* ProjectCreated
* (Opcjonalnie) InspirationGenerated

Horyzont pomiaru: 30 dni.

### Kryteria sukcesu:
	•	50% użytkowników wygeneruje co najmniej 2 warianty w okresie 30 dni.

### Docelowy efekt
Po zakończeniu korzystania z MVP użytkownik ma mieć możliwość wygenerowania kilku wariantów inspiracji dla konkretnych pomieszczeń, które pomagają mu:

* podjąć decyzje o stylu i kierunku wykończenia,
* lepiej zrozumieć możliwe układy i funkcje pomieszczeń (na poziomie ogólnych wskazówek),
* przygotować się do rozmowy z architektem lub rozpocząć samodzielne planowanie remontu.