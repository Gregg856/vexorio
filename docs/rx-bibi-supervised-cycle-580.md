# RX BIBI #580 — nadzorowany cykl nauki

`rx-bibi-supervised-cycle.cjs` łączy istniejące moduły: `preview` wybiera ćwiczenie na podstawie błędnej odpowiedzi; `apply` wymaga jawnie zatwierdzonej propozycji treningu, obecnej wersji danych i identyfikatora oczekującego ćwiczenia. Zmiana musi zawierać poprawiony przykład i przejść bramkę regresji #578. Dopiero po zapisaniu danych oznaczamy ćwiczenie jako wykonane w historii #579.

To jest lokalna biblioteka i test pełnego przepływu, a nie automatyczne trenowanie na rozmowach. Nie jest podłączona do panelu ani produkcji. Ponieważ zapis danych i historii to dwa osobne pliki, awaria pomiędzy zapisami może wymagać ponownej synchronizacji historii; nie jest to transakcja atomowa między plikami.
