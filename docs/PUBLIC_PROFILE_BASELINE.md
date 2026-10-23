# VEXORIO — zaakceptowany profil publiczny (2026-10-23)

Repo: Gregg856/vexorio (main). Publiczna strona: https://vexorio.grzegorzbub1985.workers.dev

## Potwierdzone przez użytkownika na Androidzie
- Profil ogłoszeniodawcy jest publiczny i działa bez zalogowania.
- Widoczne są nazwa Greg, zdjęcie profilowe, lokalizacja, bio i liczba aktywnych ofert.
- Osobne zakładki: Ogłoszenia / Usługi / Zlecenia, z licznikami.
- Na telefonie profil otwiera się jako pełnoekranowy przewijany widok.
- Karty ofert mieszczą się w widoku; miniatury mają pokazywać całe zdjęcie/logo bez przycinania (object-fit: contain).
- Użytkownik potwierdził: „Teraz super”. Nie zmieniać zatwierdzonego układu bez nowej potrzeby.

## Regresje, których nie wolno przywrócić
- Nie przywracać małego okna z uciętym dołem i zagnieżdżonym przewijaniem.
- Nie przywracać listy innych ogłoszeń pod szczegółami pojedynczej oferty.
- Nie wymagać logowania do oglądania publicznego profilu.
- Nie przycinać zdjęć na kartach profilu.

## Zabezpieczenia
- tests/public-profile-regression.test.js: statyczne testy obecności profilu, publicznego otwierania, przewijania i miniatur.
- .github/workflows/deploy.yml: testy uruchamiane przed wdrożeniem.
- tests/search-location-regression.test.js oraz tests/location-radius-fixtures.test.js chronią poprzednie prace.

## Ograniczenia
Statyczne testy nie gwarantują wizualnego wyglądu na wszystkich urządzeniach, ani nie potwierdzają wdrożenia. Po każdej zmianie w CSS profilu sprawdzać Android i wynik GitHub Actions.

## Dalsze prace
Nie przebudowywać zaakceptowanego profilu ani wyszukiwarki. Kontynuować niezależne funkcje portalu, testując zmiany przed publikacją.
