# RX BIBI #578 — bramka jakości przed zatwierdzeniem treningu

`rx-bibi-quality-gate.cjs` porównuje obecne i proponowane przykłady na **tym samym, oddzielnym zbiorze kontrolnym**. Blokuje zapis, jeśli choć jedna wcześniej poprawna odpowiedź staje się błędna, nawet gdy ogólna skuteczność rośnie. Pokazuje również nowe poprawne odpowiedzi. Zapis wymaga jawnego wywołania `approve(file,candidate,cases,{expectedCurrent})`, które odrzuca zmianę, gdy plik na dysku nie odpowiada oczekiwanej wersji.

Brak automatycznego zbierania danych z rozmów, brak wdrożenia produkcyjnego. Zbiór kontrolny powinien być reprezentatywny i nie powinien być używany jako zbiór treningowy. Bramka ogranicza regresje tylko na podanych przypadkach, nie gwarantuje ogólnej jakości ani bezpieczeństwa modelu.
