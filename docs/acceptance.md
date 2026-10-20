# Procedura Odbioru Produktu (Acceptance)

Zgodnie z metodyką odbioru, proces ten potwierdza, że wszystkie wymogi funkcjonalne i niefunkcjonalne z umowy i specyfikacji zostały zrealizowane. Proces ma charakter iteracyjny.

## 1. Środowisko testowe (Środowisko wdrożeniowe)

Wykonawca udostępnia klientowi środowisko testowe (staging/pre-produkcyjne):

- **Aplikacja Web:** Uruchomiona na serwerze wykonawcy (lub u klienta) pod dedykowanym adresem URL.
- **Rozszerzenie VS Code:** Ponieważ aplikacja nie trafia do publicznego App Store, udostępniamy plik `.vsix` do instalacji w zamkniętej grupie testowej.
- **Baza danych:** Wypełniona bezpiecznymi danymi testowymi (lub danymi klienta w zamkniętej sieci, jeśli klient sobie tego życzy).

## 2. Przebieg testów i Protokół zgodności

Klient wspólnie z wykonawcą weryfikuje działanie systemu. Wyniki trafiają do tabeli:
_Zaznaczamy ✅ jeśli działa, ❌ jeśli jest błąd (z opisem), lub „Akceptacja” jeśli zmiana po drodze została uznana za lepszą._

| Kategoria           | Wymóg (z umowy/specyfikacji)                       | Status | Uwagi |
| :------------------ | :------------------------------------------------- | :----- | :---- |
| **Funkcjonalne**    | Rejestracja i logowanie użytkownika                | [ ]    |       |
| **Funkcjonalne**    | Generowanie kluczy API dla deweloperów             | [ ]    |       |
| **Funkcjonalne**    | Instalacja rozszerzenia i autoryzacja kluczem      | [ ]    |       |
| **Funkcjonalne**    | Śledzenie aktywności (idle po 2 min. bezczynności) | [ ]    |       |
| **Funkcjonalne**    | Śledzenie komend terminala i commitów Git          | [ ]    |       |
| **Funkcjonalne**    | Panel Web z dashboardem (heatmapa, statystyki)     | [ ]    |       |
| **Funkcjonalne**    | Eksport danych do pliku CSV                        | [ ]    |       |
| **Niefunkcjonalne** | Wydajność (odpowiedź API < 200ms)                  | [ ]    |       |
| **Niefunkcjonalne** | Bezpieczeństwo (hasła i klucze szyfrowane)         | [ ]    |       |
| **Niefunkcjonalne** | Zgodność z RODO (Privacy First)                    | [ ]    |       |

## 3. Harmonogram poprawy usterek (Iteracja)

Jeśli w Protokole pojawiły się błędy (❌), tworzymy harmonogram ich naprawy. Proces powtarzamy do momentu uzyskania pełnej zgodności.

| ID     | Opis niezgodności / błędu | Priorytet       | Termin poprawy | Status (do weryfikacji) |
| :----- | :------------------------ | :-------------- | :------------- | :---------------------- |
| BUG-01 |                           | Wysoki / Średni |                | Oczekuje                |
| BUG-02 |                           | Niski           |                | Oczekuje                |

## 4. Odbiór końcowy

1. Wykonawca dostarcza poprawioną wersję (nowy build).
2. Klient ponownie weryfikuje punkty z Harmonogramu.
3. Gdy wszystkie punkty w Protokole są na "zielono", obie strony podpisują ostateczny protokół odbioru. Produkt jest gotowy do wdrożenia na produkcję.
