# Procedura Wdrożenia Produktu (Deployment)

Niniejszy dokument opisuje wymagania wdrożeniowe oraz kroki niezbędne do wprowadzenia systemu DevPulse (Aplikacja Webowa + Rozszerzenie VS Code) w środowisku klienta.

## 1. Infrastruktura i Hosting

System DevPulse wymaga serwera do obsługi Backendu (NestJS), Frontendu (Next.js) oraz bazy danych (PostgreSQL + Redis).

- **TODO:** _Miejsce hostingu (np. VPS, Vercel, Render, AWS) zostanie ostatecznie wybrane na etapie wdrożenia. Może to być infrastruktura zarządzana przez wykonawcę (SaaS) lub dostarczona przez klienta (On-Premise)._
- Wymagane jest posiadanie domeny (np. `app.devpulse.pl`) oraz certyfikatu SSL.

## 2. Dystrybucja Rozszerzenia VS Code (Odpowiednik Sklepu z Aplikacjami)

- **Opcja A (VS Code Marketplace):** Publikacja w oficjalnym sklepie. Wymaga przejścia procesu moderacji (poprawny `package.json`, `README.md` oraz `PRIVACY.md`, weryfikacja wydajności i bezpieczeństwa).
- **Opcja B (Dystrybucja wewnętrzna):** Instalacja pliku `.vsix` poza sklepem (dla zamkniętej grupy deweloperów, gdy klient nie chce publikować aplikacji publicznie).

## 3. Dane początkowe i Migracja

- System DevPulse jest systemem nowym (greenfield). **Nie wymaga migracji danych z poprzednich systemów.**
- **Dane początkowe:** Klient nie musi dostarczać żadnych danych przed startem. System zaczyna zbierać dane całkowicie od zera, w momencie gdy deweloperzy zainstalują rozszerzenie.

## 4. Przygotowanie po stronie klienta i Czas wdrożenia

- **Brak przerwy technicznej:** Wdrożenie **nie wymaga** zamykania oddziałów firmy, zawieszania sprzedaży ani organizowania tzw. "okien serwisowych".
- **Czas inicjalizacji:** Przy pierwszym uruchomieniu Backend automatycznie nakłada migracje TypeORM. Proces ten trwa zazwyczaj kilka sekund. Przetwarzanie danych w tle (Redis) nie blokuje pracy użytkowników.

## 5. Wymagania co do uruchomienia dla użytkowników końcowych (Rollout)

W celu uniknięcia problemów z adaptacją, zaleca się **wdrożenie krokowe (Pilot / Phased Rollout)**:

- **Faza 1 (Pilot / Beta):** Instalacja rozszerzenia oraz udostępnienie panelu Web dla zamkniętej grupy użytkowników (np. 5-10 deweloperów). Pozwala to na zebranie feedbacku i sprawdzenie wydajności.
- **Faza 2 (Full Release):** Po pomyślnym zakończeniu fazy Beta, publikacja dla całej firmy.
