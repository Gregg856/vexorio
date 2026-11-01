# RX #612 — sprawdzenie lokalnego modelu Królowej

Na **własnym serwerze RX CLOUD** (nie w GitHub Actions), po zainstalowaniu zgodnego lokalnego runtime i modelu, ustaw prywatnie zmienne:

- `RX_QUEEN_RUNTIME_PORT` — port lokalnego runtime, domyślnie 11434
- `RX_QUEEN_MODEL_PORT` — port bramki Królowej, domyślnie 8798
- `RX_QUEEN_MODEL_NAME` — dokładna nazwa zainstalowanego modelu

Uruchom `node deploy/rx-queen-live-probe.cjs` z katalogu projektu. Test łączy się **wyłącznie z 127.0.0.1**: sprawdza listę zainstalowanych modeli oraz wysyła krótkie pytanie do bramki Królowej. Nie zmienia konfiguracji, nie pobiera modeli, nie ujawnia odpowiedzi ani sekretów. Zwraca kod 0 przy sukcesie, 1 przy braku gotowości.

Sukces oznacza tylko działającą lokalną ścieżkę runtime → model → bramka. Nie dowodzi działania publicznego panelu, uprawnień administratora ani integracji czatu. **Nie włączaj RX_QUEEN_MODEL_ENABLED na produkcji przed testem autoryzowanego czatu.**
