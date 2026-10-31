# RX BIBI #576 — trwałe przykłady i ocena jakości

Pakiet dodaje `rx-bibi-training-store.cjs`: wersjonowany format `{"version":1,"samples":[{"input":"...","answer":"..."},...]}`, atomowy zapis JSON na lokalnym dysku i blokadę identycznych wejść treningowych. Zapis wymaga wywołania funkcji przez uprawniony lokalny proces — **nie** włączamy automatycznego uczenia z rozmów użytkowników.

`evaluate(samples,cases)` mierzy dokładność na oddzielnych pytaniach kontrolnych, liczbę poprawnych odpowiedzi i braków odpowiedzi. Testy używają danych przykładowych; ich wynik nie jest pomiarem skuteczności rzeczywistej Królowej.

Plik danych pozostaje na własnym dysku RX CLOUD; nie przesyłamy go do GitHuba ani do zewnętrznego LLM. To narzędzie do bezpiecznego rozwijania prostego klasyfikatora tokenów z #575, nie system autonomicznego uczenia ani pełny model generatywny. W przyszłości podłączymy zatwierdzanie zmian i raporty jakości do istniejącego panelu, bez budowania nowego czatu.
