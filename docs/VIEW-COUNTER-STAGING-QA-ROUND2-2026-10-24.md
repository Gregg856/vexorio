# VEXORIO — druga seria QA licznika, staging (24.10.2026)

Repo branch: staging/view-counter-guard-20261024; baza staging owkjdlpawczrnwyszduj.

## Pięć zadań — stan
1. **Anonimowi odwiedzający:** BLOKER — nie wdrożono jeszcze wiarygodnej bramy nadającej serwerowy digest. Nie wystawiać prywatnej funkcji ani nie ufać digestowi dostarczonemu przez klienta. Docelowo brama Worker/Edge Function musi posiadać sekret i sprawdzony sygnał odwiedzającego; zapobiec obejściu przez public.record_listing_view.
2. **Automatyczne czyszczenie:** PASS konfiguracji — zainstalowano pg_cron, aktywne zadanie `vexorio-staging-view-guard-cleanup` o `15 * * * *`, wywołuje `vexorio_private.cleanup_listing_view_guard()` (usuwa rekordy starsze niż 48 h). Nie potwierdzono jeszcze faktycznego wykonania zadania przez harmonogram.
3. **50 żądań:** PASS 50 SEKWENCYJNYCH wywołań w jednej transakcji, ten sam digest, licznik 1. **NIE TESTOWANO 50 równoległych sesji**; to odrębny test.
4. **Dostęp RPC:** PASS uprawnienia — anon/auth bez USAGE prywatnego schematu; anon bez INSERT tabeli i EXECUTE funkcji; auth bez SELECT tabeli. Uwaga: produkcyjne public.record_listing_view nadal dostępne i niezabezpieczone, bez zmian.
5. **Regresja/porządek:** PASS — 0 ogłoszeń i 0 rekordów limitera po teście; brak zmian UI i produkcji. Testy przeglądarkowe oraz anon/auth end-to-end NIE TESTOWANO.

## Wniosek
**NIE GOTOWE DO PRODUKCJI.** Dokończyć bramę z zaufaną identyfikacją odwiedzającego, rzeczywiste testy współbieżne z oddzielnych połączeń, potwierdzić wykonanie cron i zabezpieczyć/wyłączyć publiczne RPC przy wdrożeniu.
