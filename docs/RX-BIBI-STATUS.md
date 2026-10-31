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

## RX Queen — jakość generowania, 2026-10-30
- PR #318 scalony: `8abdc655`, smoke SUCCESS. Nie budować drugiego generatora.
- Bieżąca zmiana: pomiar kopiowania zdań treningowych, interpunkcji i różnorodności wyników w `rx-text-learner.cjs`; to NIE jest miara płynności ani generalizacji do nowych tematów.
- Kolejny warunek przed podłączeniem do czatu: oddzielny zbiór niewidzianych tematów i ludzka ocena sensowności; bez produkcji.

## RX IMPULS — 2026-10-30
- Sprawdzono istniejące `rx-million-hearts.js`, `rx-ant-hibernation.cjs`, `rx-dna-core.js` i generator `rx-text-learner.cjs`; PR #320 zamknięty bez merge po wykryciu duplikacji DNA.
- Dodano `pulse()` jako jawny impuls do istniejącej ograniczonej kolejki. 1 impuls uruchamia 1 handler; bez pollingu, bez miliona procesów, bez produkcji. Test obejmuje bezczynność przed/po sygnale i 1 mln wirtualnych ID, NIE 1 mln operacji/minutę.
- Pisanie na poziomie ChatGPT NIE jest osiągnięte; dotychczasowy eksperyment tekstowy ma tylko 8 zdań i niską różnorodność. Potrzebny osobny etap realnego treningu i oceny na niewidzianych tekstach.


## PRIORYTET I PUNKT KONTYNUACJI — 2026-10-30 (NIE POWTARZAĆ)
- Właściciel potwierdza: Królowa RX i BIBI są JUŻ połączone; istnieją Tester RX BIBI LIVE/Browser, Manager, moduły CLOUD, NEURON i Developer. Nie projektować ich ponownie na podstawie braku informacji w pojedynczym pliku.
- GŁÓWNY CZAT KLIENTA: `rx-client.html` -> `POST /api/rx/client/chat` w `worker.js`; istnieją `tests/rx-client-chat.cjs` i `tests/rx-chat-worker-e2e.cjs`. `rx-bibi-manager.html` to osobny panel administracyjny, NIE zamiennik czatu klienta.
- PR #336 (82 przykłady) ZAMKNIĘTY BEZ MERGE: testy CI zielone, ale skuteczność spadła z 34/56 do 30/56. Zachować wariant 64 przykładów; nie dodawać kolejnych fal danych bez planu pomiaru.
- CEL UŻYTKOWNIKA: już teraz pisać swobodnie z Królową, mieć pamięć i ciągłość rozmowy. Najpierw sprawdzić rzeczywiste odpowiedzi i trasę istniejącego `rx-client.html` / Worker oraz istniejące narzędzia testujące, następnie naprawić konkretną lukę. Nie budować nowego czatu, panelu, adaptera, testera, kont ani stron.
- Nie mylić zielonych testów statycznych z potwierdzonym testem przeglądarkowym LIVE. Gdy nie ma narzędzia do uruchomienia testu LIVE, jasno powiedzieć i nie udawać wykonania.
- OSZCZĘDZAĆ LIMITY: przed pracą przeczytać ten punkt i istniejący kod; jeden rzeczywisty problem -> jedna poprawka -> test -> wynik. Bez wielokrotnego raportowania i powtarzania gotowych prac. Produkcja VEXORIO bez zmian bez zatwierdzenia.

## RX BIBI — jeden główny panel, punkt kontynuacji 2026-10-31
- Decyzja właściciela: rozwijać WYŁĄCZNIE istniejący główny panel administracyjny `rx-bibi-manager.html`; nie tworzyć nowych managerów, testerów, pamięci ani równoległych czatów. Zachować oddzielny `rx-client.html` dla klientów i jego istniejący endpoint `POST /api/rx/client/chat`.
- Zweryfikowano kod: Manager ma już widoki Strażak, Tester, Diagnostyka, Historia, Developer, ustawienia; skrypt `rx-bibi-tester-status.js` pobiera status testów z GitHub. W katalogu wtyczek Managera `rx-bibi-ai` jest nadal opisany jako `planowany`; NIE oznacza to samo w sobie, że istniejący silnik i klient nie są połączone.
- Wcześniejszy status w tym dokumencie mówi, że RX i BIBI są połączone. Nie zaprzeczać temu na podstawie samej etykiety panelu. Najpierw sprawdzić `worker.js`, trasę klienta, `rx-brain-chat-engine.cjs` oraz testy E2E; dopiero wtedy zdiagnozować realny problem rozmowy.
- PR #438 (7.6) scalony `81f1f434`; #439 (7.7) scalony `52c2df5e`; #440 (7.8) scalony `c03c0b53`. PR #441 (7.9, bramka jakości offline) ma zielone VEXORIO checks, ale pozostał roboczy; NIE scalać automatycznie bez sprawdzenia, czy dubluje istniejące testy.
- Kolejny konkretny krok: użyć istniejących `tests/rx-client-chat.cjs`, `tests/rx-client-auth-e2e.cjs`, `tests/rx-bibi-browser.cjs` i istniejącego workflow browser do sprawdzenia autoryzowanego czatu LIVE. Rozróżniać testy CI, testy z mockiem i realny czat z zalogowaną sesją.
- Nie zmieniać produkcji bez zgody. Nie ogłaszać realnego czatu sprawdzonym bez wyniku. Oszczędzać testy i limity.
