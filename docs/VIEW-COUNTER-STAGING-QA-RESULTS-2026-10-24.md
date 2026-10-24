# VEXORIO — QA licznika, staging, 24.10.2026

Zakres: staging Supabase `owkjdlpawczrnwyszduj`. Produkcja `lfytoxcnutduahshbsko` bez zmian. UI bez zmian.

## Wyniki pięciu obszarów

1. **Powtarzane odsłony** — PASS SQL: pierwsze wywołanie = 1, drugie z tym samym digestem = 1, inne = 2. Unikalny klucz (listing_id, visitor_digest, window_start) oraz `INSERT ... ON CONFLICT DO NOTHING` chronią atomowo przed podwójną rezerwacją.
2. **Anonimowy odwiedzający** — NIEGOTOWE: prywatna funkcja przyjmuje digest, lecz zaufana brama generująca digest z wiarygodnego źródła jeszcze nie istnieje. Digest podany przez klienta jest podatny na zmianę; nie udostępniać funkcji bezpośrednio.
3. **Retencja** — CZĘŚCIOWO: `cleanup_listing_view_guard()` usuwa wpisy starsze niż 48 godzin; ręczny test na pustej tabeli PASS. Harmonogram automatyczny nieutworzony.
4. **Bezpieczeństwo** — PASS: prywatny schemat, brak EXECUTE dla anon/auth, RLS włączone, anon SELECT false. Negatywne testy: nieprawidłowe ID/digest i nieistniejące ogłoszenie zwracają NULL.
5. **Regresja** — PASS SQL: aktywne/zaakceptowane nalicza, po zmianie tytułu na treść wymagającą moderacji (status pending) nie nalicza, zamknięte nie nalicza. Odkryto, że trigger `vexorio_stage_text_moderation` automatycznie przywraca approved przy ręcznej zmianie statusu bez zmiany treści; test skorygowano do faktycznego przepływu. Testowe dane usunięte: 0 listings, 0 limiter rows. NIE TESTOWANO: równoległe niezależne sesje, browser/mobile, anon/auth end-to-end.

## Warunki przed publikacją
- Wdrożyć zaufaną bramę Worker/Edge Function generującą HMAC digest z serwerowym sekretem i stabilnym, prywatnościowo dopuszczalnym identyfikatorem; nie zapisywać surowego IP.
- Wyłączyć możliwość bezpośredniego obejścia limitera przez produkcyjne `public.record_listing_view(bigint)`, po weryfikacji zależności frontendowych.
- Uruchomić i przetestować harmonogram cleanup.
- Testować 20–50 równoległych żądań z oddzielnych połączeń, anonimowych i zalogowanych, oraz pełną regresję przed zmianą produkcji.

**Status: prototyp staging, NIE gotowe do wdrożenia produkcyjnego.**
