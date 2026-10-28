# RX AUTOPRACA 2.0 — kontrakt bezpiecznego wykonawcy (projekt)

Ten dokument nie uruchamia zadań. Istniejący panel `rx-admin-prototype.html` ma już ścieżkę `/api/rx/coordinator/run` dla ograniczonych testów. Nowa kolejka nie może omijać istniejącej autoryzacji.

## Plan API (niezaimplementowany)

- `POST /api/rx/ants/tasks`: administrator po weryfikacji tokenu Supabase i członkostwa w `admin_members` tworzy zadanie ze statusem `pending_approval`. Typy: `repository_audit`, `ci_status`, `safe_test`. Nie przyjmować komend powłoki, URL-i dowolnych hostów ani kodu do wykonania.
- `GET /api/rx/ants/tasks`: administrator odczytuje własny panel kolejki i zdarzeń, z paginacją.
- `POST /api/rx/ants/tasks/:id/approve`: administrator potwierdza pojedyncze zadanie. Weryfikować aktualny status, zapisać `approved_by`, `approved_at` i zdarzenie w jednej transakcji.
- `POST /api/rx/ants/tasks/:id/cancel`: anulowanie zadania niewykonanego. Brak możliwości wznowienia bez nowej akceptacji.

## Executor (niezaimplementowany)

1. Serwer uwierzytelnia wykonawcę sekretem przechowywanym wyłącznie po stronie serwera.
2. Atomowo pobiera jedno zadanie `approved`, przełącza na `running` i zapisuje zdarzenie. Konieczna blokada współbieżności.
3. `ci_status`: tylko odczyt statusów GitHub Actions.
4. `repository_audit`: tylko odczyt wybranych plików/raportów w repozytorium VEXORIO.
5. `safe_test`: tylko istniejący, ręcznie dozwolony workflow GitHub Actions; bez arbitralnych argumentów.
6. Zapisuje wynik lub błąd w `result`/`error_message` oraz w `ant_task_events`.
7. Timeout, limit jednoczesnych zadań, brak automatycznych ponowień operacji zapisujących, bez kosztownych usług i bez zmian produkcji.

## Warunki uruchomienia

- Zweryfikować schemat i RLS na staging.
- Przetestować odrzucanie użytkownika bez uprawnień, powtórne zatwierdzanie, wyścig dwóch workerów, błędy i timeouty.
- Dopiero po pozytywnych testach podłączyć czat Królowej. Nie używać klucza `service_role` w HTML.
