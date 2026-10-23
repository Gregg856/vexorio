# VEXORIO — zatwierdzony układ filtrów mobilnych (2026-10-23)

Użytkownik potwierdził „Jest ok” po poprawce commit b16650a8.

## Ustalenia
- Na ekranach do 600 px panel „Filtruj ogłoszenia” jest domyślnie zwinięty.
- Kliknięcie nagłówka rozwija wszystkie dostępne filtry; ponowne kliknięcie je zwija.
- Główne wyszukiwanie pozostaje widoczne i oferty są dostępne szybciej.
- Na komputerze filtry pozostają widoczne.
- Zachować wyszukiwanie miast/kodów pocztowych, krajów i promienia oraz zaakceptowany publiczny profil.
- Nie zmieniać tego układu bez konkretnej potrzeby i zgody użytkownika.

## Dlaczego wcześniejsze zwijanie nie działało
Wcześniejsza reguła CSS dla `#listingFilterTools` wymuszała `display:grid!important`, ignorując mobilne zwinięcie. Końcowe reguły `.top-filters:not(.mobile-filters-open) .tools#listingFilterTools` i `.top-filters.mobile-filters-open .tools#listingFilterTools` rozwiązują konflikt.

## Zabezpieczenia i ograniczenia
- `tests/mobile-filter-baseline.test.js` sprawdza CSS, przycisk, atrybuty dostępności oraz zachowanie kluczowych pól.
- `.github/workflows/deploy.yml` uruchamia test przed wdrożeniem.
- Testy są statyczne: nie zastępują testu na telefonie ani sprawdzenia wyniku GitHub Actions.
- Nie powtarzać zmian wizualnych w filtrach w następnych zadaniach bez nowego zgłoszenia.
