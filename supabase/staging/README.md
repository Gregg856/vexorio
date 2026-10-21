# VEXORIO — staging: stan i warunki przełączenia

## Stan na 2026-10-21
- Osobny projekt Supabase: `owkjdlpawczrnwyszduj` (VEXORIO-STAGING).
- **Preview nadal używa produkcyjnego Supabase. Nie traktować preview jako izolowanego.**
- Na staging poprawiono RLS: zlecenia publiczne, rozpoczęcie czatu bez Premium dla zalogowanych. Premium pozostaje wyłączone.
- Klucz publishable staging istnieje, ale nie jest jeszcze wstawiony do preview.
- Nie kopiować danych użytkowników, ogłoszeń ani wiadomości z produkcji.

## Blokery przełączenia
Kontrola `information_schema.columns` wykazała brak tabel w staging wymaganych przez aktualny frontend:
- `admin_members` (niezmienna lista administratorów)
- `privacy_requests` (wnioski RODO)
- `moderation_blocks` (blokady użytkowników)
- `moderation_appeals` (odwołania)

W staging istnieje `listing_reports`, ale przed przełączeniem trzeba jeszcze porównać polityki RLS, RPC i funkcje moderacji, przechowywanie zdjęć, konfigurację Auth (w tym Google OAuth i redirect URLs), uprawnienia do profili, migracje oraz polityki dla wiadomości.

## Bezpieczna kolejność
1. Uzupełnić brakujące tabele, funkcje i RLS **wyłącznie na staging**; sprawdzić bezpieczeństwo ról i blokad.
2. Skonfigurować Google Auth, callbacki oraz storage `listing-images` na staging.
3. Utworzyć fikcyjne konta i dane testowe; sprawdzić logowanie, ogłoszenia, czat, zgłoszenia, panel admina i RODO.
4. Dopiero potem zmienić publiczny URL Supabase i klucz publishable w **gałęzi preview**; sprawdzić czy nie ma żadnych połączeń z produkcyjną bazą.
5. Wdrożenie na `main` wymaga osobnej, wyraźnej zgody właściciela.

## Obowiązująca polityka biznesowa
Ogłoszenia, publikowanie i pełne przeglądanie zleceń oraz kontakt przez czat są teraz darmowe. Nie aktywować bramek Premium, płatności ani próbnych abonamentów. Dokumenty `20261021_billing_staging_only.sql` i `20261021_security_staging_only.sql` zawierają wcześniejsze założenia paywalla: nie stosować bez audytu i dostosowania.
