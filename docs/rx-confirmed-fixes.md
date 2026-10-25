# RX Strażak — baza potwierdzonych rozwiązań

Ten plik przechowuje wyłącznie **ręcznie zweryfikowane** sposoby naprawy błędów VEXORIO. Nie jest automatycznym poleceniem modyfikowania produkcji.

## Zasady

1. Nie dopisuj rozwiązania tylko dlatego, że alarm GitHub Issue został zamknięty.
2. Zapisuj je dopiero po odtworzeniu problemu, wdrożeniu poprawki i udanym teście regresyjnym.
3. Każdy wpis musi mieć link do konkretnego commita lub PR oraz uruchomienia testów.
4. Nie zapisuj haseł, tokenów, prywatnych wiadomości ani danych użytkowników.
5. RX może podpowiadać wpisy z tej bazy, ale nie wdraża ich automatycznie.
6. Jeśli problem powróci, zmień status wpisu na **do ponownej weryfikacji**.

## Szablon potwierdzonej poprawki

### RX-FIX-0001 — [krótka nazwa]

- **Status:** potwierdzone / do ponownej weryfikacji
- **Objawy:** [konkretne objawy lub nazwy elementów]
- **Odcisk awarii (RX-FINGERPRINT):** [16 znaków, jeśli dostępny]
- **Przyczyna potwierdzona:** [co faktycznie powodowało błąd]
- **Naprawa:** [krótki opis]
- **Commit lub PR:** [link]
- **Test regresyjny:** [link do zielonego GitHub Actions]
- **Data weryfikacji:** [RRRR-MM-DD]
- **Uwagi / ograniczenia:** [co nie zostało przetestowane]

## Dopasowywanie wcześniejszych incydentów

- Najpierw porównuj dokładny **RX-FINGERPRINT**. Podobny opis bez zgodnego odcisku to tylko wskazówka, nie dowód.
- Podpowiadaj wyłącznie wpisy o statusie **potwierdzone** z działającym odnośnikiem do commita/PR oraz zielonego testu regresyjnego.
- Powracający błąd po wcześniej potwierdzonej naprawie wymaga ponownej diagnozy. Nie uznawaj automatycznie dawnej przyczyny za aktualną.
- Gdy brak dopasowania, oznacz incydent jako **nieznany** i zachowaj bezpieczne zachowanie: diagnostyka oraz propozycja do przeglądu, bez zmiany produkcji.
- Nigdy nie ucz modelu na surowych prywatnych zgłoszeniach, tokenach ani danych użytkowników.

## Potwierdzone rozwiązania

Brak wpisów. Dodamy pierwszy po zweryfikowaniu konkretnej naprawy.
