# VEXORIO — test miasta i promienia 2026-10-24

Test przeglądarkowy (gość): https://agent.tinyfish.ai/runs/5cc4d9bd-6326-443f-814f-62e16a72873d

## Wyniki
- Język DE: etykiety, filtry, kraje i kategorie tłumaczone — PASS.
- Grybów: sugestia i wybór — PASS, 6 ogłoszeń z Grybowa.
- Erftstadt: przy kraju „Wszystkie” nie było sugestii; wpisanie ręczne zwróciło 0 wyników — UX ISSUE / niejednoznaczne. W danych jest ogłoszenie „Erftstad”, literówka w lokalizacji.
- Grybów + 10, 25, 100 km: wszystkie dają 6 ogłoszeń — interfejs działa, lecz brak danych z różnymi odległościami uniemożliwia test granic promienia.
- Sortowanie „Najbliższe” i „Najnowsze”: wybrane, ale nie potwierdzono poprawnej kolejności — INCOMPLETE.
- Reset: powrót do 7 ogłoszeń — PASS.
- Klawiatura mobilna i nakładanie dialogu: UNTESTED, narzędzie bez mobile viewport.

## Diagnoza kodu main/index.html
Funkcja `updateCitySuggestions` pobiera `priorityCities[country]||[]`; przy `country='all'` lista miast priorytetowych jest pusta. Podpowiedzi bazują wtedy tylko na aktualnych ogłoszeniach. Stąd „Erftstadt” nie musi się pojawić, jeśli w danych zapisano „Erftstad”. Dodatkowo dopasowanie lokalizacji bez promienia jest ścisłe i nie naprawia literówek użytkowników.

## Proponowana poprawka na osobnej gałęzi przed produkcją
Dla `country='all'` połączyć listy `priorityCities` dla wszystkich krajów (deduplikacja nazw), z uwzględnieniem kraju przy wybieraniu miasta. Nie robić automatycznej korekty lokalizacji ogłoszenia bez zgody właściciela. Testy regresji: DE/PL/EN, wybór Erftstadt przy country=all i DE, Grybów, reset, promienie, mobile keyboard.

Nie dokonano zmian na produkcji.
