# VEXORIO — zaakceptowany stan wyszukiwarki (2026-10-23)

Repo: Gregg856/vexorio, branch main.
Strona: https://vexorio.grzegorzbub1985.workers.dev

## Potwierdzone na telefonie użytkownika
- Niemcy + kod 10115 daje podpowiedź: 10115 — Berlin, Niemcy.
- Po wybraniu kod i miasto są razem w jednym polu; kod jest przechowywany osobno jako dataset.postalValue.
- Pole promienia jest osobno; brak nachodzenia etykiet i podwójnych pinezek.
- Użytkownik potwierdził: „Jest ok już”. Nie zmieniać zatwierdzonego wyglądu bez nowego zgłoszenia.

## Automatyczne zabezpieczenia
- tests/search-location-regression.test.js: statyczne kontrole HTML i kodu.
- tests/location-radius-fixtures.test.js: 6 izolowanych przypadków odległości i kraju.
- .github/workflows/deploy.yml: testy przed publikacją Cloudflare.

## Co nadal wymaga weryfikacji
- Nie ma jeszcze prawdziwych ofert do wiarygodnego testowania promienia.
- Testy fixture nie są pełnym testem filtrowania Supabase i geokodowania w przeglądarce.
- Należy sprawdzić wynik GitHub Actions po commicie oraz przeprowadzić end-to-end test na oddzielnych danych testowych.

## Następny etap
Formularze ogłoszeń zależne od kategorii i podkategorii (usługi, praca, zlecenia) bez przebudowy zatwierdzonej wyszukiwarki.