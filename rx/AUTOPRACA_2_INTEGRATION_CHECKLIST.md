# RX AUTOPRACA 2.0 — etap integracji z RX Coordinator

## Zweryfikowane
- PR #281: GitHub Actions `VEXORIO checks` i `RX AUTOPRACA 2.0 validation` zakończone sukcesem na commit `f9d3755f4d329bc8159375865302a39b47479bdd`.
- Panel `rx-admin-prototype.html` już używa `POST /api/rx/coordinator/run` po pobraniu tokenu sesji administratora.
- Schemat `rx_private` istnieje na staging. Migracja `001_ant_task_queue.sql` nie została jeszcze wdrożona.

## Kolejność bezpiecznej integracji
1. Odszukać implementację istniejącego endpointu RX Coordinator i jej autoryzację, nie tworzyć konkurencyjnego wykonawcy.
2. Zweryfikować migrację w staging i uprawnienia RLS. Nie wdrażać jej w produkcji.
3. Dodać serwerowy adapter kolejki: create, list, approve, cancel. Autoryzacja na każdym endpointcie, transakcyjne przejścia stanów.
4. Powiązać `safe_test` wyłącznie z istniejącym dozwolonym workflow `rx-coordinator-cloud.yml`, zachować jego ręczne ograniczenia.
5. Dodać raportowanie do czatu Królowej; brak automatycznego zatwierdzania zadań.
6. Testy integracyjne staging: administrator / nie-administrator, wyścig, timeout, ponowne wywołanie, audyt.
