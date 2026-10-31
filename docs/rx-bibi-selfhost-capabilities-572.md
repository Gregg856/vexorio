# RX BIBI #572 — sprawdzenie RX CLOUD self-host

- Repozytorium zawiera rzeczywisty serwer HTTP Node 22: `rx-cloud-server.cjs`, domyślnie na `127.0.0.1:8787`, oraz testy `tests/rx-cloud-server.cjs`.
- To serwer aplikacji, nie potwierdzony serwer inferencji LLM. Adapter `rx-bibi-local-chat-adapter.cjs` korzysta z dotychczasowego deterministycznego mózgu.
- Dodany lokalny odczyt `GET /__rxcloud/model/capabilities` pokazuje wyłącznie konfigurację. `modelVerified:false` zawsze oznacza brak testu prawdziwej inferencji. Nie ujawnia sekretów ani szczegółów hosta.
- Dzisiaj brak skonfigurowanego `RX_BIBI_MODEL_SERVICE` w self-host. Nie zmieniono flag modelu ani produkcji.
- Z istniejącego `/__rxcloud/health` można odczytać zużycie pamięci procesu Node, ale nie CPU/GPU/RAM całego hosta ani dostępność wag modelu. Wymaga to osobnego, uprawnionego pomiaru na własnym serwerze.
- Następny etap: potwierdzić realny host i jego zasoby oraz wybrać backend inferencji. Dopiero potem podłączyć prywatny serwis modelu i wykonać test rzeczywistej odpowiedzi.
