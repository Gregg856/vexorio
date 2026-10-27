# RX PR #36 — plan rozdzielenia zmian (2026-10-27)

Stan: plan do przeglądu, bez merge/deploy i bez zmiany reguł bezpieczeństwa.

- PR #36: `rx/ant-builder-1-3-prototype` → `rx/ant-builder-1-2-draft`.
- Szybkie kontrole RX ANT BUILDER i RX PATCH DRAFTER: zielone na `f83141a0`.
- Strażak: krok `Verify pull request change boundaries` odrzuca zmiany poza swoim allowlist.
- W PR są dwa pliki interfejsu Guard: `guard-lab.html`, `guard-rx-live-command-center.js`; reszta to kod RX, testy, workflow i dokumentacja.
- Nie poszerzać allowlist Strażaka, nie wyłączać jego testu i nie robić automatycznego merge.
- Zanim rozdzielimy zmiany, sprawdzić czy kontrola Strażaka ma być wymagana dla każdego PR, czy wyłącznie dla PR Strażaka; decyzja musi zachować niezależny audyt bezpieczeństwa RX.
- Jeśli osobny PR Guard jest wymagany: utworzyć od bazy gałąź tylko dla plików Guard, przetestować ją, a dopiero po zatwierdzeniu przenieść zależności panelu; nie usuwać tych plików z RX PR bez zapewnienia działającego panelu.
- Jeśli kontrola jest błędnie przypięta do wszystkich PR: naprawić konfigurację wyzwalania w osobnym, recenzowanym PR, zachowując pełną kontrolę granic dla zmian Strażaka.
- BIBI: ostatni pełny przebieg niepotwierdzony, nie traktować pending/cancelled jako sukcesu.

Kryteria zamknięcia: brak regresji w panelu; szybkie testy RX zielone; właściwy audyt Strażaka zielony; pełny BIBI potwierdzony; brak zmian produkcyjnych bez osobnej zgody.

## Potwierdzona diagnoza workflow

- Workflow: `.github/workflows/guard-worker.yml` (`Strazak GitHub Worker — safe audit`).
- Trigger `pull_request.paths` obejmuje `guard-*.js`. W PR #36 zmieniony jest `guard-rx-live-command-center.js`, dlatego uruchomienie jest oczekiwane.
- Krok `Verify pull request change boundaries` stosuje `github.rest.pulls.listFiles` do **całego PR**, nie tylko do plików Guard.
- Allowlist obejmuje `guard-*.js`, `guard/**/*.js|cjs` oraz `tests/guard-*.test.js|cjs`. Pliki RX i `guard-lab.html` nie są dopuszczone.
- Potwierdzenie: run `40491653385`, krok 3 zakończony błędem; dalsze kroki testowe pominięte. Nie jest to dowód awarii kodu RX.
- Docelowy rozdział: osobny Guard-only PR z wyłącznie dopuszczonymi plikami; osobny RX PR bez plików wyzwalających Guard. Dla `guard-lab.html` należy jawnie ustalić osobny UI/integration PR i jego testy, bo nie jest na liście Guard.
- Przenoszenie zmian wymaga zachowania zależności między HTML a JS. Najpierw przygotować niezależne commity/gałęzie i testy; dopiero później aktualizować PR #36. Nie usuwać plików z istniejącego PR bez sprawdzenia integracji.
- Nie obchodzić walidacji przez zmianę nazw plików, ukrywanie zmian lub wyłączanie wymaganego checka.
