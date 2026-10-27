# RX — centralna architektura (zatwierdzony kierunek)

## Jedno źródło sterowania

**RX Strażak jest głównym mózgiem i koordynatorem systemu RX.**
**RX Czat jest interfejsem rozmowy z RX Strażakiem, a nie osobnym mózgiem.**

Przepływ docelowy:

```text
Użytkownik / administrator
          |
       RX Czat (interfejs)
          |
       RX Strażak (centralny koordynator)
          |
          +-- RX Meduza: sygnały i priorytety do Queen
          +-- RX Queen: planowanie i zadania mrówek
          +-- RX ANT: Builder / Academy / Trainer / Hibernation
          +-- RX Developer: analiza i propozycje kodu
          +-- RX Tester: testy i raporty
          +-- RX BIBI AI: router, Studio, Manager, raporty i pamięć
          +-- RX DNA: pamięć i pochodzenie danych
          +-- RX Cloud / Mega Cloud: ograniczone testy CI
          +-- Laboratoria RX: Higgs, Cosmic, Energy, Stellar
          +-- Wtyczki: dozwolone integracje
          +-- Komputer RX (przyszły, po bezpiecznym sparowaniu)
```

## Zasady realizacji

1. Klient ma prosty, estetyczny czat. Administrator widzi także narzędzia i zatwierdzanie zmian.
2. Strażak kieruje zadania do modułów, zbiera odpowiedzi i przedstawia wyniki. To **architektura docelowa**; nie wszystkie połączenia są obecnie zaimplementowane.
3. Uprawnienia muszą być egzekwowane na serwerze. Samo ukrycie przycisków nie zapewnia bezpieczeństwa.
4. Zmiany kodu, wdrożenia, operacje na koncie i przyszłym komputerze wymagają autoryzacji, odpowiednich uprawnień i rejestrowania zdarzeń.
5. Nie deklarujemy, że testy przeszły, urządzenie jest online lub wtyczka działa, jeśli nie mamy rzeczywistego potwierdzenia.
6. Istniejący `rx-chat-preview.html` to **interfejs demonstracyjny**. Napis `RX Czat — centrum poleceń` oznacza miejsce wpisywania poleceń, nie centralny silnik.
7. Uzgodniony kierunek wizualny: ciemny granat/czerń, neonowa zieleń, postać RX Strażaka, wygodny widok mobilny. Nie projektować go od początku w każdym etapie.

## Pełny rejestr istniejących komponentów

Zobacz [RX-MODULE-INVENTORY.md](RX-MODULE-INVENTORY.md). To źródło nazw modułów, plików i ograniczeń. Diagram powyżej opisuje **docelowe zależności**, nie wszystkie obecnie aktywne połączenia. Przy rozbudowie sprawdzaj rejestr zamiast tworzyć listę z pamięci.

## Następna praca

Podłączyć RX Czat do bezpiecznego API koordynatora RX Strażak, najpierw w trybie tylko do odczytu (status, testy, zadania), potem z autoryzowanymi operacjami. Każdy etap ma mieć testy i izolowany PR przed wdrożeniem.
