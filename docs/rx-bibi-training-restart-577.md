# RX BIBI #577 — pamięć treningowa po restarcie

Istniejący serwer `rx-bibi-own-inference.cjs` przy uruchomieniu wczytuje teraz plik treningowy przez wersjonowany walidator `rx-bibi-training-store.cjs` (#576). Nie przyjmuje niezweryfikowanych ani powtórzonych wejść. Po ponownym uruchomieniu ładuje zapisane przykłady, a po zatwierdzonej zmianie pliku i kolejnym restarcie używa nowej wersji.

Test integracyjny uruchamia prawdziwy osobny proces Node na `127.0.0.1`, pyta przez istniejący most RX BIBI, zatrzymuje proces, uruchamia go ponownie i porównuje odpowiedzi. Następnie zapisuje poprawioną wersję danych i potwierdza jej odczyt po kolejnym restarcie.

To **nie** oznacza automatycznej nauki w czasie rozmowy ani uruchomienia na serwerze produkcyjnym. Dane wymagają jawnego zatwierdzenia, a model nadal jest prostym klasyfikatorem tokenów.
