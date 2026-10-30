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

## Dziennik ciągłości — 2026-10-29 (zweryfikowane w GitHub Actions)
- VEXORIO: repo Gregg856/vexorio, main; produkcja Cloudflare `https://vexorio.grzegorzbub1985.workers.dev`.
- RX BIBI Tester: istniejący workflow `.github/workflows/rx-bibi-browser.yml`; nie tworzyć drugiego testera ani płatnego zamiennika.
- Test języków: `tests/rx-live-languages.cjs` dodany commitem `9181351e`, podłączony do istniejącego RX BIBI commitem `7ecb07fc`. Sprawdza PL/DE/EN/UK, zmianę nagłówka, localStorage i zachowanie języka po przeładowaniu. Raport: `rx-bibi-reports/rx-live-languages.json` w artefaktach CI.
- GitHub Actions na commicie `7ecb07fc`: RX BIBI Tester SUCCESS (run 40860299669); VEXORIO checks SUCCESS (40860299655); Deploy VEXORIO SUCCESS (40860299687).
- Wynik SUCCESS workflow nie dowodzi samodzielnie, że każdy krok zakończył się sukcesem (część kroków ma `if: always()`); w razie regresji sprawdzić log kroku językowego i artefakt raportu.
- TinyFish: odinstalowany z ChatGPT 2026-10-29; nie uruchamiać i nie instalować ponownie bez wyraźnej prośby właściciela. Nie mylić odłączenia wtyczki z anulowaniem subskrypcji u dostawcy.
- Istniejąca pamięć: `rx-persistent-memory.mjs` (jawne polecenia i Supabase RLS), `guard/confirmed-fix-memory.cjs` i `docs/rx-confirmed-fixes.md` (potwierdzone naprawy), `rx-ant-task-board.cjs` (deduplikacja propozycji). Nie budować ich od nowa.
- RX CLOUD 6.0: kod/testy self-host, nie oznaczać jako wdrożone na własnym fizycznym serwerze bez osobnego potwierdzenia.
- Zasada: przed zmianą czytać ten dziennik i istniejące moduły; nie powtarzać zamkniętych prac. Nie zmieniać wyglądu `index.html` bez zgody; bez nowych kont i bez płatnych usług.

## RX Królowa — checkpoint nauki 2026-10-30 (nie powtarzać)
- Przed zmianami zawsze sprawdzić ten plik, `PROJECT_STATUS.md`, drzewo repozytorium, testy i istniejące implementacje. Nie deklarować zakończenia bez wyników CI.
- Istniejący mechanizm nauki języka: `rx-text-learner.cjs` + `rx-neural-core.cjs` + `rx-language-tokenizer.cjs`. `rx-ant-ai-trainer.cjs` trenuje odrębny syntetyczny model i obsługuje checkpoint. `rx-queen-ai-bridge.cjs` tylko planuje, nie wykonuje.
- PR #313 (commit `5fa1648f`) wprowadził podobny klasyfikator `rx-fast-learn.cjs`; NIE tworzyć kolejnych klasyfikatorów i nie przedstawiać ich jako samodzielnie piszącego AI.
- PR #314 zamknięty bez merge po wykryciu dublowania; prosty generator następnego bajtu nie dawał wiarygodnej rozmowy.
- PR #315: do istniejącego `rx-text-learner.cjs` dodano pomiar na ośmiu odłożonych, niewidzianych w treningu przykładach; nie oznaczać jako zatwierdzony przed zielonym CI.
- Otwarte zadanie: wybrać JEDEN istniejący moduł do przyszłego treningu generowania tekstu, określić legalny zbiór danych i niezależny benchmark sensowności zdań. Sam spadek straty treningowej nie oznacza umiejętności rozmowy.
- Bez automatycznego wdrożenia, zmian produkcyjnych, nowej aplikacji, kont i płatnych API.

## RX Królowa — kontynuacja po PR #315 (2026-10-30)
- PR #315 scalony do main: `ddbe8285`, smoke SUCCESS. Nie powtarzać tego testu.
- Następna zmiana (PR #316) rozszerza ten sam test o dokładność na każdej kategorii; nie tworzy nowego modelu.
- Kryterium dla przyszłego generatora: oddzielne przykłady treningowe i niewidziane pytania, ocena czytelności i sensu, nie tylko spadek błędu; dopiero po pozytywnym wyniku rozważyć podłączenie do prywatnego czatu.

## RX Queen — rozmowa, 2026-10-30
- PR #316 scalony, commit `e318b2a5`, smoke SUCCESS. Nie tworzyć ponownie benchmarków; istnieją `rx-text-evaluation.cjs` i `rx-text-learner.cjs`.
- Zidentyfikowano istniejący `rx-brain-chat-engine.cjs` jako właściwy silnik odpowiedzi. Nowy PR #317 poprawia tylko obsługę prostych wypowiedzi rozmownych i celów użytkownika w tym samym silniku; testuje zachowanie matematyki i kontekstu.
- WAŻNE: odpowiedzi w #317 są deterministyczne, NIE pochodzą z treningu modelu generatywnego. Dalszy cel to sensowne generowanie tekstu z niezależną oceną jakości; nie deklarować gotowego LLM.

## RX Queen — eksperyment generowania tekstu, 2026-10-30
- PR #317 scalony do main: `9e7fdc5c`, oba smoke SUCCESS; nie powtarzać naprawy czatu.
- Sprawdzono `rx-text-evaluation.cjs`, `rx-text-learner.cjs`, `rx-brain-chat-engine.cjs`, `rx-language-tokenizer.cjs`, `rx-neural-core.cjs`, `guard/local-model.cjs` przed zmianą.
- Bieżący PR: dodaje do ISTNIEJĄCEGO `rx-text-learner.cjs` odizolowany eksperyment uczenia przejść między słowami na 8 jawnych, sztucznych zdaniach. Generuje krótkie sekwencje słów bez gotowych odpowiedzi czatu; nie używa danych użytkowników. To nie jest LLM, nie daje jeszcze płynnej, niezależnej rozmowy.
- Nie łączyć z produkcyjnym czatem i nie wdrażać; najpierw testy i uczciwa ocena jakości nowych, niewidzianych zdań. Nie tworzyć kolejnego pliku modelu.
