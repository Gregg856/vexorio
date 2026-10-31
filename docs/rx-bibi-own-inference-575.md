# RX BIBI #575 — własny prototyp inferencji CPU

Nowy `rx-bibi-own-inference.cjs` uczy się wag tokenów z przykładów i wybiera wyłącznie odpowiedzi obecne w danych treningowych. To **rzeczywista, prosta inferencja statystyczna napisana w projekcie**, a nie model językowy LLM ani samodzielna nauka w tle. Nie należy przedstawiać jej jako inteligencji ogólnej.

Serwer nasłuchuje tylko na `127.0.0.1`, ma limit wejścia i nie odpowiada na nieznane pytania (HTTP 422). Używa kontraktu `POST /infer` istniejącego mostu RX BIBI. Nie ma żadnego automatycznego uruchomienia na produkcji.

Na prywatnym komputerze (nie w GitHub Actions) utwórz plik JSON z własnymi, zatwierdzonymi przykładami: `[{"input":"cześć","answer":"Witaj!"},{"input":"status","answer":"Sprawdź stan serwera."}]`. Ustaw lokalnie `RX_BIBI_TRAINING_FILE` na jego ścieżkę oraz `RX_BIBI_MODEL_PORT` na wybrany wolny port, np. 11435. Uruchom `node rx-bibi-own-inference.cjs`. Dopiero po teście lokalnym można osobno włączyć `RX_BIBI_MODEL_ENABLED=true` i taki sam port w RX CLOUD.

Test `node --test tests/rx-bibi-own-inference.test.cjs` wykonuje trening i prawdziwe HTTP loopback z istniejącym mostem. Zielony CI potwierdza działanie **prototypu**, nie działanie na serwerze użytkownika, nie jakość otwartych odpowiedzi i nie gotowość do publicznego wdrożenia.
