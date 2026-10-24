# VEXORIO staging — aktywacja bramy licznika

**Status:** Edge Function `staging-view-counter` wdrożona na staging `owkjdlpawczrnwyszduj`, ale nie podłączona do strony. **Nie kierować ruchu produkcyjnego.**

## Brakujące sekrety i konfiguracja
W panelu staging Supabase Edge Functions → Secrets ustawić:
- `VIEW_COUNTER_HMAC_SECRET`: losowy sekret co najmniej 32 znaki (preferowane 32+ losowe bajty w hex/base64). **Nie umieszczać w GitHubie, czacie, HTML ani frontendzie.**
- `VIEW_COUNTER_ALLOWED_ORIGIN`: dokładny origin osobnej strony staging (bez ukośnika na końcu), nie produkcyjny origin.
- `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY`: zwykle udostępniane funkcjom przez Supabase; zweryfikować obecność, nie kopiować klucza do klienta.

**Uwaga:** obecny kod zwraca HTTP 503 `not_configured`, jeśli brakuje sekretu lub origin. To celowe bezpieczne zachowanie. Narzędzia podłączone do tej sesji nie pozwalają ustawiać sekretów Edge Functions, dlatego konfiguracja nie została wykonana.

## Wymagane przed uruchomieniem
1. Przygotować osobny adres staging i reverse proxy pod tym samym originem co staging UI. Ciasteczko `HttpOnly; Secure; SameSite=Lax` musi działać w pierwszym kontekście; bez proxy cross-origin nie zapewni stabilnego identyfikatora.
2. Sprawdzić JWT: wdrożona funkcja ma `verify_jwt=true`; wywołania anonimowe wymagają zgodnej metody autoryzacji. Nie wyłączać JWT bez dodatkowej kontroli dostępu i rate-limitów na brzegu.
3. Testy HTTP: brak sekretu => 503; zły origin => 403; błędny JSON => 400; niepoprawny listing => 400; poprawny listing => licznik rośnie raz; ten sam cookie => bez kolejnego wzrostu; nowy cookie => kolejny wzrost.
4. Zabezpieczyć przed sztucznym tworzeniem nowych ciasteczek (limit na brzegu, anti-bot, limity per źródło, odpowiednia polityka prywatności). Sam podpisany cookie NIE chroni przed botem z wieloma nowymi ciasteczkami.
5. Dopiero po testach przełączyć frontend staging, potem zaplanować wyłączenie starego publicznego RPC na produkcji i uzyskać osobną zgodę na produkcję.

## Kontrola 24.10.2026
- Staging funkcja aktywna, `verify_jwt=true`.
- Rola `service_role` ma EXECUTE do `public.vexorio_record_listing_view_server`; `anon` i `authenticated` nie mają.
- Zadanie pg_cron aktywne, ale historia `cron.job_run_details` jeszcze pusta.
- Nie przeprowadzono testów HTTP end-to-end; nie ma dowodu poprawnej konfiguracji sekretów.

**Nie deklarować licznika gotowym do produkcji.**
