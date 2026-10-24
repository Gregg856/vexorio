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

## Plan zamykania funkcji — 24.10.2026 (aktualizacja)

Zasada: **zamknięte** = potwierdzone właściwym testem i zaakceptowane; **częściowo** = test statyczny lub ograniczony; **otwarte** = wymaga weryfikacji. Nie utożsamiać przejścia CI z testem użytkownika.

| Obszar | Stan | Dowód / kryterium domknięcia |
| --- | --- | --- |
| Publikacja GitHub → Cloudflare | ZAMKNIĘTE dla 62a3fef | VEXORIO checks 40108246120 SUCCESS, Deploy 40108246064 SUCCESS; przy następnej zmianie powtórzyć |
| Push: walidacja payloadu i przekierowanie | CZĘŚCIOWO | Kod i test regresji w CI; otwarte: powiadomienie na Android/Chrome i działający deep-link do rozmowy |
| Zapamiętywanie ukraińskiego po odświeżeniu | ZAMKNIĘTE funkcjonalnie | Potwierdzone przez użytkownika; nie wracać bez nowego błędu |
| Logowanie i rejestracja | OTWARTE | Test istniejącego konta e-mail i Google; nie tworzyć nowych kont |
| Ogłoszenia, zdjęcia, edycja, moderacja | OTWARTE | Pełna ścieżka na istniejących kontach, bez testowych zapisów w produkcji bez zgody |
| Wyszukiwanie, miasto, promień, kategorie | CZĘŚCIOWO | Statyczne regresje i wcześniejszy test gościa; konieczny test mobile |
| Czat i liczniki wiadomości | OTWARTE | Test dwóch istniejących kont, unread, zmiany rozmowy, powiadomienia |
| Zgłoszenia, blokady, bezpieczeństwo | OTWARTE | Weryfikacja ról i RLS/RPC bez modyfikacji produkcji |
| PL/DE/EN/UK | OTWARTE | Pełny przegląd tekstów, szczególnie DE/EN podkategorie i separator logowania |
| Wygląd mobilny | OTWARTE | Rzeczywisty telefon: karty, zdjęcia, klawiatura, przyciski |
| Licznik odsłon — ochrona serwerowa | OTWARTE | Staging i testy bezpieczeństwa przed osobnym zatwierdzeniem prod |
| Audyt końcowy | OTWARTE | Dopiero po zamknięciu krytycznych ścieżek |

Priorytet: najpierw problemy blokujące użytkowników, potem kontrola języków i wyglądu, na końcu pełny test wydania. Bez nowych funkcji, stron i kont. Zamkniętych obszarów nie poprawiać ponownie bez reprodukcji błędu.


## Audyt przekrojowy 2026-10-24 — tylko odczyt (bez testu kont użytkowników)

- **CI i publikacja:** commit `ca1c2e1` — checks i Deploy VEXORIO SUCCESS (GitHub Actions 40109983316 / 40109983213). To nie dowodzi pełnego E2E.
- **Supabase produkcja, security advisors:** 2 funkcje SECURITY DEFINER wykonywalne przez anon (`is_vexorio_admin`, `record_listing_view`); 13 ostrzeżeń dotyczących funkcji SECURITY DEFINER dla authenticated. Samo uprawnienie EXECUTE nie oznacza skutecznego obejścia kontroli — sprawdzono kod wybranych funkcji.
- **Sprawdzone funkcje:** `admin_delete_listing`, `admin_set_user_block`, `admin_reported_message_body`, `vexorio_admin_review_listing`, `vexorio_admin_publish_reviewed_listing` mają kontrolę `auth.uid()` i `is_vexorio_admin()` oraz `search_path=''`. Ich dostęp jest ograniczany wewnątrz funkcji, mimo ostrzeżeń o EXECUTE.
- **Priorytet wysoki:** `record_listing_view(bigint)` jest wywoływalna przez anon, SECURITY DEFINER, i bez ograniczenia częstotliwości zwiększa `view_count` dla aktywnych, zatwierdzonych ogłoszeń. Ryzyko sztucznego nabijania odsłon. Przygotować poprawkę z limitem/ochroną przed nadużyciem, bez wyłączania publicznych odsłon.
- **`is_vexorio_admin()`:** anon może wywołać funkcję, ale sprawdzony kod zwraca wyłącznie `exists(admin_members where user_id=auth.uid())`; dla anon bez UID wynik false. Ograniczenie EXECUTE do authenticated można rozważyć po analizie zależności.
- **RLS:** potwierdzono włączenie na `listings`, `conversations`, `messages`, `listing_reports`, `message_reports`, `profiles`, `push_subscriptions`, `admin_members`, `moderation_blocks`. Brak bezpośrednich polityk dla `admin_members` i `moderation_blocks` jest zgodny z modelem dostępu przez zabezpieczone funkcje, wymaga jednak testu uprawnień z rolami.
- **Wydajność:** advisor produkcji zgłasza 8 brakujących indeksów FK (w tym `conversations.buyer_id`, `conversations.seller_id`) oraz 8 ostrzeżeń `auth_rls_initplan`; priorytet przed wzrostem ruchu.
- **Staging:** różnice w zestawie funkcji, tabel i ostrzeżeń względem produkcji; nie traktować staging jako identycznego środowiska testowego.
- **Otwarte przed finalnym uruchomieniem:** E2E dwóch istniejących kont (czat i licznik, Google/e-mail), Android/Chrome push, moderacja zdjęć i zgłoszeń, kontrola uprawnień DB z rolą nieadministracyjną, tłumaczenia PL/DE/EN/UK, mobilne wyszukiwanie, limity odsłon, ochrona haseł oraz przegląd wydajności.
- **Nie wykonywano:** żadnych zapisów w bazie produkcyjnej, tworzenia kont, zmian layoutu ani symulacji nieautoryzowanych operacji.
