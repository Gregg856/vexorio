# VEXORIO — test produkcji 2026-10-24 (przeglądarka, gość)

Test live: https://agent.tinyfish.ai/runs/7e51f895-79ac-4188-a546-d50aba3f9189
URL: https://vexorio.grzegorzbub1985.workers.dev/

## Potwierdzone testy (PASS)
- Polski interfejs: poprawne etykiety.
- Angielski interfejs: poprawne etykiety.
- Kategoria Praca: 7 → 2 ogłoszenia, inne kategorie znikają.
- Kategoria Motoryzacja: 7 → 1 ogłoszenie, pojawiają się podkategorie.
- Kraj Polska: 7 → 6 ogłoszeń, karta DE znika.
- Kraj Niemcy: 7 → 1 ogłoszenie, tylko karta DE.
- Wyczyść filtry: powrót do 7 ogłoszeń.
- Obrazki z publicznego storage Supabase ładowane w przeglądarce (nie jest to pełny test logowania/API).
- Widoczna lista: 7 ogłoszeń + 2 zlecenia.

## Nieprzetestowane (NIE oznaczać jako PASS)
- DE tłumaczenia w tej rundzie; miasto/autocomplete; rzeczywiste filtrowanie po promieniu; zmiana kolejności sortowania; mobile viewport; konsola JS i sieć; logowanie, czat, moderacja, push, dodawanie ogłoszeń; Edge Function staging i nowy licznik.

## Znalezione potencjalne problemy
- UI pokazuje sformułowanie „1 ogłoszeń” zamiast „1 ogłoszenie”; wymaga potwierdzenia na ekranie i korekty odmiany liczby.
- Narzędzie zaobserwowało nazwę „Erftstad” zamiast „Erftstadt” na jednej karcie; może to być treść ogłoszenia użytkownika, nie błąd interfejsu.
- Informacje prawne opisane jako w przygotowaniu — wymagają odrębnego przeglądu przed pełnym uruchomieniem usług.
- W produkcyjnym index.html nadal jest bezpośrednie wywołanie `sb.rpc('record_listing_view')`; nowy chroniony licznik nie jest wdrożony.

## Wniosek
Sprawdzone publiczne filtry działają na rzeczywistych danych. Brak dowodu, że pozostałe funkcje są wolne od błędów. Żadnych zmian na produkcji w tej rundzie.
