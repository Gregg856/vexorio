# RX BIBI — rejestr zatwierdzonych pakietów

Cel: unikać ponownego wdrażania tych samych poprawek. Rejestr dotyczy gałęzi PR #708, a nie produkcji. Nowe zmiany tylko przy nowym wymaganiu lub wykrytym błędzie.

## Pakiet 1 — pięć ulepszeń pisania — testy CI zielone

- Obsługa polecenia „krótką wiadomość”.
- Obsługa polecenia „zwięzłą wiadomość”.
- Normalizacja nadmiarowych spacji w treści.
- Bezpieczne ograniczenie parafrazy w module deterministycznym (nie udaje generatywnego AI).
- Obsługa wielkości liter w rozpoznawaniu streszczenia.

Pliki: `rx-client-writing.mjs`, `tests/rx-client-writing.test.cjs`.
Kod: `cbc8d5e75011b7a23bbab5642984cebb1098a3bd`.
CI: `RX BIBI curriculum tests` — success (41312219691); `VEXORIO checks` — success (41312219732).
Status: zatwierdzony testami na gałęzi PR #708; **nie scalono i nie wdrożono na produkcję**.

## Zasady dalszej pracy

1. Przed nowym pakietem sprawdź ten rejestr oraz kod istniejących modułów.
2. Zmieniaj maksymalnie pięć jasno opisanych funkcji w jednym pakiecie.
3. Dodaj regresję, sprawdź CI, zapisz wynik i commit.
4. Nie zmieniaj ponownie zatwierdzonych funkcji bez konkretnego błędu.
5. Nie twórz drugiej chmury RX, serwera, panelu ani czatu; nie publikuj bez zgody.
