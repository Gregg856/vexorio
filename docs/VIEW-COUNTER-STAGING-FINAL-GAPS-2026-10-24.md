# VEXORIO — kontrola końcowa prototypu staging (24.10.2026)

Staging: owkjdlpawczrnwyszduj. Gałąź: staging/view-counter-guard-20261024. Bez zmian produkcji i UI.

1. **Anonimowa brama serwerowa:** NIE WDROŻONO. Digest nie może być wybierany przez przeglądarkę; bez zaufanej identyfikacji i sekretu serwera brama byłaby pozorną ochroną. Wymagana integracja z właściwą warstwą Worker/Edge i kontrola polityki prywatności.
2. **Obejście RPC:** staging NIE MA public.record_listing_view(bigint), więc ta konkretna droga nie istnieje na staging. Produkcja MA niezabezpieczone RPC i wymaga migracji wraz z frontendem; bez niej nie można uznać zabezpieczenia za kompletne.
3. **50 równoległych żądań:** NIE TESTOWANO. Wcześniejsze 50 wywołań w jednej transakcji były sekwencyjne i nie dowodzą odporności na równoległość. Unikalny klucz powinien zapewnić atomowość, ale wymaga testu niezależnych sesji.
4. **Cron:** harmonogram aktywny; w cron.job_run_details nie było jeszcze historii uruchomienia. Ręczne wywołanie cleanup zwróciło 0 (pusta tabela), co potwierdza uruchamialność funkcji, nie rzeczywiste czyszczenie przeterminowanych danych.
5. **Raport i regresja:** dane testowe z poprzedniej serii usunięte; brak zmian UI i produkcji. PASS uprawnień do prywatnej tabeli i funkcji oraz podstawowych testów SQL z poprzednich serii. Brak PASS end-to-end.

Werdykt: **NIE GOTOWE DO PRODUKCJI**. Nie publikować, dopóki nie powstanie bezpieczna brama, test współbieżności, test cron z przeterminowanymi danymi i plan wyłączenia starego RPC.
