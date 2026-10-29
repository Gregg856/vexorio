# RX CLOUD — Windows: przygotowanie migracji z telefonu

Status: instrukcja przygotowawcza. **Nie oznacza, że strona została przeniesiona.** Działającej produkcji Cloudflare nie wyłączać do pomyślnych testów i przełączenia.

## Teraz — z telefonu
- Edytujemy istniejące repo Gregg856/vexorio (main), uruchamiamy istniejący workflow `RX CLOUD self-host smoke tests` i sprawdzamy wyniki.
- Nie tworzymy nowej aplikacji, nowego konta, ani nie instalujemy nic na Androidzie.
- GitHub Actions to testy, **nie** serwer 24/7.

## Później — jednorazowe przygotowanie komputera Windows
1. Sprawdź w PowerShell: `node --version` oraz `git --version`. Jeśli brak Node 22+ albo Git, ustal bezpieczny sposób instalacji z oficjalnego źródła.
2. Pobierz repo: `git clone https://github.com/Gregg856/vexorio.git`, następnie `cd vexorio`.
3. Sprawdź składnię: `node --check rx-cloud-server.cjs` oraz test: `node tests/rx-cloud-server.cjs`.
4. Skonfiguruj **lokalnie** `SUPABASE_URL` i `SUPABASE_ANON_KEY` dla STAGING. Nigdy nie wklejaj kluczy do GitHub ani publicznego czatu. Nie ustawiaj service-role do testów.
5. Uruchom lokalnie z `HOST=127.0.0.1` i sprawdź `http://127.0.0.1:8787/__rxcloud/health`. Nie wystawiaj portu 8787 bezpośrednio do internetu.
6. Dostęp z telefonu do panelu dopiero po konfiguracji uwierzytelnionego, szyfrowanego połączenia. Nie otwieraj panelu administracyjnego publicznie.
7. Przed publikacją: HTTPS, domena, router/firewall, stabilne zasilanie i łącze, aktualizacje, backup/restore, OAuth, push, zdjęcia, czat, testy bezpieczeństwa i rollback.

**Uwaga:** istniejące `deploy/rxcloud-install.sh` i `deploy/rxcloud.service` są dla Linux/systemd, nie dla natywnego Windows. Nie uruchamiać ich w PowerShell. Do czasu przygotowania hosta i HTTPS migracja pozostaje w fazie testów.
