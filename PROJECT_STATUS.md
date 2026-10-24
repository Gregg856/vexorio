# VEXORIO — stan projektu i historia napraw (2026-10-24)

Ten plik służy jako punkt odniesienia przed następnymi zmianami. Nie oznacza, że wszystkie funkcje lub tłumaczenia przeszły pełny test end-to-end.

## Repozytorium i publikacja
- Kod: https://github.com/Gregg856/vexorio — gałąź main.
- Publiczna strona: https://vexorio.grzegorzbub1985.workers.dev/
- Publikacja: GitHub Actions, workflow .github/workflows/deploy.yml, Cloudflare Workers.
- Supabase produkcja: lfytoxcnutduahshbsko; staging: owkjdlpawczrnwyszduj.
- Nie zmieniać produkcyjnych danych bez wyraźnej zgody. Nie kopiować prawdziwych danych do staging.
- Nie zakładać nowych kont ani nowych stron; nie modyfikować zatwierdzonego wyglądu strony bez zgody.

## Ukończone i potwierdzone
1. Poprawiono dwa niepoprawne wyrażenia ++ przy identyfikatorach ogłoszeń — commit e431359.
2. Poprawiono test moderacji, który błędnie wymagał wyłącznie polskiego napisu przy przycisku ujawniania zgłoszonej wiadomości — commit 1b459b9. GitHub Actions deploy #784 zakończył się sukcesem.
3. Zapamiętywanie wyboru języka PL/DE/EN/UK przez localStorage klucz vexorio-language; odczyt przy uruchomieniu i zapis w setLang — commit d48abac. Użytkownik potwierdził, że po odświeżeniu palcem ukraiński pozostaje ukraińskim.
4. Sprawdzono kompilację siedmiu skryptów inline w index.html bez błędów składni przed commitem d48abac.

## Znany problem i jego rozwiązanie
Wcześniejsze wdrożenia #779–#783 nie przechodziły. Logi #783 wykazały, że testy regresji zatrzymały publikację w kroku „Testy regresji wyszukiwarki i odleglosci” z błędem „Missing moderation protection: reported message body requires explicit reveal”. Problemem była zbyt sztywna asercja względem polskiej etykiety przy ukraińskiej lokalizacji. Test naprawiono, po czym #784 zakończył się sukcesem. Nie przypisywać tego błędu pamięci podręcznej przeglądarki.

## Bieżący zakres
- Licznik roboczy tłumaczeń: 22/50 (zamrożony do czasu dalszego audytu; nie oznacza 22% całej aplikacji).
- Ukraiński UI: część tłumaczeń już dodana, ale pełne 100% wymaga osobnej kontroli na żywo; nie oznaczać audytu jako ukończonego.
- Start rynku: Polska; inne kraje mogą być ukryte na etapie uruchomienia. Zachować PL/DE/EN/UK.
- Kolejne zmiany: paczki do 50, kontrola regresji co 5, testy przeglądarkowe po paczce, aby oszczędzać limity. Przed kolejną paczką sprawdzać obecny kod i historię, by nie powtarzać pracy.
- Po każdej zmianie weryfikować GitHub Actions oraz zgodność wdrożenia; nie twierdzić, że poprawka działa na produkcji bez potwierdzenia.
- Użytkownik nie chce powtarzających się pytań, zakładania nowych kont ani kolejnych zrzutów ekranu, gdy problem można zbadać przez połączone narzędzia.

## Dostępne narzędzia
- GitHub connector: fetch_file, update_file, fetch_workflow_run_jobs, fetch_workflow_job_logs.
- TinyFish: fetch_content (może odczytać publiczną listę workflow runs i linki z /actions/workflows/deploy.yml).
- Firecrawl: firecrawl_scrape do porównania HTML na Cloudflare (maxAge:0).
- Supabase connector do prac bazodanowych po odpowiednim audycie i autoryzacji.

## Następne kroki
1. Sprawdzić, czy deploy #785 (commit d48abac) zakończył się sukcesem; użytkownik potwierdził poprawne zachowanie języka na stronie.
2. Kontynuować audyt ukraińskich etykiet, bez zmieniania układu strony.
3. Testować każde wdrożenie, a nie tylko zapisy w GitHubie.
