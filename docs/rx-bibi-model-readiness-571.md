# RX BIBI #571 — audyt gotowości rzeczywistego modelu

## Potwierdzone w repozytorium (2026-10-31)
- Istniejący czat: `rx-bibi-manager.html` -> uwierzytelniony `POST /api/rx/client/chat` w `worker.js`.
- Adapter `rx-bibi-model-bridge.mjs` wymaga **obu**: `RX_BIBI_MODEL_ENABLED=true` i bindingu `RX_BIBI_MODEL_SERVICE` z metodą `fetch`. Bez nich uczciwie informuje o braku modelu.
- `.github/workflows/deploy.yml` generuje `wrangler.toml` przy wdrożeniu. Zawiera `[ai] binding = "AI"`, ale **nie** definiuje bindingu `RX_BIBI_MODEL_SERVICE`. To odrębne interfejsy — sam binding `AI` nie uruchamia adaptera.
- W repozytorium nie ma dowodu na uruchomioną, dostępną usługę inferencji RX BIBI, jej zasoby obliczeniowe ani skonfigurowane połączenie. Zielone testy #570 korzystają z atrap usługi.
- Produkcyjny deploy jest manualny; ten audyt go nie uruchamia.

## Warunki uruchomienia (bez automatycznego włączania)
1. Zidentyfikować faktycznie działający serwer inferencji modelu, jego operatora i limit zasobów; sprawdzić prywatny endpoint `POST /infer` zwracający `{ "answer": "..." }`.
2. Ustalić, czy serwer jest dostępny jako wewnętrzny service binding, czy wymaga innego bezpiecznego transportu. Nie mylić hostingu aplikacji, bazy Supabase i obliczeń LLM.
3. W osobnym PR dopiero po weryfikacji dodać poprawną konfigurację bindingu do generowanego pliku wdrożeniowego. Nie wpisywać sekretów ani adresów prywatnych do publicznego kodu.
4. Zweryfikować limity kosztów, izolację użytkowników, ochronę przed nadużyciami, testy timeout i nieprawidłowej odpowiedzi.
5. Po akceptacji użytkownika uruchomić kontrolowane wdrożenie, a następnie zalogowany test z rzeczywistym silnikiem. Dopiero wtedy można potwierdzić działanie AI.

## Ważne ograniczenie
Własny serwer/chmura RX CLOUD nie oznaczają automatycznie, że istnieje tam model generatywny. Adapter nie trenuje modelu. Nie należy aktywować flagi `RX_BIBI_MODEL_ENABLED` bez zweryfikowanego silnika.
