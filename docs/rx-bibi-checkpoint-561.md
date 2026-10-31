# RX BIBI — punkt kontynuacji po pakiecie #561 (2026-10-31)

## Potwierdzone
- Repozytorium: Gregg856/vexorio; główna gałąź main.
- PR #558: test HTTP Workera; PR #559: poprawione faktyczne uruchamianie tego testu w CI.
- PR #560: zgodność poleceń istniejącego panelu z serwerowym modułem pisania.
- PR #561: test dostępności panelu i ochrony metody API w istniejącym workflow przeglądarkowym; scalony do main.
- Niezależny odczyt działającej strony: GET /rx-bibi-manager.html -> HTTP 200; GET /api/rx/client/chat -> HTTP 405.
- Wymienione odczyty NIE potwierdzają jeszcze zalogowanej rozmowy ani generatywnego modelu AI.
- Serwerowy moduł rx-client-writing.mjs jest deterministyczny; nie należy przedstawiać go jako treningu modelu.
- Nie wykonano wdrożenia produkcyjnego.

## Architektura i zasady pracy
- Korzystaj z istniejącego czatu w rx-bibi-manager.html i istniejącego /api/rx/client/chat; nie buduj trzeciego czatu.
- Użytkownik ma własny serwer i chmurę. Nie proponuj ponownie Cloudflare jako nowej infrastruktury.
- Zmiany pakietami, automatyczne testy, zielone CI przed scaleniem; nie wracaj do ukończonych PR.
- Nie żądaj od użytkownika ręcznego kopiowania kodu z telefonu, jeśli GitHub connector może zrobić zmianę.
- Nie używaj prywatnych tokenów do produkcyjnego testu bez wyraźnej potrzeby i bezpiecznej ścieżki.

## Najbliższy cel
- Potwierdzić, że żywe API odrzuca niezalogowany POST; następnie zaplanować bezpieczny test zalogowanej rozmowy.
- W kolejnym etapie rozwijać realną funkcjonalność czatu, nie tylko mnożyć raporty.
