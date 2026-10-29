# RX CLOUD 4.1 — audyt przed własnym serwerem (2026-10-29)

## Stan potwierdzony
- CI sprawdza serwer HTTP, statyczne zasoby, izolowaną instalację, panel Królowej, kontrakty modułów i bramkę bezpieczeństwa pakietu.
- Instalator domyślnie wykonuje tylko dry-run; nie uruchamia usługi ani nie zmienia DNS.
- RX CLOUD 4.1 usunął domyślny adres produkcyjnej bazy Supabase: bez jawnego SUPABASE_URL serwer odmawia startu.
- Testy offline korzystają z fikcyjnego adresu staging i nie wymagają dostępu do bazy.

## BLOKADY przed uruchomieniem publicznym
1. Brak potwierdzonego serwera VPS, dostępu SSH, domeny testowej i aktywnego HTTPS.
2. Brak pełnego audytu uprawnień i zachowania adaptera Worker: logowanie, sesje, upload zdjęć, moderacja, push, OAuth, CORS, rate limits, nagłówki proxy.
3. Brak testów obciążeniowych, trwałości danych, backupu i odtwarzania oraz przećwiczonego rollback.
4. Instalator kopiuje wszystkie pliki .cjs i .mjs oraz liczne zasoby do katalogu public: przed produkcją ograniczyć listę do niezbędnych plików i przejrzeć zawartość pod kątem sekretów.
5. SUPABASE_URL musi wskazywać wyłącznie świadomie wybrane środowisko staging podczas testów. Sam jawny adres nie potwierdza uprawnień i izolacji danych.
6. Zielone testy CI nie dowodzą działania autonomicznych agentów 24/7 ani pełnej zgodności Worker/Node.

## Przyszła procedura (bez wykonania)
1. Zapewnić osobny host Linux, Node 22+, Caddy i izolowaną bazę staging.
2. Uruchomić deploy/rxcloud-preflight.sh --check, następnie deploy/rxcloud-install.sh --dry-run.
3. Przejrzeć pakiet plików, ustawić sekrety tylko na hoście, uruchomić testy funkcjonalne i bezpieczeństwa.
4. Dopiero za zgodą właściciela zainstalować i uruchomić usługę na domenie testowej.
5. Po testach mobilnych, HTTPS, backupu i rollback uzgodnić ewentualną publikację.

**Nie wykonywać migracji produkcji, zmian DNS ani automatycznego startu usługi na podstawie samego zielonego CI.**
