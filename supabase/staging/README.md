# VEXORIO — osobna baza testowa (staging)

**Nie uruchamiać migracji bezpieczeństwa na obecnej bazie VEXORIO-PORTAL** — obsługuje produkcję i preview.

## Kolejność uruchomienia
1. Utwórz nowy projekt Supabase `VEXORIO-STAGING` w wybranej organizacji, najlepiej `eu-west-1` (zgodnie z istniejącym projektem). Sprawdź koszt przed potwierdzeniem utworzenia.
2. Odtwórz schemat tabel, funkcji, RLS, bucket `listing-images`, ustawienia Google Auth oraz wymagane indeksy w osobnym projekcie. Nie kopiuj prawdziwych danych użytkowników ani wiadomości; użyj fikcyjnych kont i wpisów.
3. W Cloudflare skonfiguruj osobne sekrety/zmienne dla preview (URL i publishable key projektu staging). **Nie** wprowadzaj `service_role` ani sekretów Stripe do przeglądarki.
4. Dopiero po przełączeniu preview na staging zastosuj kolejno `20261021_billing_staging_only.sql` i `20261021_security_staging_only.sql`, po audycie zależności RLS.
5. Przebuduj publiczne pobieranie listy zleceń: osobny widok streszczeń bez opisu, telefonu, właściciela i zdjęć mogących ujawniać dane kontaktowe; pełne szczegóły tylko przez serwerową autoryzację (właściciel lub opłacony abonent).
6. Weryfikuj uprawnienia do rozpoczęcia rozmowy i dostępu do wiadomości w bazie, nie tylko w JS.
7. Sprawdź płatności Stripe wyłącznie w trybie testowym i webhook z walidacją podpisu.

## Testy regresji
- Gość: może przeglądać ogłoszenia i publiczne streszczenia zleceń; nie odczytuje poufnych danych.
- Autor zlecenia: widzi i edytuje własne zlecenie.
- Fachowiec bez Premium: nie odczytuje szczegółów zlecenia przez API i nie może rozpocząć rozmowy.
- Fachowiec z aktywną, potwierdzoną subskrypcją: ma dostęp do szczegółów i odpowiedzi.
- Po wygaśnięciu: nowy dostęp do zleceń zablokowany.
- Zwykłe ogłoszenia i ich czat działają jak dotąd.
- Użytkownik nie może sam nadać sobie roli admin, aktywnej subskrypcji ani płatnej reklamy.
- Test PL/DE/EN i Android.
- Żadnych prawdziwych obciążeń ani danych osobowych w staging.

## Warunek wdrożenia produkcyjnego
Po testach, kopii zapasowej i zatwierdzeniu przez właściciela VEXORIO. Nigdy automatycznie.
