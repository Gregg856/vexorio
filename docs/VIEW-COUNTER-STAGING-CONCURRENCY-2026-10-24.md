# VEXORIO — test współbieżności i retencji, 24.10.2026

Środowisko: staging Supabase owkjdlpawczrnwyszduj; produkcja bez zmian.

## Wyniki
- **Współbieżność PASS (20 żądań):** utworzono fikcyjne aktywne/zaakceptowane ogłoszenie ID 25; uruchomiono 20 wywołań `vexorio_private.record_listing_view_guarded(25,repeat('a',64))` za pomocą `Promise.allSettled` z niezależnych wywołań narzędzia SQL. 20/20 zakończonych powodzeniem; odczyt z tabeli listings: `view_count=1`. Narzędzie mogło kolejkować wywołania, dlatego to test 20 równolegle *wysłanych* żądań, a nie dowód pełnej równoczesności transakcji w bazie.
- **Retencja PASS:** wstawiono dwa wpisy testowe, jeden z `window_start` sprzed 72 godzin, drugi aktualny. Ręczne wywołanie `cleanup_listing_view_guard()` usunęło dokładnie jeden stary wpis i zachowało aktualny; pozostałość usunięto.
- **Harmonogram:** pg_cron zadanie aktywne, ale `cron.job_run_details` było puste podczas kontroli — nie potwierdzono automatycznego uruchomienia.
- **Porządek PASS:** po testach `public.listings=0`, `vexorio_private.listing_view_guard=0`.
- **Anonimowe wyświetlenia END-TO-END: BLOKER:** nie istnieje jeszcze bezpieczna brama serwerowa generująca digest. Nie podłączać frontendowej funkcji bez serwerowego sekretu, ochrony przed podszywaniem i planu wyłączenia publicznego produkcyjnego RPC.

Werdykt: ograniczanie SQL przeszło test 20 równolegle wysłanych żądań. **Cały licznik NIE GOTOWY DO PRODUKCJI**, dopóki nie zostanie wdrożona i przetestowana zaufana brama.
