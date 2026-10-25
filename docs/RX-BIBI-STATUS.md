# RX BIBI — status i zamknięte etapy

Aktualizacja: 2026-10-25. Repozytorium: Gregg856/vexorio, gałąź main.

## Zamknięte
- Diagnostyka workflow, priorytety alarmów i historia wyników.
- Kopiowanie raportu diagnozy i lokalna historia do 10 wpisów.
- Lista zapisanych diagnoz, czyszczenie z dwustopniowym potwierdzeniem.
- Eksport lokalnej historii JSON (format rx-bibi-diagnoses, wersja 1).
- Import JSON z walidacją, scalaniem i usuwaniem duplikatów; limit 10 wpisów.
- Testy mobilne eksportu i importu, w tym odtwarzanie, duplikaty, błędny plik.

## Potwierdzenia
- Import: commit 79ffa44b, deploy i VEXORIO checks SUCCESS.
- Testy importu: commit 3ecbc493, RX BIBI mobile browser run 40226535936 SUCCESS.
- Link testu: https://github.com/Gregg856/vexorio/actions/runs/40226535936
- Manager: https://vexorio.grzegorzbub1985.workers.dev/rx-bibi-manager.html

## Zasady dalszych prac
- Nie powtarzać zamkniętych funkcji bez nowej regresji.
- Nie modyfikować index.html bez wyraźnej zgody właściciela.
- Nie zakładać nowych kont.
- Po zmianach sprawdzać Deploy VEXORIO, VEXORIO checks oraz uruchamiany osobno RX BIBI Tester.
- Nie ogłaszać nowych testów jako zielonych bez potwierdzenia runu na właściwym commicie.
- Priorytet kolejnych prac: realne błędy, regresje i domykanie otwartych zadań.

## Audyt logów testera — 2026-10-25
- Run 40226535936: job mobile SUCCESS, artefakt rx-bibi-mobile-report.zip zapisany.
- Ostrzeżenie: Node.js [DEP0040] punycode (zależność narzędziowa; brak dowodu błędu aplikacji).
- Ostrzeżenie: actions/checkout@v4, setup-node@v4 i upload-artifact@v4 używają Node 20, runner wymusza Node 24. Wymaga zaplanowanej aktualizacji akcji i ponownych testów.
- Nie wprowadzono zmian do aplikacji z powodu tych ostrzeżeń.
- Następna kontrola: zweryfikować zgodność aktualnych wersji GitHub Actions, a dopiero potem aktualizować workflow osobnym commitem.
