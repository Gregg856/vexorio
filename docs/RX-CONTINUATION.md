# RX BIBI / RX Brain — punkt kontynuacji (2026-10-31)

## Zasady pracy
- Przed każdą zmianą sprawdź `main`, istniejące pliki, otwarte PR i aktualne testy. Nie powielaj funkcji ani paneli.
- Pracuj na istniejącym panelu `rx-bibi-manager.html`, istniejącym silniku `rx-brain-chat-engine.cjs`, pamięci `rx-brain-memory.cjs` i testach.
- Zmiany: gałąź → testy CI → poprawki → scalanie po zielonych testach → aktualizacja tego punktu.
- Testy grupuj w rozsądne pakiety, nie uruchamiaj bez potrzeby ciężkich testów.
- Nie wdrażaj produkcji bez wyraźnej zgody właściciela.

## Decyzja
- Priorytet: rozwój własnego RX Brain, RX NAUKA, pamięci, diagnostyki i współpracy RX Mrówek w istniejącym kodzie.
- RX CLOUD 24/7, serwer i realne podłączenie HTTPS odłożone na później. Nie wymagaj terminala serwera podczas obecnego etapu.
- Nie twórz nowego czatu, panelu ani dodatkowej infrastruktury.

## Ukończone
- PR #453–#458: administracyjny, prywatny odczyt pamięci RX Brain, adapter RX CLOUD, testy i diagnostyka gotowości. To kod, nie potwierdzenie działającego serwera.
- PR #459: RX NAUKA 3.4 — `recommend()` pokazuje poziom liczby doświadczeń (`insufficient`, `limited`, `observed`) i ostrzeżenie przy przewadze porażek. Test VEXORIO checks zielony, scalony do `main`.
- Pamięć RX Brain jest deterministyczna i doradcza, nie jest wytrenowanym modelem LLM; brak automatycznego wykonania działań.

## Następny krok
- Najpierw odczytaj ten plik oraz stan `main`.
- Sprawdź, gdzie istniejący czat BIBI korzysta z rekomendacji RX Brain. Rozwijaj integrację i użyteczność pamięci, dodając testy regresji.
- Utrzymuj zgodność starego formatu migawki `schema:1`, bez wymyślania zapisanych doświadczeń.
- Po każdym ukończonym etapie aktualizuj punkt kontynuacji.

## Zakończony pakiet: RX NAUKA 3.5
- PR #460 (punkt kontynuacji) scalony do `main` po zielonym VEXORIO checks.
- Rozwijany istniejący `rx-brain-chat-engine.cjs`: odpowiedzi o pamięci wskazują liczbę prób, jakość dowodów i przewagę niepowodzeń, bez wykonania działań.
- Testy regresji w `tests/rx-brain-chat-engine.cjs`.
- PR #461 scalony po zielonych VEXORIO checks i RX CLOUD self-host smoke tests; naprawiono zdublowany import w testach.

## Zakończony pakiet: RX NAUKA 3.6
- Zabezpieczenie przed przekroczeniem 1 000 000 zapisanych prób dla pojedynczego klucza pamięci; odmowa zapisu bez zmiany istniejących danych.
- Test regresji pamięci i integralności migawki. Bez nowego panelu, automatycznego wykonywania i wdrożenia.
- PR #462 scalony po zielonym VEXORIO checks.

## Bieżący pakiet: RX NAUKA 3.7
- Wzmocnienie odczytu pliku pamięci: odrzucenie dowiązań symbolicznych, katalogów i nieprawidłowych rozmiarów.
- Testy odczytu/zapisu, brakującego pliku i niebezpiecznych ścieżek.
- Następnie sprawdzić CI i scalić dopiero po sukcesie. Bez wdrożenia produkcyjnego.
