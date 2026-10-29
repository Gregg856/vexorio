# RX — STAŁE PRZEKAZANIE: JAKICH WŁASNYCH PROGRAMÓW UŻYWAĆ
Aktualizacja: 2026-10-29. Repo: Gregg856/vexorio, main.

## Najważniejsza zasada
ZANIM zbudujesz cokolwiek nowego: sprawdź istniejący kod, panele, workflow i ostatnie commity. Używaj własnych RX; nie twórz duplikatów, kont ani paneli. Po zmianie sprawdź CI. Nie twierdź, że test wykonano, jeżeli nie ma wyniku.

## Kto wykonuje pracę
- **👑 Królowa RX**: nadzór, kolejka zadań, rozmowa, planowanie i decyzje; `guard-rx-queen-panel.js`, `rx-chat-planner.mjs`, `rx-queen-bibi-triage.cjs`. Zatwierdzenie planu w panelu NIE oznacza automatycznego wykonania.
- **🐜 RX BIBI Tester / Browser Agent**: `tests/rx-live-panel.cjs`, `tests/rx-bibi-browser-agent.cjs`, `tests/rx-visual-audit.cjs`, `tests/rx-queen-dialogue-watch.cjs`. Playwright testuje publiczne panele na Androidzie i desktopie, nagrywa wideo i raportuje. Aktualne publiczne testy NIE logują się na prywatne konto, NIE wysyłają wiadomości na czacie i NIE zapisują zmian produkcyjnych. Pełna obsługa zalogowanego panelu wymaga osobnej bezpiecznej integracji i testu end-to-end.
- **🔧 RX Developer**: `guard/rx-developer-core.cjs`, `rx-patch-drafter.cjs`, `rx-developer-patch-bridge.cjs`, `rx-developer-review-runner.cjs`. Analiza kodu i dwie deterministyczne reguły propozycji poprawek; nie uniwersalny programista.
- **🧪 RX Sandbox**: część `rx-developer-review-runner.cjs`; test składni proponowanej poprawki w tymczasowym katalogu przez `node --check`. Jeszcze nie pełne testy funkcjonalne konkretnej zmiany.
- **📊 RX BIBI Manager**: `rx-bibi-manager.html`, `guard/rx-bibi-manager.cjs`, raporty `rx-bibi-reports/`.
- **🛡️ RX Strażak**: `guard-lab.html`, `guard-lab.js`, `guard-rx-orchestrator.js`, `guard-rx-programs.js`; istniejący panel i lista własnych programów.
- **🐜 RX Mrówki**: `rx-ant-task-board.cjs`, `rx-ant-builder.cjs`, `rx-ant-academy.cjs`, `rx-ant-ai-trainer.cjs`; kolejki i eksperymenty CI, nie dowód autonomicznej pracy 24/7.
- **🧠 RX NEURON / DNA / pamięć**: `rx-neuron-v2.js`, `rx-neuron-v21.js`, `rx-dna-memory.cjs`, `rx-brain-memory.cjs`. Sprawdź interfejs i testy przed wykorzystaniem.
- **☁️ RX Cloud / Computer**: `rx-cloud-computer.cjs`, `rx-mega-cloud-computer.cjs`, `rx-cloud-server.cjs`; obecność kodu nie potwierdza aktywnej samodzielnej maszyny w chmurze.
- **🎥 RX Screen Recorder / Studio**: `rx-bibi-studio.html`, `tests/rx-screen-recorder.cjs`. Nagrywanie tylko w dozwolonym zakresie.
- **🚨 RX ALARM**: `.github/workflows/rx-alarm.yml` i testy alarmu.
- **📬 RX Skrzynka**: wpis w `guard-rx-programs.js` oznaczony jako integracja oczekująca na potwierdzenie; nie zakładać, że działa.

## Istniejące panele
`guard-lab.html` (Strażak / czat / Developer / Królowa), `rx-bibi-manager.html` (Manager), `rx-admin-prototype.html` (bramka dostępu), `rx-bibi-studio.html`. Zanim powiesz „BIBI może zrobić wszystko na panelu”, rozróżnij funkcję dostępną użytkownikowi od potwierdzonej automatyzacji BIBI.

## Aktualny punkt prac
Ostatni potwierdzony commit: `0ea504c104c9ae18244a35e8b4ae9bc45176c84d`. Testy RX Developer, RX BIBI, VEXORIO i Deploy Cloudflare były zielone. W następnym kroku zbudować funkcjonalny test zmodyfikowanego modułu na izolowanej kopii, skojarzyć z konkretnym incydentem i zapisać wynik dla Królowej. Nie powtarzać sprawdzania składni, które już jest.

## Standard polecenia „Dalej” / „Gotowe” / „Błąd”
- Dalej: przeczytaj ten plik i stan repo, wykonaj następną rzeczywistą zmianę, commit, test.
- Gotowe: sprawdź status GitHub Actions dla ostatniego commita; podaj sukces, błąd lub w toku.
- Błąd: sprawdź logi konkretnego workflow, napraw przyczynę, nie maskuj problemu.
- Wszystkie działania w produkcji i na kontach wymagają właściwej autoryzacji; nie twórz kont ani nie obchodź logowania.

## Ograniczenia uczciwości
Zielone CI ≠ BIBI zalogował się i pisał na czacie. Panel z przyciskiem ≠ autonomiczne wykonanie zadania. Raport z propozycją ≠ naprawiony błąd. Własne narzędzia są priorytetem, ale trzeba weryfikować ich realne możliwości.
