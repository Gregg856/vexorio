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


## AKTUALIZACJA — punkt kontrolny po PR #530 (2026-10-31)

### Obowiązkowy protokół kontynuacji (STOP DUPLIKATOM)
1. Przed proponowaniem zmian przeczytaj **ten plik**, historię ostatnich PR i sprawdź istniejące pliki. Nie polegaj wyłącznie na pamięci czatu.
2. Ustal konkretny brak w działaniu istniejącego kodu. Nie dodawaj nowego testera, serwera, panelu, czatu, pamięci ani modułu, jeżeli istniejący może wykonać zadanie.
3. Wprowadzaj spójne pakiety, testuj, sprawdzaj CI, scalaj po sukcesie. Po każdym pakiecie aktualizuj ten punkt kontrolny i zapisuj dowód (PR/commit, status).
4. Rozróżniaj: kod zapisany, testy CI zielone, wdrożone na serwerze, zweryfikowane na żywo. **Żadne z nich nie wynika automatycznie z poprzedniego.**
5. Nie publikuj wersji oficjalnej bez osobnej zgody. Nie proś o powtórne wpisywanie sekretów.

### Potwierdzone zakończone pakiety
- #525: porównywanie odpowiedzi kandydujących — MERGED, deterministyczne offline.
- #526: zatwierdzona pamięć odpowiedzi — MERGED, wymagane jawne zatwierdzenie.
- #527: most pamięci do istniejącego silnika Brain — MERGED, opt-in.
- #528: most pamięci do istniejącego RX CLOUD czatu — MERGED, opt-in.
- #529: wydzielona bramka pamięci z testami odmów i błędów — MERGED, CI zielone.
- #530: skrypt sprawdzania gotowości testowego RX CLOUD — MERGED, VEXORIO checks zielone. Skrypt **nie** dowodzi działającego czatu na żywo.
- Istnieją: testerzy, Nauczyciel, Strażak, Weryfikator, silnik Brain, RX CLOUD, panel BIBI i workflow nauki. **Nie tworzyć duplikatów.**

### Stan na przekazanie
- Repo: Gregg856/vexorio, main. Ostatni potwierdzony merge #530: `475bd77997393965ef7df49bb9334f357b72a818`.
- Wersja **testowa**, bez zgody na oficjalny deployment.
- Niepotwierdzone: rzeczywisty adres maszyny RX CLOUD, uruchomiona konfiguracja pamięci, test zalogowanego czatu i trwałość zapisu po restarcie.
- Domyślny adres `127.0.0.1:8787` jest **lokalny**, nie jest domeną publiczną. Publiczny Worker VEXORIO nie jest dowodem działania self-hosted RX CLOUD.
- Następny rzeczywisty cel: **audyt już istniejącego mechanizmu automatycznej pracy botów i jego połączenia z istniejącym czatem**, z dowodami działania. Nie zaczynać od nowego testera ani kolejnego raportu o samych planach.

### Zasada końca każdej sesji
Dopisz: ostatni scalony PR/SHA, testy, status wdrożenia, następny jeden konkretny krok. W nowym czacie rozpocznij od odczytu tego pliku.


## Aktualizacja końcowa 2026-10-31 — przekazanie do nowego czatu
- Najnowszy zweryfikowany commit main: `22056ee6b3173a2652f54e162148ee55c638e363` (PR #538).
- Scalono po zielonym `VEXORIO checks`: #533 (zadania panelu wywołują bezpieczne odczyty Strażaka/Testera), #534 (istniejący czat managera przekazuje polecenia pisania do uwierzytelnionego `/api/rx/client/chat`), #535 (bramka testów pisania w cyklu nauki), #536 (zatwierdzone ćwiczenia mogą trafić do istniejącej pamięci odpowiedzi), #537 (automatyczne przygotowywanie kandydatów ćwiczeń), #538 (9 zadań, rotacja i wykrywanie powtórek).
- Ważne: #536 nie oznacza automatycznego zatwierdzania. `approveWritingExercise` wymaga `approved:true` i `reviewId`; live gate `rx-queen-live-memory-gate.cjs` jest opt-in. Bezpieczne ćwiczenia offline nie trenują wag modelu LLM.
- `tests/rx-queen-writing-reviewed-batch.cjs`: dziewięć ćwiczeń, 3 na serię; `tests/rx-queen-writing-reviewed-batch.test.cjs` testuje rotację i bezpieczeństwo. Historia `rx-bibi-reports/rx-queen-writing-curriculum-history.json` jest lokalna dla runnera i **nie ma potwierdzonej trwałości pomiędzy uruchomieniami GitHub Actions**. Następny konkretny krok: sprawdzić istniejący mechanizm zapisu/odczytu w workflow i dodać trwałość historii ćwiczeń, bez nowego serwera/panelu.
- Własny RX CLOUD: `rx-cloud-server.cjs` (Node); `rx-mega-cloud-computer.cjs` (wykonawca allowlistowanych skryptów); `rx-bibi-manager.html` (istniejący panel); `worker.js` (API); `rx-brain-chat-engine.cjs`, `rx-queen-approved-memory.cjs`, `rx-queen-live-memory-gate.cjs`, `tests/rx-queen-writing-composer.cjs` (silnik ćwiczeń). Supabase: produkcja `lfytoxcnutduahshbsko`, staging `owkjdlpawczrnwyszduj` — nie zmieniać produkcji bez zgody.
- GitHub Actions `.github/workflows/rx-bibi-learning.yml` ma harmonogram co 6 godzin. Testy CI green nie dowodzą działania self-hosted serwera. Adres/dostawca stale działającego RX CLOUD nie zostały potwierdzone; **nie twierdzić, że serwer 24/7 już działa**. Istniejący adres Worker `https://vexorio.grzegorzbub1985.workers.dev/rx-client` to nie dowód hostingu Node RX CLOUD.
- Użytkownik chce, by boty uczyły Królową faktycznie lepiej pisać i odpowiadać, a nie produkowały kolejne raporty; preferuje duże pakiety, automatyzację, minimalne ręczne czynności na Androidzie, żadnego dublowania modułów. Dalsze kroki: trwała historia, rozszerzenie zatwierdzonych przykładów, wpięcie do istniejącego czatu, weryfikacja efektów; bez obiecywania generatywnego uczenia, gdy go nie ma.
