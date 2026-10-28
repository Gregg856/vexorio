# RX — mapa architektury i zasady zmian (28.10.2026)

Ten dokument jest uzgodnioną zasadą pracy. Nie jest techniczną blokadą GitHub.

## Wykorzystujemy istniejące moduły, nie tworzymy kopii
- Królowa RX: rx-admin-prototype.html — jeden czat właściciela.
- Mózg/plan: rx-command-bridge.cjs, rx-ai-router.cjs, rx-queen-ai-bridge.cjs.
- MEDUZA: rx-medusa-engine.cjs — kierowanie sygnałów.
- Mrówki: rx-ant-task-board.cjs — triage i kolejka.
- BIBI: istniejące testy panelu i raporty.
- Komputer: rx-cloud-computer.cjs i rx-mega-cloud-computer.cjs — dozwolone testy.
- Wykonawca zatwierdzonych testów: .github/workflows/rx-coordinator-cloud.yml oraz /api/rx/coordinator/run.

## Reguły obowiązujące przy kolejnych zmianach
1. Przed kodowaniem sprawdzić istniejący moduł, jego funkcje, testy i ostatnie commity.
2. Nie tworzyć nowego mózgu, routera, adaptera, panelu, strony lub konta bez audytu i osobnej zgody właściciela.
3. Nie zmieniać strony głównej VEXORIO bez zgody. Nie wdrażać ryzykownych zmian produkcyjnych automatycznie.
4. Rozróżniać: zaplanowane, w kolejce, zatwierdzone, wykonane, przetestowane i wdrożone.
5. Zatwierdzenie wymagane dla uruchamiania kodu, zmian repozytorium, wdrożeń, wydatków i operacji destrukcyjnych.
6. Nie przekazywać sekretów do czatu ani kolejki.
7. Do testów używać istniejących RX BIBI i GitHub Actions; nie wymagać zdjęć ani nowych kont.
8. Po zmianie podać SHA, link do testu i rzeczywisty status. Nie powtarzać zamkniętych prac bez regresji.
9. Kolejka rx-queen-work-queue-v1 jest lokalna w przeglądarce, nie serwerowa.
10. Dowolne polecenie może być sklasyfikowane, ale nie każde jest wykonywalne. Nie udawać samodzielnej pracy.

## Zweryfikowane
- RX Coordinator workflow_dispatch #40750801581: success, RX Mega Cloud Computer 9 passed / 0 failed.
- rx-command-bridge.cjs: planCommand — planuje, nie wykonuje.
- rx-queen-ai-bridge.cjs: planuje, nie wykonuje.
- rx-ai-router.cjs: rejestr możliwości, nie wykonawca.
- rx-medusa-engine.cjs: routing sygnałów, nie wykonawca.
- rx-ant-task-board.cjs: kolejka i priorytety, nie wykonawca.
- Samodzielne naprawy kodu z dowolnego polecenia Królowej: NIE WDROŻONE.

## Jeden następny krok
Podłączyć istniejący Command Bridge do kontrolowanego wykonawcy zatwierdzonych działań z trwałym stanem i raportem. Najpierw test staging, potem decyzja właściciela. Bez kolejnego routera.


## Decyzja końcowa: benchmarki, Mrówki i odpowiedzi Królowej (28.10.2026)

- Zachować istniejące RX Benchmark 1.0–5.0 oraz RX Performance Benchmark; nie tworzyć wersji 6.0 ani duplikatów.
- Mrówki i RX Developer przygotowują propozycje oraz wykonują wyłącznie jawnie zatwierdzone, dozwolone zadania. Benchmarki porównują wynik z punktem odniesienia; pogorszenie nie jest awansem.
- RX Ant AI Trainer/Evaluator uczy mały klasyfikator na danych syntetycznych, a nie model językowy. Checkpoint i raport wzrostu muszą wskazywać rzeczywisty zakres pomiaru.
- Jedyny interfejs użytkownika pozostaje w rx-admin-prototype.html. Istniejący czat wywołuje /api/rx/chat z autoryzacją; odpowiedzi pochodzą z dostępnego silnika serwerowego. Nie przedstawiać tego jako ogólnej inteligencji lub pełnej autonomii.
- Priorytet po zamknięciu prac benchmarkowych: Królowa ma odpowiadać tekstowo na zwykłe pytania, przekazywać zadania do istniejących modułów i jasno oznaczać propozycje versus wykonanie. Utrzymywać pamięć zatwierdzonych rezultatów. Nie zakładać, że dowolne polecenia już są wykonywane.
- Bez nowych paneli, kont, równoległych mózgów, automatycznych wdrożeń produkcyjnych, płatności i niekontrolowanego uruchamiania kodu.
- Prace benchmarkowe uznajemy za zamknięte na poziomie planu integracji; realizację i sprawdzenie jakości odpowiedzi Królowej należy potwierdzić osobno.

## Zatwierdzone: jeden ośrodek Królowej RX

