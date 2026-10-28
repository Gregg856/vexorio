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
