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

## Moduł wiadomości — stan kontrolny (2026-10-24)
- **Zabezpieczone kodem i testami strukturalnymi:** wyszukiwanie ról PL/DE/EN/UK (584a7fc), podgląd ostatnich wiadomości przy limicie 1000 w partii (a947437), liczniki nieprzeczytanych przy limicie (fd55e0e), odświeżenie listy po oznaczeniu jako przeczytane (f973637), ochrona przed spóźnioną odpowiedzią odświeżania czatu (b0092fd).
- **Tłumaczenia skrzynki:** brak rozmów i stan niezalogowany (1fd8495); ładowanie, błąd i ponawianie (d222f7e).
- **Testy automatyczne:** 12 kontroli regresji w tests/smoke.cjs (b93d7bd). GitHub Actions „VEXORIO checks” dla b93d7bd: sukces; publikacja tego commitu była jeszcze w toku w chwili zapisu.
- **Nie zamykać jako E2E:** wysyłanie i odbieranie na dwóch rzeczywistych kontach, ponowne logowanie, filtrowanie i licznik na telefonie oraz komputerze nie zostały zweryfikowane w tej partii testem przeglądarkowym.
- **Znane ograniczenie:** znaczniki przeczytania są przechowywane lokalnie w localStorage (na urządzeniu); synchronizacja między urządzeniami wymaga projektu zmiany bazy i osobnej zgody. Nie modyfikować produkcyjnego Supabase bez zgody.
- **Zasada kontynuacji:** nie poprawiać ponownie powyższych obszarów bez nowego odtwarzalnego błędu; najpierw zakończyć weryfikację wdrożenia i test dwóch kont, potem oznaczyć moduł jako zamknięty.

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


### Licznik odsłon — sprawdzenie gotowości do naprawy (2026-10-24)
- Frontend `openDetail()` wywołuje bezpośrednio `sb.rpc('record_listing_view', {p_listing_id:x.id})` i ma wyłącznie ograniczenie na czas jednej sesji przeglądarki (`viewedListingsThisSession`); ponowne sesje i bezpośrednie żądania omijają je.
- **Produkcja:** `public.record_listing_view(bigint)` dostępna dla anon/authenticated i zwiększa licznik bez serwerowego ograniczenia. Nie zmieniono funkcji.
- **Staging:** istnieje gotowa koncepcja: prywatna tabela `vexorio_private.listing_view_guard` z unikatowym kluczem `(listing_id,visitor_digest,window_start)`, prywatna funkcja `record_listing_view_guarded` z godzinowym oknem oraz `public.vexorio_record_listing_view_server`. Obie funkcje nie są dostępne bezpośrednio dla anon/authenticated; to dobry punkt wyjścia do zaufanego endpointu serwerowego.
- **Krytyczna zależność:** digest gościa musi powstawać po stronie zaufanego serwera (np. Cloudflare Worker) z sekretu i stabilnego identyfikatora żądania, a nie z dowolnej wartości przesłanej przez przeglądarkę. W przeciwnym razie atakujący może generować nowe digesty i nadal nabijać licznik. Należy dodać endpoint z rate limiting, walidacją ID i bezpiecznym przechowywaniem sekretu; następnie przestawić frontend na endpoint i odebrać anon/authenticated EXECUTE na starym RPC. Dopiero po wdrożeniu całości przetestować na stagingu, potem uzyskać zgodę na produkcję.
- **Status:** DIAGNOZA POTWIERDZONA, NAPRAWA NIE WDROŻONA. Nie włączać istniejącego stagingowego RPC dla anon/authenticated ani nie odcinać starego RPC przed gotowym endpointem — inaczej odsłony przestaną działać.


## Aktualizacja licznika i CI — 24.10.2026 (najnowszy stan)

- **Wdrożenie potwierdzone:** commit `17fba93`, GitHub checks `40111311654` SUCCESS i Cloudflare deploy `40111311652` SUCCESS.
- Endpoint `POST /api/listing-view` jest już w `worker.js`, lecz **celowo wyłączony** dopóki `VIEW_COUNT_ENABLED` nie ma wartości `true`. Nie jest używany przez frontend.
- Testy jednostkowe sprawdzają walidację żądań, origin, HMAC, błędny adres Supabase, awarie upstream, i wymuszenie bezpiecznego wyłączenia; deploy workflow wykonuje `node --check worker.js`.
- Staging: potwierdzono możliwość EXECUTE RPC przez `service_role`, odrzucenie brakującego ID i złego digestu; brak ogłoszeń staging uniemożliwia jeszcze test deduplikacji dla aktywnego ogłoszenia.
- **Nie wykonano:** ustawienia Cloudflare secrets, testu rzeczywistego RPC z Worker, migracji na produkcję, przełączenia frontendowego licznika. Produkcyjny `record_listing_view` nadal działa po staremu.
- Procedura dalszego wdrożenia: `docs/view-counter-rollout.md`. Nie wracać do pisania kolejnych podobnych testów, dopóki nie są dostępne sekrety i dedykowane dane stagingowe. W międzyczasie kontynuować audyt innych funkcji.


