# RX BIBI — stan testera (2026-11-01)

## Potwierdzone
- Repozytorium: Gregg856/vexorio.
- Istniejący tester przeglądarkowy: .github/workflows/rx-bibi-browser.yml. Nie tworzyć duplikatu.
- Panel: rx-bibi-manager.html; status: rx-bibi-tester-status.js.
- Run 41330701027: sukces wszystkich trzech zadań: RX BIBI VIDEO, RX FAST (mózg/czat), RX MRÓWKI (trening/pamięć).
- Osobny test 10 prawdziwych rozmów: tests/rx-bibi-real-chat.cjs, .github/workflows/rx-bibi-real-chat.yml.
- Ten drugi test ma origin produkcyjny ustawiony na stałe i wymaga prawidłowego uwierzytelnienia konta technicznego. Ostatni zdiagnozowany błąd: Supabase invalid_credentials (HTTP 400). Zielony browser workflow NIE potwierdza prawdziwego logowania.
- Produkcja VEXORIO i staging są odrębne. Nie mieszać kont, tokenów ani danych.

## Dalsze kroki
1. Zdiagnozować bezpiecznie odzyskanie dostępu do konta technicznego Supabase; nie ujawniać haseł/tokenów w kodzie lub logach.
2. Po przywróceniu logowania uruchomić 10-turn real-chat, sprawdzić wynik.
3. Dopiero po weryfikacji połączyć widok statusu obu workflow w istniejącym panelu.
4. Nie tworzyć nowego serwera, nowej chmury, konta ani płatnego testera. Używać istniejących GitHub Actions, RX CLOUD, RX FAST, RX Mrówki.

Dokument jest zapisem ustaleń, nie dowodem wykonania naprawy logowania.
