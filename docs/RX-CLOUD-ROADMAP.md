# RX CLOUD — stan prac i plan (2026-10-27)

## Priorytet
RX AI i własna warstwa zarządzania obliczeniami; VEXORIO UI później. Nie duplikować istniejących modułów.

## Istnieje
- rx-cloud-computer.cjs — kolejka/planner, bez własnej VM.
- rx-mega-cloud-computer.cjs — rzeczywiste, ograniczone testy uruchamiane przez GitHub Actions.
- rx-million-hearts.js — logiczne mrówki; nie fizyczne komputery.
- rx-ai-core.cjs — heurystyczny ranking, nie model uczony.
- rx-ant-ai-trainer.cjs — mały klasyfikator trenowany na syntetycznych danych; bez LLM i niezależnej walidacji.
- rx-dna-cloud-memory.cjs — adapter pamięci wymagający zaufanego backendu; brak potwierdzonej trwałości treningów.
- rx-queen-computer-status.cjs — raporty.
- rx-energy-lab.cjs, rx-higgs-lab.cjs, rx-cosmic-collider.cjs — estymacje/symulacje.

## Stan zweryfikowany
GitHub Actions dla e3400e58: RX BIBI Tester i VEXORIO checks zakończone sukcesem. Harmonogram RX: 23 minuta każdej godziny UTC; wykonania zależą od GitHub Actions.

## Następne zadania (bez powtarzania)
1. Checkpoint modelu AI pomiędzy uruchomieniami; wersjonowanie, walidacja, ograniczenie wielkości i fallback.
2. Rozdzielić dane treningowe i walidacyjne; porównywać model z bazowym, nie deklarować postępu bez pomiaru.
3. Zlecać mrówkom konkretne zadania treningu/testów, z raportem czasu, kosztu i błędów.
4. Zbudować kontrolę budżetu zasobów i opcjonalny własny worker na sprzęcie użytkownika.
5. Dopiero później UI i produkcja VEXORIO.

## Ograniczenia
Nie ma własnej stale działającej maszyny chmurowej, nieograniczonej darmowej mocy, dużego modelu językowego ani fizycznego zderzacza. GitHub Actions to infrastruktura dostawcy. Nie dotykać produkcyjnego Supabase bez potrzeby.
