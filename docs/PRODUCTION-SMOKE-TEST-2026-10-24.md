# VEXORIO — kontrola oficjalnej strony, 2026-10-24

Adres: https://vexorio.grzegorzbub1985.workers.dev/

## Wykonane kontrole
- Pobranie publicznej strony: dostępna, tytuł VEXORIO — Ogłoszenia bez granic.
- Automatyzacja przeglądarkowa (bez logowania i modyfikacji danych), run: https://agent.tinyfish.ai/runs/6f805920-d8b5-4b3e-a488-d1fc96fe7dbb
- Sprawdzono widoczność i częściową obsługę PL/DE/EN, kategorii, krajów, miasta, promienia, filtrów cenowych, zdjęć i sortowania.
- Nie wykonano testu na realnym mobilnym viewport, nie potwierdzono end-to-end filtrów na backendzie ani obsługi zalogowanego konta.
- Narzędzie przeglądarkowe zgłosiło komunikat „Supabase nie podłączony”, ale analiza main/index.html wykazała zdefiniowane SUPABASE_URL, klucz publishable i inicjalizację createClient przy dostępności biblioteki. Wniosek: niepotwierdzony problem runtime/ładowania biblioteki; wymaga odtworzenia, nie zakładać, że backend jest odłączony.
- Obecny kod main/index.html nadal wywołuje bezpośrednio publiczne `sb.rpc('record_listing_view',...)`. To obejście stagingowego guard; NIE wolno wdrażać nowego licznika bez przełączenia frontendowego wywołania i odcięcia starego publicznego RPC w jednym skoordynowanym wdrożeniu.
- Staging Edge Function `staging-view-counter` jest ACTIVE, ale bez zweryfikowanego sekretu i HTTP end-to-end. Samo `verify_jwt=true` nie jest wystarczającym testem anonimowych użytkowników.

## Decyzja wdrożeniowa
Użytkownik zezwolił na publikację zmian na oficjalnej stronie, jednak aktualny staging nie przeszedł bramki bezpieczeństwa. **Nie wykonano merge, migracji produkcyjnej ani deploy**. Należy najpierw ustawić sekret staging, przygotować proxy first-party i rate limit, wykonać HTTP testy oraz regresję. Po zaliczeniu opublikować w kontrolowany sposób i natychmiast wykonać smoke test produkcji.

## Priorytety
1. Potwierdzić runtime Supabase i odtworzyć ewentualny komunikat o braku połączenia.
2. Ustawić HMAC sekret tylko na staging i bezpieczny testowy origin.
3. Testować anonimowe cookies, błędne żądania, bot abuse i powtarzanie odsłon.
4. Zaprojektować atomowe przełączenie publicznego RPC na chroniony endpoint.
5. Zrobić test mobilny, regresję i dopiero wdrożenie produkcyjne.