## Audyt Supabase STAGING — 24.10.2026

- Projekt: `owkjdlpawczrnwyszduj`. Audyt wyłącznie odczytowy, bez zmian danych, schematu lub produkcji.
- Wszystkie 16 tabel `public` mają RLS włączone (list_tables).
- Security Advisors: 12 ostrzeżeń `authenticated_security_definer_function_executable`; funkcje dostępne dla `authenticated` wymagają potwierdzenia wewnętrznego sprawdzenia uprawnień, nie jest to automatyczny dowód podatności.
- Pięć tabel RLS bez polityk: `public.admin_members`, `public.billing_events`, `public.listing_moderation_decisions`, `public.listing_moderation_queue`, `vexorio_private.listing_view_guard`. Brak polityk może być zamierzony.
- Ostrzeżenie: wyłączona ochrona przed wyciekłymi hasłami w Auth.
- Funkcje administracyjne nie mają EXECUTE dla `anon` (sprawdzone odczytowo). Zalogowani mogą wywołać wybrane RPC, więc należy zweryfikować kontrolę admina wewnątrz funkcji, polityki tabel oraz testować rolę zwykłego użytkownika na stagingu przed zamknięciem audytu.
- Bez zmian uprawnień, aby nie uszkodzić działającej moderacji. Wynik: AUDYT W TOKU.
- Dokumentacja: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable


## Weryfikacja polityk moderacji na STAGING — 24.10.2026

- Odczyt `pg_policies` potwierdził: `moderation_appeals` SELECT własne/admin, INSERT tylko własne odwołanie z aktywną blokadą i uzasadnieniem 20–2000, UPDATE admin z USING i WITH CHECK.
- `moderation_blocks`: SELECT własne lub admin; `moderation_audit`: SELECT tylko admin.
- `listing_reports`: INSERT tylko własne zgłoszenie, status `new`, dozwolona kategoria, szczegóły 10–2000, nie można zgłosić własnego ogłoszenia; SELECT i UPDATE tylko admin, UPDATE z USING i WITH CHECK.
- `admin_members`, `listing_moderation_queue`, `listing_moderation_decisions`: brak bezpośrednich polityk; RLS włączone. Dostęp przez RPC wymaga osobnej weryfikacji implementacji funkcji SECURITY DEFINER.
- Wynik: polityki RLS tych modułów zgodne z podstawowym modelem uprawnień; pełny audyt RPC i test E2E niezamknięty. Bez zmian w bazie.


## Audyt kodu RPC Supabase STAGING — 24.10.2026

- Odczyt `pg_proc.prosrc` bez zmian danych: `is_vexorio_admin` sprawdza `admin_members.user_id=auth.uid()`.
- `admin_set_user_block`, `admin_delete_listing`, `vexorio_admin_pending_listings`, `_v2`, `vexorio_admin_review_listing` sprawdzają `is_vexorio_admin()` wewnątrz funkcji. Blokowanie zabrania blokowania siebie/admina, sprawdza powód 10–500 i zapisuje audyt; zatwierdzanie waliduje decyzję i zapisuje historię.
- `admin_moderation_users` i `admin_moderation_audit` filtrują wyniki przez `is_vexorio_admin()`.
- `is_vexorio_blocked(p_user)` sprawdza zgodność `p_user=auth.uid()`.
- **Uwaga funkcjonalna:** `vexorio_reveal_contact_phone` nadal sprawdza `contractor_access`/premium dla rodzaju `zlecenie`, mimo decyzji produktowej o darmowym kontakcie. Zweryfikować spójność z frontendem i polityką przed zmianą produkcji.
- Wynik: podstawowe wewnętrzne kontrole admin RPC potwierdzone statycznie na STAGING; testy wykonania jako zwykły użytkownik i pozostałe RPC wciąż do zrobienia. Nie modyfikowano bazy.


## Darmowy numer telefonu — STAGING — 24.10.2026

