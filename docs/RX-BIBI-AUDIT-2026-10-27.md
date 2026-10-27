# RX BIBI — audyt stabilności wtyczek i testów (2026-10-27)

## Zweryfikowane zdarzenia
- Run 40457842191 (ccfc6c2c): niepowodzenie dwóch kroków: eksport filmu z muzyką w RX BIBI AI Studio (nagranie puste, timeout 45 s) oraz nowy test katalogu RX w Chromium (timeout 30 s).
- Run 40458116790 (ccfc6c2c): test katalogu RX nadal nie przeszedł; osobny eksport AI Studio tym razem nie zgłosił błędu. Wskazuje to na niestabilność/warunki środowiskowe testu eksportu, nie potwierdza trwałej naprawy.
- Test katalogu składni i odnośników: PASS, 15 pozycji bez duplikatów.
- Deploy i VEXORIO checks dla 01d75071: success. Ponowny RX BIBI Tester dla 01d75071 w kolejce w chwili audytu.

## Ustalenia i priorytety
1. P1: test Chromium katalogu w środowisku izolowanym. Wersja początkowa korzystała z page.setContent bez pochodzenia HTTP. Poprawka 01d75071 nadała mu izolowany adres. Potrzebny jest wynik CI po poprawce i dokładne logowanie błędów request/response oraz statusu w DOM.
2. P1: RX BIBI AI Studio — sporadycznie pusty plik MediaRecorder podczas eksportu filmu z muzyką. Zbadać obsługę ondataavailable/onstop, ilość bajtów, MIME, czas trwania i cleanup. Nie usuwać asercji eksportu, nie oznaczać testu jako zielonego bez prawidłowego pliku.
3. P2: statusy GitHub Actions w panelu: endpoint /api/rx/direct odczytuje GitHub public API i może chwilowo nie działać. UI ma pokazać niedostępność zamiast fałszywego statusu OK.
4. P2: wszystkie 15 pozycji katalogu są widoczne, lecz statusy oznaczają rodzaj funkcji, nie aktywne procesy ani własną fizyczną chmurę. Należy rozdzielić dostępność modułu, ostatni test i uruchomienie agenta.
5. P2: testy syntetyczne AI/physics nie są potwierdzeniem modelu produkcyjnego ani rzeczywistych odkryć naukowych.

## Zasady zamknięcia
- Każdą poprawkę potwierdzić pełnym CI na dokładnym commicie i testem przeglądarkowym.
- Raportować osobno błędy produktu, błędy testów i chwilowe błędy środowiska.
- Nie maskować czerwonych wyników przez ignorowanie błędów.
- Nie wykonywać automatycznych zmian produkcji przez mrówki bez zatwierdzenia.
