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
