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

## Pakiet 2 — pięć zabezpieczeń adaptera modelu — testy CI zielone

- Bezpieczna obsługa wiadomości o nieprawidłowym typie.
- Odrzucanie pustych wiadomości.
- Usuwanie zbędnych spacji z pytania wysyłanego do modelu.
- Usuwanie zbędnych spacji z odpowiedzi modelu.
- Odrzucanie odpowiedzi zawierających niedozwolone znaki sterujące.

Pliki: `rx-bibi-model-bridge.mjs`, `tests/rx-bibi-model-bridge.test.cjs`.
Kod i poprawka testu: `570f4f39473fc2843c6e5925e1f9e2adc358d016`.
CI: `RX BIBI curriculum tests` — success (41312417058); `VEXORIO checks` — success (41312417056); `RX CLOUD self-host smoke tests` — success (41312417045).
Status: zatwierdzony testami na gałęzi PR #708; **nie scalono i nie wdrożono na produkcję**.

## Pakiet 3 — pięć zabezpieczeń nieprawidłowych danych adaptera — testy CI zielone

- Odrzucanie pustych pytań po komendzie modelu.
- Bezpieczna obsługa brakującej konfiguracji środowiska.
- Obsługa pustej odpowiedzi usługi modelu.
- Obsługa nieprawidłowej struktury danych odpowiedzi.
- Kontrola maksymalnej długości odpowiedzi modelu.

Pliki: `rx-bibi-model-bridge.mjs`, `tests/rx-bibi-model-bridge.test.cjs`.
Kod: `ce662a31a2d12de527f1858b97b42d65462da306`.
CI: `RX BIBI curriculum tests` — success (41312578611); `VEXORIO checks` — success (41312578630); `RX CLOUD self-host smoke tests` — success (41312578595).
Status: zatwierdzony testami na gałęzi PR #708; **nie scalono i nie wdrożono na produkcję**.

## Pakiet 4 — pięć testów ochrony przed niewidocznymi znakami — CI zielone

- Blokada znaku NUL w pytaniu do modelu.
- Blokada znaku nowej linii w pytaniu bezpośrednim.
- Blokada tabulatora w pytaniu bezpośrednim.
- Odrzucenie znaku DEL w odpowiedzi.
- Odrzucenie znaku zmieniającego kierunek tekstu w odpowiedzi.

Pliki: `rx-bibi-model-bridge.mjs`, `tests/rx-bibi-model-bridge.test.cjs`.
Kod i naprawa testów: `55e52366e135f044bc344b7ee579ddefecf05c70`.
CI: `RX BIBI curriculum tests` — success (41313156868); `VEXORIO checks` — success (41313156873); `RX CLOUD self-host smoke tests` — success (41313156869).
Status: zatwierdzony testami na gałęzi PR #708; **nie scalono i nie wdrożono na produkcję**.

## Pakiet 5 — pięć zabezpieczeń Unicode — CI zielone

- Odrzucanie znaków sterujących C1 w pytaniu.
- Odrzucanie znaków zmieniających kierunek tekstu w pytaniu.
- Odrzucanie niedozwolonych kodów Unicode (noncharacters) w pytaniu.
- Odrzucanie znaków sterujących C1 w odpowiedzi.
- Odrzucanie niedozwolonych kodów Unicode w odpowiedzi.

Pliki: `rx-bibi-model-bridge.mjs`, `tests/rx-bibi-model-bridge.test.cjs`.
Kod: `1237d3a9c3b26f60c7f45d9f081591eac46d7e04`.
CI: `RX BIBI curriculum tests` — success (41313258294); `VEXORIO checks` — success (41313258303); `RX CLOUD self-host smoke tests` — success (41313258298).
Status: zatwierdzony testami na gałęzi PR #708; **nie scalono i nie wdrożono na produkcję**.

## Zasady dalszej pracy

1. Przed nowym pakietem sprawdź ten rejestr oraz kod istniejących modułów.
2. Zmieniaj maksymalnie pięć jasno opisanych funkcji w jednym pakiecie.
3. Dodaj regresję, sprawdź CI, zapisz wynik i commit.
4. Nie zmieniaj ponownie zatwierdzonych funkcji bez konkretnego błędu.
5. Nie twórz drugiej chmury RX, serwera, panelu ani czatu; nie publikuj bez zgody.
