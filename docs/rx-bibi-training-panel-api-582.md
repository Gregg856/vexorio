# RX BIBI #582 — bezpieczny odczyt postępów treningu

Sprawdzono istniejący `rx-bibi-manager.html` i `rx-cloud-server.cjs`: jest już panel i uwierzytelniony kanał lokalnego serwera. Nie tworzymy kolejnego czatu.

Nowy `GET /__rxcloud/bibi/training-preview` na własnym RX CLOUD wymaga `Authorization: Bearer <RX_QUEEN_LOCAL_TOKEN>` (minimum 32 znaki), a także ustawionych lokalnych ścieżek `RX_BIBI_TRAINING_FILE`, `RX_BIBI_HISTORY_FILE`, `RX_BIBI_HOLDOUT_FILE`. Odpowiedź zawiera **tylko zagregowane liczby**: liczba pytań, poprawne, błędne, oczekujące ćwiczenia i skuteczność. Bez tokenu 401, bez konfiguracji 503, inne metody 405. Nie ujawnia pytań, odpowiedzi ani próbek treningowych.

To pierwszy etap integracji panelu: endpoint istnieje w kodzie serwera, lecz UI panelu nie jest jeszcze połączone, a produkcja nie została wdrożona. Następny etap wymaga bezpiecznego pośrednika uwierzytelnienia panelu; nie wolno umieszczać sekretu RX_QUEEN_LOCAL_TOKEN w kodzie przeglądarki.
