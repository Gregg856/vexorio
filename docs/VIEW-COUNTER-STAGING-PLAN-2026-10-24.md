# VEXORIO — zabezpieczenie licznika odsłon (projekt staging)

Stan: projekt do testów; NIE wdrożono do produkcji.

## Pięć kroków
1. Porównać DDL produkcyjnej funkcji `record_listing_view(bigint)` ze staging.
2. Dodać serwerowy limiter z atomową rezerwacją odsłony (unikalny klucz ogłoszenie + pseudonim odwiedzającego + okno czasowe).
3. Weryfikować status active/approved; nie zapisywać surowego IP, nie przyjmować od klienta arbitralnego identyfikatora jako dowodu tożsamości.
4. Przetestować anon i authenticated, powtórzenia, równoległe wywołania, nieaktywne ogłoszenia, izolację i czyszczenie rekordów.
5. Zapisać wyniki i przeprowadzić regresję bez modyfikacji UI.

## Blokada wdrożenia
Staging nie posiada funkcji `record_listing_view(bigint)`. Nie wolno zgadywać implementacji produkcyjnej ani użyć samego `auth.uid()` (anon nie ma identyfikatora). Wariant bezpieczny wymaga wiarygodnego identyfikatora po stronie serwera (np. ograniczenie na bramie/Worker z podpisanym identyfikatorem i krótką retencją), a nie dowolnego tokenu przekazywanego przez klienta. Sam fingerprint klienta można obejść.

## Kryteria PASS
- 1 odsłona w oknie dla tego samego odwiedzającego i ogłoszenia; równoległe RPC bez podwójnego naliczenia.
- Inny odwiedzający może zostać policzony; anonimowe wizyty nie są całkowicie wyłączone.
- Nieaktywne/niezaakceptowane ogłoszenia nie są naliczane.
- Brak surowych IP i danych osobowych w tabeli limitera; retencja i zadanie czyszczące zweryfikowane.
- Brak zmiany wyglądu, produkcji i danych użytkowników.

## Wyniki
- PASS: gałąź izolowana od main.
- PASS: raport regresji i brak RPC na staging potwierdzone.
- NIE TESTOWANO: migracja, funkcjonalne RPC, równoległość, anon/auth, regresja przeglądarkowa.