- Meduza, Mrówki, Developer, Neuron, Chmura, Coordinator, BIBI i benchmarki pozostają częścią RX.
- Każdy moduł ma przekazywać do Królowej raport ze źródłem, statusem i wynikiem. Królowa korzysta z potwierdzonych informacji, nie z samych propozycji.
- Królowa ma prowadzić rozmowę tekstową i przekazywać polecenia do istniejących modułów. Operacje zmieniające kod, produkcję lub dane wymagają zatwierdzenia.
- Nie dodajemy nowych paneli ani kopii mózgu. Benchmarki oceniają postęp, ale nie zastępują uczenia modelu.
- To wymagania architektury; pełnego działania integracji nie potwierdzono jeszcze testem na żywo.

## Decyzja właściciela: własny model RX od podstaw

- Docelowy model językowy Królowej ma być rozwijany jako własny model RX, a nie jako przemianowany model Meta/Llama lub API zewnętrznego dostawcy.
- Istniejący rx-ant-ai-trainer.cjs to własna regresja logistyczna na 12 przykładach syntetycznych (2 cechy); nie jest modelem językowym. Nie nazywać jego postępu rozwojem rozmowy Królowej.
- Najpierw zdefiniować mały, mierzalny eksperyment językowy: tokenizator, zbiór danych z prawami do użycia, bazowy model, trening, niezależna walidacja, checkpoint i porównanie z bazą. Nie udawać jakości LLM.
- Wykorzystać istniejące RX Mrówki, BIBI, Neuron i raporty zamiast duplikowania paneli. Nie zastępować aktualnego czatu niedziałającym eksperymentem.
- Zewnętrzne modele, jeżeli są skonfigurowane, nie stanowią własnego modelu RX. Przejście na własny model dopiero po sprawdzeniu jego jakości, wydajności i bezpieczeństwa.
- Bez nowych płatnych usług, automatycznych wydatków i ryzykownych wdrożeń bez osobnego zatwierdzenia.


## Stała mapa własnych programów i testów — 28.10.2026

Właściciel wielokrotnie potwierdził: **najpierw nasze narzędzia RX, bez płatnego TinyFish i bez ponownego pytania o listę programów**. Przed proponowaniem zewnętrznej przeglądarki sprawdzić istniejące repozytorium, workflow i dostępne uprawnienia.

| Własny program | Istniejący plik / punkt wejścia | Rzeczywisty zakres |
| --- | --- | --- |
| RX BIBI Tester / Chromium Playwright | `.github/workflows/rx-bibi-browser.yml`, `tests/rx-bibi-browser.cjs`, `tests/rx-queen-panel-browser.cjs` | Automatyczne testy przeglądarkowe i DOM w GitHub Actions |
| RX FAST | `rx-fast-test-engine.cjs`, job `fast` w `rx-bibi-browser.yml` | Szybkie testy i składnia |
| RX Cloud Computer | `rx-cloud-computer.cjs` | Planowanie dozwolonych zadań, nie pełna zdalna maszyna |
| RX Mega Cloud Computer | `rx-mega-cloud-computer.cjs` | Kontrolowany moduł komputera i testy |
| Królowa RX | `rx-admin-prototype.html`, `worker.js` /api/rx/chat | Istniejący czat i odpowiedzi serwera, wymaga autoryzacji |
| RX Meduza | `rx-medusa-engine.cjs`, `.github/workflows/rx-medusa-ant.yml` | Analiza i kierowanie sygnałów |
| RX Mrówki | `rx-ant-task-board.cjs`, `rx-queen-ant-supervisor.cjs` | Kolejka propozycji, bez samodzielnych napraw |
| RX ALARM | `.github/workflows/rx-alarm.yml`, `tests/rx-alarm-simulation.cjs` | Alarmy CI i testy symulacyjne |
| RX Developer | `guard/rx-developer-core-browser.js` | Kontrola kodu i diagnostyka |
| RX BIBI Manager | `rx-bibi-manager.html` | Istniejący panel RX |

**Ostatnie potwierdzenie:** RX BIBI Tester workflow #40775809962, VEXORIO checks #40775809965 i Deploy #40775809995 — sukces dla `dd42e264`. Zapisany raport `rx-bibi-reports/rx-ant-ci-triage.json` zawiera 0 propozycji, `sourceAvailable: true`, `executed: 0`.

**Ważne ograniczenie:** zielony test izolowanego Chromium nie potwierdza zalogowanej sesji ani rzeczywistej odpowiedzi czatu Królowej na `Diagnostyka Mrówek`. Ten scenariusz należy dopisać do **istniejącego** RX BIBI Tester z odpowiednim, bezpiecznym środowiskiem testowym, bez obchodzenia autoryzacji. Nie twierdzić, że test live przeszedł, zanim istnieją dowody.

**Koszty:** TinyFish miał brak środków; właściciel odmówił doładowania. Nie uruchamiać płatnych narzędzi ani nie proponować zakupów bez nowej wyraźnej prośby. Najpierw używać istniejącego RX i GitHub Actions.

**Zasada kontynuacji:** przy każdym nowym czacie najpierw przeczytać ten dokument i aktualne workflow; nie budować kopii, nie powtarzać zamkniętych prac, nie prosić użytkownika ponownie o tę samą listę narzędzi.
