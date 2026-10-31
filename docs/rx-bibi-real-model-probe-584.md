# RX BIBI #584 — test rzeczywistego procesu modelu

`GET /__rxcloud/model/probe` działa na **własnym serwerze RX CLOUD**, wymaga prywatnego Bearer `RX_QUEEN_LOCAL_TOKEN` (minimum 32 znaki) i włączonego `RX_BIBI_MODEL_ENABLED=true`. Wysyła losowy, niepochodzący z czatu tekst do lokalnego procesu inference przez `127.0.0.1:RX_BIBI_MODEL_PORT`; dla naszego klasyfikatora oczekuje HTTP 422 (brak znanej odpowiedzi). Nie zwraca próbek treningowych ani sekretów. Test CI uruchamia rzeczywisty lokalny serwer modelu, wykonuje sondę i sprawdza awarię po wyłączeniu modelu.

**Ograniczenie:** 422 potwierdza kompatybilną odpowiedź HTTP, nie dowodzi inteligencji ani tego, że produkcyjny serwer działa. Bez dostępu do uruchomionego prywatnego serwera nie możemy potwierdzić jego stanu. Nic nie jest wdrażane, a flagi produkcyjne pozostają bez zmian.
