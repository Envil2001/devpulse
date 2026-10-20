# Polityka Kopii Zapasowych (Backup)

Zgodnie z dobrą praktyką, definiujemy kto jest odpowiedzialny za kopie zapasowe, jakie są ich atrybuty oraz jak zabezpieczamy dane.

## 1. Kto jest odpowiedzialny za kopię zapasową? (3 scenariusze)

- **Scenariusz 1: Aplikacja.** System nie wykonuje kopii sam z siebie, korzysta z wbudowanych mechanizmów bazy danych.
- **Scenariusz 2: Użytkownik / Właściciel systemu (On-Premise).** Jeśli klient hostuje system u siebie, jego dział IT odpowiada za kopie. Wykonawca dostarcza gotowe skrypty i instrukcje.
- **Scenariusz 3: Strona infrastrukturalna (Hosting/Chmura).** Jeśli używamy gotowych usług (np. AWS RDS, Supabase), kopie są wykonywane automatycznie przez dostawcę. My jedynie weryfikujemy ich poprawność.

## 2. Co z urządzeniem użytkownika końcowego?

W systemie DevPulse dane nie są trzymane tylko na komputerze dewelopera.

- **Utrata komputera:** Jeśli deweloper zgubi laptopa, wszystkie jego sesje i statystyki są bezpieczne na serwerze (w bazie PostgreSQL). Wystarczy zalogować się na nowym urządzeniu.
- **Co przepada:** Przepada jedynie lokalny bufor nie wysłanych zdarzeń (maks. 500) oraz klucz API (który trzeba wygenerować na nowo w panelu).

## 3. Atrybuty kopii zapasowej

- **Baza danych (PostgreSQL):**
  - **Rodzaj:** Pełna kopia (Full backup) raz na dobę.
  - **Interwał:** Codziennie o godzinie 03:00.
  - **Retencja:** Przechowujemy 30 dni wstecz.
  - **Miejsce:** Zewnętrzny serwer SFTP lub Bucket S3 (dane szyfrowane).
- **Pliki/Konfiguracja (Redis):**
  - **Rodzaj:** Snapshot (RDB).
  - **Interwał:** Co 24 godziny.
  - **Uwaga:** Redis przechowuje kolejkę zdarzeń. W przypadku awarii tracimy jedynie zdarzenia z ostatnich minut.
