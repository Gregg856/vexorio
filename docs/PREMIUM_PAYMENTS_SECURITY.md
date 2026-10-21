# VEXORIO — bezpieczne uruchomienie abonamentów (staging)

**Status:** prace przygotowawcze. Żadne prawdziwe płatności nie są aktywne. Nie wdrażać migracji na współdzieloną bazę produkcyjną.

## Rozdzielone produkty
- Zwykłe ogłoszenia i publikacja zleceń: bezpłatne.
- Konto fachowca: bezpłatne.
- Dostęp do szczegółów zleceń i kontaktu z klientem: aktywny, opłacony abonament, bez darmowego okresu próbnego.
- Reklama firmy i wyróżnienie ogłoszenia: niezależna płatność, nie daje dostępu do zleceń.

## Architektura płatności
1. Zalogowany użytkownik wybiera abonament; serwer weryfikuje tożsamość z tokenu Supabase i tworzy Stripe Checkout Session w trybie `subscription` z ustalonym po stronie serwera Price ID. Nie przyjmować ceny ani identyfikatora użytkownika z formularza jako zaufanych danych.
2. Stripe obsługuje płatność. Sam powrót na success_url **nie** aktywuje abonamentu.
3. Endpoint webhook sprawdza podpis Stripe na **surowym body** i odrzuca stare podpisy. Przetwarza zdarzenia idempotentnie przez `billing_events(provider, provider_event_id)`.
4. Po `customer.subscription.created/updated/deleted` serwer pobiera aktualny stan subskrypcji ze Stripe, sprawdza właściciela na podstawie danych zapisanych przy tworzeniu Checkout i zapisuje `billing_subscriptions`. Rozważyć `invoice.paid` i `invoice.payment_failed` do rozliczenia statusu; dostęp tylko dla opłaconego okresu.
5. Funkcja `has_contractor_premium` odczytuje wyłącznie serwerowo potwierdzone subskrypcje. Nie opierać autoryzacji na stanie przeglądarki.
6. Reklamy korzystają z osobnego `payment` Checkout i `business_promotions`; weryfikacja właściciela ogłoszenia przed zakupem.

## KRYTYCZNE: bezpieczeństwo przed uruchomieniem
- **Publiczne SELECT na `public.listings` zwraca dziś również pełne dane zleceń i numery kontaktowe.** Zastąpić to bezpiecznym publicznym widokiem z ograniczonymi kolumnami (np. id, typ, kategoria, ogólny obszar, tytuł bez danych osobowych), a pełne szczegóły udostępniać przez serwerową funkcję kontrolującą właściciela lub opłacone Premium. Zmiana wymaga aktualizacji frontendowych zapytań i testów regresji.
- Ograniczyć `conversations` INSERT dla zleceń do aktywnego abonenta (lub właściciela), a także odczyt i wysyłanie wiadomości w rozmowach o zleceniach po wygaśnięciu abonamentu zgodnie z przyjętą polityką dostępu.
- W `profiles` uniemożliwić samodzielną zmianę roli na `admin` przez polityki i/lub trigger; sprawdzić istniejące konta i uprawnienia.
- Nie używać `service_role`, klucza Stripe ani webhook secret w `index.html` i w publicznym repozytorium. Wyłącznie Cloudflare Secrets.
- Osobny projekt Supabase do stagingu; obecny preview i produkcja współdzielą bazę. Nie wykonywać zmian RLS na współdzielonej bazie bez planu migracji.

## Testy przed publikacją
- Gość: widzi bezpieczną listę zleceń, nie widzi opisu, numeru, zdjęć z danymi osobowymi ani wiadomości.
- Zalogowany bez Premium: nie może odczytać pełnych danych przez REST/RPC ani założyć rozmowy o zleceniu.
- Zalogowany z aktywnym opłaconym Premium: widzi szczegóły i może odpowiedzieć.
- Po anulowaniu lub wygaśnięciu: dostęp wygasa zgodnie z końcem opłaconego okresu.
- Autor zlecenia: może czytać i edytować własne zlecenie bez Premium.
- Użytkownik nie może sam sobie nadać `admin`, `active`, daty końca subskrypcji ani aktywować reklamy.
- Powtórzony webhook nie przedłuża dostępu dwukrotnie; sfałszowany webhook jest odrzucany.
- Zakup reklamy nie odblokowuje zleceń; zakup Premium nie promuje firmy.
- Testy po polsku, niemiecku i angielsku na telefonie.

## Wymagane przed podłączeniem
- Konto Stripe właściciela firmy, weryfikacja działalności i testowe Price IDs.
- Osobne środowisko Supabase staging oraz sekretne klucze Stripe i Supabase w Cloudflare.
- Uzgodniony cennik, waluty, podatki/VAT, regulamin abonamentu i rezygnacji.
