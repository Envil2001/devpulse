# Wymagania Środowiskowe i Procedura Uruchomienia

## 1. Wymagania środowiskowe (Backend + Frontend)

Poniższa tabela przedstawia minimalne i rekomendowane wymagania niezbędne do uruchomienia pełnego środowiska projektowego (baza danych, backend, frontend).

| Komponent                  | Wersja minimalna                                      | Wersja rekomendowana             |
| :------------------------- | :---------------------------------------------------- | :------------------------------- |
| **System Operacyjny**      | macOS 12+, Linux (Ubuntu 20.04+), Windows 10 (z WSL2) | macOS 14+, Linux (Ubuntu 22.04+) |
| **Node.js**                | v20.x (LTS)                                           | v20.11.0 lub nowszy              |
| **Menedżer pakietów**      | pnpm v9.x                                             | pnpm v9.14.2                     |
| **Baza danych**            | PostgreSQL 15 (Docker)                                | PostgreSQL 16 (Docker)           |
| **Usługi pomocnicze**      | Redis 7 (Docker)                                      | Redis 7.x (Docker)               |
| **Zależności systemowe**   | `git` w zmiennej PATH                                 | `git` w wersji 2.40+             |
| **Środowisko kontenerowe** | Docker Desktop / Docker Engine                        | Docker z obsługą Docker Compose  |

## 2. Wymagania dla Rozszerzenia VS Code

- **VS Code:** wersja **1.93.0** lub nowsza (wymagane przez VS Code Shell Integration API).
- **System Operacyjny:** macOS, Windows, Linux.
- **Zależności systemowe:** `git` w zmiennej PATH (wymagane do śledzenia commitów).
- **Uprawnienia:** Środowisko musi być zaufane (Trusted Workspace), aby rozszerzenie mogło uruchomić telemetrię.

## 3. Zewnętrzne usługi (opcjonalne dla dev)

Aby w pełni korzystać z funkcji AI oraz wysyłki e-maili, wymagane są klucze API:

- **OpenRouter API** (lub OpenAI API) – do generowania podsumowań AI.
- **Resend** – do wysyłki e-maili (np. weryfikacja konta).

---

## 4. Procedura uruchomienia (Środowisko deweloperskie)

### Krok 1: Klonowanie i instalacja zależności

```bash
git clone https://github.com/Envil2001/devpulse.git
cd devpulse
pnpm install
```

### Krok 2: Konfiguracja zmiennych środowiskowych

Skopiuj plik `.env.example` do `.env` w katalogu głównym:

```bash
cp .env.example .env
```

Następnie uzupełnij plik `.env` (m.in. `DATABASE_URL`, `REDIS_URL`, klucze API).

### Krok 3: Uruchomienie infrastruktury (Docker)

Uruchom bazę danych PostgreSQL oraz Redis:

```bash
docker compose up -d
```

### Krok 4: Migracje bazy danych

Przejdź do katalogu backendu i uruchom migracje TypeORM:

```bash
cd backend
pnpm migration:run
```

### Krok 5: Uruchomienie backendu (NestJS)

```bash
# W katalogu backend/
pnpm start:dev
```

API będzie dostępne pod adresem `http://localhost:3000/api/v1`.
Surowa specyfikacja OpenAPI (format JSON, używany przez frontend do generowania dokumentacji) jest dostępna pod adresem `http://localhost:3000/api/v1/docs-json`.

### Krok 6: Uruchomienie frontendu (Next.js)

Otwórz nowy terminal i przejdź do katalogu web:

```bash
cd packages/web
pnpm dev
```

Panel główny będzie dostępny pod adresem `http://localhost:3001`.
Dokumentacja API (interaktywny Swagger UI) jest dostępna pod adresem: `http://localhost:3001/docs`

### Krok 7: Uruchomienie rozszerzenia VS Code

1. Otwórz główny folder projektu (`devpulse/`) w VS Code.
2. Naciśnij **F5** (Run -> Start Debugging).
3. Otworzy się nowe okno `[Extension Development Host]`.
4. W nowym oknie użyj komendy `DevPulse: Set API Key` i wklej klucz wygenerowany w panelu (Settings -> API Keys).

---

## 5. Proces budowania wersji produkcyjnej (Prod)

### Backend (NestJS)

```bash
cd backend
pnpm build
pnpm start:prod
```

### Frontend (Next.js)

```bash
cd packages/web
pnpm build
pnpm start
```

### Rozszerzenie VS Code

```bash
cd packages/vscode-extension
pnpm compile
pnpm vsce package --no-dependencies
```

Wynikiem będzie plik `devpulse-0.0.1.vsix`, który można zainstalować za pomocą komendy w VS Code: `Extensions: Install from VSIX...`.