- Zastosowano migrację Supabase STAGING `free_contact_phone_for_approved_listings` w projekcie `owkjdlpawczrnwyszduj`.
- `public.vexorio_reveal_contact_phone(bigint)` nie wymaga już `contractor_access`/Premium. Zachowano wymóg zalogowania, braku blokady, zgody właściciela `show_contact_phone`, aktywnego statusu i zatwierdzonej moderacji dla osób innych niż właściciel.
- Produkcja **bez zmian**. Frontend nadal ma komunikat o Premium przy braku numeru dla zlecenia; zmienić komunikat dopiero przy uzgodnionym wdrożeniu produkcyjnym, aby nie wprowadzać użytkowników w błąd.
- Do zamknięcia: test rzeczywistych ról i numeru na stagingu, zgoda na migrację produkcyjną, aktualizacja frontendowego komunikatu i test końcowy.

## RX ADMIN — punkt kontynuacji (2026-10-29)
- **WŁAŚCIWY CZAT UŻYTKOWNIKA:** `rx-admin-prototype.html`, pole „Napisz do RX…”. Nie mylić z czatem Strażaka `guard-chat.js` / `guard-lab.html`.
- **Już istnieje:** żądanie do `POST /api/rx/chat` z autoryzacją, kontekst ostatnich 20 wiadomości, rozpoznawanie poleceń, kolejka zadań, komendy `Zapamiętaj:` / `Przypomnij:` obsługiwane przez backend, pamięć `rx-persistent-memory.mjs` i panel Królowej. NIE odtwarzać tych modułów od zera.
- **Zrobione 29.10:** opcjonalny zapis maks. 30 wiadomości w `sessionStorage` tej karty w `rx-admin-prototype.html`, powrót po odświeżeniu, oddzielenie kont administratorów; commity `caf77a47`, `fc90975f`. `VEXORIO checks` run 40825207401 **success**, `Deploy VEXORIO` run 40825207363 **success**. Testy nie zastępują ręcznego testu czatu na Androidzie.
- **Również wykonano:** opcjonalny zapis rozmowy w czacie Strażaka, commity `11f53399`, `696a5a0b`, poprawka zgodności z testami `ac84c1a7`; ostatni deploy `ac84c1a7` zielony. NIE poprawiać ponownie Strażaka, gdy użytkownik mówi o głównym czacie RX ADMIN.
- **Model własny:** `rx-neural-core.cjs` i `rx-ant-ai-trainer.cjs` to małe modele matematyczne/klasyfikatory, a nie własny generatywny model językowy. `rx-brain-chat-engine.cjs` jest prostym planerem. Nie deklarować, że RX już rozmawia jak ChatGPT.
- **MODUŁ NR 1 — LIMITY:** `rx-bibi-budget.cjs` udostępnia `enforceLimits` (domyślnie 10 zadań, 4/źródło, 5 wysokich priorytetów), commit `b0b57479`, testy `40a05245` zielone; podłączenie do wykonawcy zadań niepotwierdzone. Unikać nadmiarowych commitów i uruchomień CI.
- **NASTĘPNE JEDNO ZADANIE:** sprawdzić rzeczywiste działanie `POST /api/rx/chat` (w tym aktualną gałąź odpowiedzi, błędy, limity, kontekst i pamięć), następnie usprawnić odpowiedzi w ISTNIEJĄCYM panelu RX ADMIN. Nie tworzyć nowych stron, kont, ani osobnych czatów; nie modyfikować strony głównej VEXORIO.
- **Zasada zamknięcia:** najpierw odczytać ten punkt i aktualny kod, potem minimalna poprawka, testy, deploy, weryfikacja. Nie oznaczać jako skończone bez zielonego deploy i — dla działania interaktywnego — sprawdzenia w przeglądarce.

