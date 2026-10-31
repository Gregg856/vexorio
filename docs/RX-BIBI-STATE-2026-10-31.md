# RX BIBI / VEXORIO — stan prac i przekazanie (2026-10-31)

## Zasady użytkownika
- Kontynuować **istniejący** projekt, nie tworzyć drugiego serwera, chmury ani trzeciego czatu.
- Królowa działa testowo; **nie uruchamiać oficjalnej produkcji bez zgody**.
- Duże, spójne pakiety poprawek; najpierw audyt, potem test, zapis i raport. Nie powtarzać już wykonanej pracy.
- Własny serwer RX CLOUD i własna chmura; GitHub jako repozytorium i zapas historii. Nie zakładać, że Cloudflare Worker jest własnym serwerem RX CLOUD.
- Użytkownik pracuje na telefonie: minimalizować ręczne czynności i nigdy nie prosić o wklejanie sekretów na czacie.

## Zweryfikowane w GitHub
- Repo: `Gregg856/vexorio`, gałąź `main`.
- `rx-cloud-server.cjs`: istniejący self-hosted Node.js; domyślnie `HOST=127.0.0.1`, `PORT=8787`; wymaga `SUPABASE_URL`. API: `/__rxcloud/health`, `/__rxcloud/bibi/brain-memory`, `/__rxcloud/bibi/learning-history`, inne prywatne endpointy.
- `rx-brain-store.cjs`: pamięć RX Brain, zapis na dysku.
- `rx-learning-cloud-store.cjs`: ograniczona historia metryk treningowych, zapis na dysku; domyślna ścieżka `rx-cloud-private-inbox/rx-learning-history.json`.
- Domyślna pamięć Brain: `rx-cloud-private-inbox/rx-brain-memory.json` (można zmienić przez `RX_BRAIN_MEMORY_FILE`).
- `tests/rx-learning-cloud-sync.cjs`: uwierzytelniony GET/PUT historii, zdalnie wymaga HTTPS; używa `RX_LEARNING_CLOUD_URL` i `RX_QUEEN_LOCAL_TOKEN`.
- `.github/workflows/rx-bibi-learning.yml`: workflow_dispatch + codzienny harmonogram; testy, odczyt chmury, fallback GitHub Issues, jeden cykl nauki, zapis GitHub i warunkowo do chmury, artefakty.
- `.github/workflows/deploy.yml`: produkcyjne wdrożenie VEXORIO uruchamiane **ręcznie**, nie przy każdym push.
- PR #509, #510, #511 zostały scalone z `main`; CI PR #511 `VEXORIO checks` zielone (testuje smoke UI, nie dowodzi działającego połączenia z chmurą).

## Czego NIE potwierdzono
- Nie zweryfikowano adresu IP/domeny własnego serwera, jego panelu administracyjnego ani aktualnej maszyny hostingowej.
- Nie zweryfikowano, że najnowszy `main` jest wdrożony na działającym serwerze, ani że serwer ma trwały wolumen danych.
- Nie zweryfikowano obecności odpowiednich sekretów GitHub Actions, ani rzeczywistego odczytu/zapisu historii na własnej chmurze.
- Nie potwierdzono autentycznego testu zalogowanego czatu BIBI z produkcyjnym silnikiem AI. Zielony CI to nie to samo.
- Użytkownik stwierdził, że system **działa, ale nie jest jeszcze oficjalny**; traktować jako jego relację, nie niezależny pomiar.

## Następne kroki — bez przebudowy
1. Ustalić istniejącą ścieżkę wdrożenia self-hosted RX CLOUD z plików repo, historycznych konfiguracji i paneli; nie zgadywać domeny.
2. Sprawdzić konfigurację secrets `RX_LEARNING_CLOUD_URL`, `RX_QUEEN_LOCAL_TOKEN` bez ujawniania ich wartości.
3. Przeprowadzić test `/__rxcloud/health` oraz prywatnego GET/PUT metryk na **właściwym** serwerze (z autoryzacją) i odczyt po restarcie.
4. Uruchomić rzeczywisty workflow RX BIBI learning; sprawdzić logi kroku cloud pull/push, nie tylko smoke PR.
5. Dopiero po dowodach zapisać w raporcie `LIVE PASS`; do tego czasu status `UNVERIFIED`.
6. Nie uruchamiać oficjalnego deploymentu bez zgody użytkownika.

## Uwaga
Ten plik jest dokumentacją stanu i planem w GitHub. **Sam zapis tego pliku NIE jest wdrożeniem na serwer ani dowodem zapisania danych w chmurze.**
