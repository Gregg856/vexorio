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

## Kierunek RX BIBI AI — zatwierdzony 2026-10-25
- RX BIBI AI to odrębny produkt od portalu VEXORIO; integracje dopiero gdy potrzebne.
- Priorytet 1: RX BIBI Studio do pionowych filmów 9:16, animowanie zdjęć, montaż, napisy, muzyka, stabilny eksport.
- Priorytet 2: prawdziwe generowanie obrazów i filmów za pomocą modeli generatywnych i kontrolowanego budżetu GPU.
- Priorytet 3: RX Brain (asystent, pamięć projektu, ewaluacja, stopniowe dostrajanie), RX Strażak (kontrola i bezpieczeństwo), RX BIBI Manager (zadania i wdrożenia).
- Priorytet 4: produkt użytkowy, konta, kolejka generowania i ewentualna monetyzacja po stabilizacji.
- Nie przedstawiać lokalnego PhotoMotion ani klasyfikatora RX AI Core jako pełnego modelu generującego filmy.
- Pracować etapami: implementacja → automatyczny test → zielony wynik → dokumentacja → następna funkcja.

## Zamknięte testy RX Studio — 2026-10-25
- Film 30 sekund: commit f6d1f53d, RX Tester run 40234523411 SUCCESS.
- Napisy osadzone w nagraniu: commit 6a20ee5b, run 40234779413 SUCCESS.
- Pozycje napisów i test nagrania z napisem: commit 1f3fd49a, run 40235263139 SUCCESS; trzy pozycje przetestowane jako wybory interfejsu, nie jako trzy osobne nagrania.
- Muzyka, głośność i film z audio: commit 38c28cc2, run 40235743740 SUCCESS.
- Następne zadanie: usprawnić montaż i zweryfikować odtwarzanie muzyki na docelowych przeglądarkach mobilnych.
