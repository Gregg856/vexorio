# RX CLOUD — start od zera bez serwera (staging only)
# Ubuntu 24.04 LTS, Node.js 22+, Caddy. Szablon dla PRZYSZŁEGO VPS.
# NIE uruchamiaj na produkcji, nie wklejaj sekretów do repozytorium.

## 1. Przygotowanie maszyny
- Osobny VPS z publicznym IPv4/IPv6, minimum 2 vCPU, 4 GiB RAM, 40 GiB SSD (wartości orientacyjne; zweryfikuj obciążenie).
- SSH kluczem, aktualizacje bezpieczeństwa, firewall: tylko 22 (z ograniczeniem IP), 80 i 443.
- Zainstaluj Node.js 22+ i Caddy z oficjalnych repozytoriów; nie uruchamiaj aplikacji jako root.
- Użytkownik systemowy `rxcloud`, katalog `/opt/rxcloud/vexorio`, katalog konfiguracji `/etc/rxcloud`.
- Domena testowa należąca do operatora; DNS kierujący na VPS.

## 2. Pliki już istniejące w repo
- `rx-cloud-server.cjs` — adapter HTTP Worker do Node.
- `deploy/rxcloud.service` — systemd (wymaga instalacji przez administratora maszyny).
- `deploy/Caddyfile.rxcloud.example` — HTTPS dla domeny testowej (zamień rxcloud.example.com).
- `scripts/rx-cloud-health.cjs` — sonda zdrowia i raport JSON.
- `.github/workflows/rx-cloud-selfhost.yml` — testy CI.

## 3. Konfiguracja środowiska — tylko na serwerze
Utwórz `/etc/rxcloud/rxcloud.env` na podstawie `deploy/rxcloud.env.example`.
Nie używaj klucza service-role do publicznych testów, dopóki nie przeprowadzimy audytu uprawnień.
Na początku podłącz tylko oddzielny Supabase STAGING; nie kopiuj danych użytkowników bez planu migracji.
Ustaw `HOST=127.0.0.1`, `PORT=8787`.

## 4. Pierwsze uruchomienie
- `node --check rx-cloud-server.cjs`
- `node tests/rx-cloud-server.cjs`
- `node tests/rx-cloud-queen-panel.cjs`
- Uruchom serwer lokalnie i sprawdź `curl -fsS http://127.0.0.1:8787/__rxcloud/health`.
- Uruchom sondę `RX_CLOUD_HEALTH_URL=http://127.0.0.1:8787/__rxcloud/health node scripts/rx-cloud-health.cjs`.
- Dopiero potem konfiguruj usługę systemd i HTTPS na testowej domenie.

## 5. Bramka przed produkcją
Audyt endpointów Worker, zdjęć i uploadów, autoryzacji, CORS, Google OAuth, powiadomień push, cache, limitów żądań, backupów, odtwarzania i planu rollback. Bez spełnienia bramki NIE zmieniać DNS, Cloudflare ani produkcyjnego Supabase.

Stan na dziś: szablony i kod w GitHub; brak potwierdzonej maszyny, IP, DNS, uruchomionej usługi i certyfikatu.