## RX — decyzja właściciela (2026-10-29)
- **ZAMKNIĘTE ROZWAŻANIA O LIMITACH:** administrator RX ma mieć nieograniczoną liczbę rozmów i wiadomości; przyszli klienci będą mieli odrębne limity rozmów zależne od pakietu. Techniczne limity ochronne (długość pojedynczej wiadomości, kontekst, obciążenie, koszty usług) pozostają. Nie mylić limitów rozmów z limitami planowania zadań Mrówek.
- **WYKONANE:** domyślne limity planowania w `rx-bibi-budget.cjs` zwiększono do 30 zadań, 12/źródło, 10 wysokich priorytetów (`a56bfe65`); generator raportów `rx-ant-task-board.cjs` podłączono do `enforceLimits` (`4a061ba3`). Testy i deploy dla `4a061ba3` zakończone sukcesem: VEXORIO checks https://github.com/Gregg856/vexorio/actions/runs/40826372481 ; Deploy https://github.com/Gregg856/vexorio/actions/runs/40826372532 . Nie wracać do tych zmian bez nowego błędu.
- **PRIORYTET OD TERAZ: BUDOWA WŁASNEGO MODELU RX.** Kontynuować istniejące `rx-neural-core.cjs`, `rx-math-core.cjs`, `rx-ant-ai-trainer.cjs` i powiązane testy. Najpierw ocenić aktualne możliwości, ustalić następny mierzalny krok modelu, implementować i testować. Nie tworzyć duplikatów modułów ani nie przedstawiać obecnego klasyfikatora jako generatywnego modelu rozmowy.
- **PROCES:** przy każdej zmianie podawać bezpośrednie linki do testów GitHub Actions i wdrożenia; sprawdzać faktyczne wyniki. Nie zmieniać strony głównej VEXORIO, nie tworzyć kont.


## RX BIBI / Królowa / RX Brain — punkt wznowienia 2026-11-01

**Priorytet użytkownika:** jeden istniejący czat BIBI dla ludzi, połączony z działającym modelem; administrator osobno zarządza Królową, RX Brain i treningiem. Pracujemy przez GitHub na telefonie; komputer podłączymy dopiero później. Nie zakładać nowych paneli, serwerów, modeli ani pamięci bez sprawdzenia istniejących modułów.

**Potwierdzone w repozytorium:**
- \`rx-bibi-local-chat-adapter.cjs\` + \`rx-brain-chat-engine.cjs\` + \`rx-brain-store.cjs\`: opcjonalne \`memoryFile\`, odczyt RX Brain i trwała lokalna historia \`historyFile\` z tokenem. Integracje i testy pakietów #622–#632 zostały scalone. To **lokalny adapter**, nie dowód podłączenia prywatnej pamięci do publicznego czatu.
- \`rx-cloud-server.cjs\`, \`rx-queen-cloud.mjs\` i \`worker.js\`: istniejące moduły RX CLOUD / Królowej oraz prywatny endpoint administracyjny Brain. Nie zakładać, że produkcyjna konfiguracja sieciowa została zweryfikowana.
- \`worker.js\` obsługuje istniejący uwierzytelniony \`/api/rx/client/chat\`; chroni prywatną pamięć administratora. Opcjonalny \`RX_BIBI_CLIENT_MODEL_FIRST==='true'\` wywołuje \`askClientModel(message,env,{direct:true})\` dla zwykłych wiadomości; bez działającej usługi następuje powrót do bezpiecznego istniejącego planera.
- \`rx-bibi-model-bridge.mjs\` wymaga \`RX_BIBI_MODEL_ENABLED==='true'\` oraz prawdziwego service binding \`RX_BIBI_MODEL_SERVICE\`. \`rx-bibi-own-inference.cjs\` jest prostym lokalnym klasyfikatorem tokenowym, **nie** pełnym generatywnym LLM.
- \`deploy/rxcloud.env.example\` ma domyślnie \`RX_BIBI_MODEL_ENABLED=false\` i \`RX_BIBI_CLIENT_MODEL_FIRST=false\`. Przykład ustawień **nie dowodzi** aktualnego stanu produkcji.
- Pakiet #633, https://github.com/Gregg856/vexorio/pull/633, scalony do main jako \`513dc861d24907d8ab3025bdd6bc72fcb444ee66\`. Trzy GitHub Actions zakończone sukcesem; dodano testy istniejącego model-first, uwierzytelnienia, prywatności i fallbacku. **Nie wykonano wdrożenia produkcyjnego**.
- RX Mrówki mają moduły triage, supervisor i builder, ale raporty \`rx-bibi-reports/rx-ant-task-board.json\` i \`rx-ant-ci-triage.json\` pokazywały 0 zadań i 0 automatycznych napraw. Nie przedstawiać tego jako autonomicznej pracy 24/7.

**Najbliższy krok — nie powtarzać wcześniejszych pakietów:** zweryfikować realną gotowość *istniejącego* runtime modelu i service binding na środowisku, następnie wykonać uwierzytelniony test end-to-end czatu klienta; dopiero po potwierdzeniu i świadomej zgodzie włączyć produkcyjny model-first. Zachować separację prywatnego RX Brain od użytkowników publicznych. Weryfikować GitHub Actions i wdrożenie osobno. Nie wymagać od użytkownika zrzutów ekranu ani kopiowania kodu, jeśli da się sprawdzić narzędziami.
