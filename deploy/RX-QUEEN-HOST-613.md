# RX #613 — sprawdzenie Królowej na własnym komputerze lub serwerze

**Na Windows:** w katalogu VEXORIO uruchom w PowerShell:
```powershell
powershell -NoProfile -File .\deploy\rx-queen-windows-preflight.ps1
```

**Na Linux:** w katalogu VEXORIO uruchom:
```bash
node deploy/rx-queen-live-probe.cjs
```

Oba polecenia są tylko do odczytu i sprawdzają **127.0.0.1**. Wymagają Node.js 22+, lokalnego silnika zgodnego z Ollama, zainstalowanego modelu pod nazwą `RX_QUEEN_MODEL_NAME` i uruchomionej bramki `rx-queen-local-model.cjs`. Porty: `RX_QUEEN_RUNTIME_PORT` (domyślnie 11434) oraz `RX_QUEEN_MODEL_PORT` (domyślnie 8798). Zmiennych i sekretów nie wklejaj do czatu ani repo.

**Zielony GitHub nie oznacza zielonego komputera.** GitHub nie ma dostępu do prywatnego hosta. Wynik `READY` oznacza tylko, że lokalny model odpowiedział przez bramkę; autoryzowany czat panelu wymaga osobnego testu. Nie instaluj automatycznie ani nie włączaj produkcyjnego modelu bez weryfikacji.
