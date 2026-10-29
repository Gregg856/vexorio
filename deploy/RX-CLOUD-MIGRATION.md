# RX CLOUD — bezpieczna migracja VEXORIO (plan operacyjny)

Stan: przygotowanie, NIE migracja produkcyjna. Nie przełączać DNS ani wyłączać Cloudflare/Supabase bez osobnej decyzji.

## Etap A: własny serwer testowy
1. Przygotuj VPS lub własny komputer z publicznym IP, Ubuntu LTS, Node 22+, Caddy i osobnym użytkownikiem rxcloud.
2. Sklonuj istniejące repo do /opt/rxcloud/vexorio; nie twórz nowych kont użytkowników portalu.
3. Skonfiguruj /etc/rxcloud/rxcloud.env (chmod 600), bez wpisywania sekretów do GitHub.
4. Użyj dedykowanej subdomeny TESTOWEJ i szablonów deploy/rxcloud.service oraz deploy/Caddyfile.rxcloud.example.
5. Uruchom najpierw na 127.0.0.1:8787; sprawdź /__rxcloud/health oraz statyczne strony i endpointy.
6. Zrób testy bezpieczeństwa, logowania, sesji, czatu, zdjęć, moderacji i Androida. Nie uruchamiaj niebezpiecznych zapisów na produkcyjnej bazie.

## Etap B: dane i zależności
- Obecny adapter nadal korzysta z worker.js i może łączyć się z Supabase; to migracja HOSTINGU WWW, nie migracja bazy.
- Spisz wszystkie zmienne środowiskowe i integracje Worker (bindingi, cron, kolejki, push, storage, CORS, webhooks).
- Przed migracją bazy: osobny staging, szyfrowane kopie zapasowe, test odtwarzania, strategia synchronizacji i rollback.
- Zmiana domeny wpływa na redirect URL logowania Google/Supabase, ciasteczka, CORS, push i service worker.
- Sprawdź obciążenie, limity żądań, upload zdjęć i prawa do plików; obecny limit 2 MiB może blokować upload.

## Etap C: decyzja o przełączeniu
Wymagane: zielone testy funkcjonalne i bezpieczeństwa, stabilny HTTPS, backup i przetestowany rollback, kontrola DNS, monitoring z alertami, potwierdzenie właściciela.
Przełącz DNS dopiero po zatwierdzeniu. Cloudflare zachowaj jako plan powrotu do czasu zakończenia obserwacji.

## Rollback
Zachowaj starą konfigurację DNS i działający Worker. Przy błędzie przywróć DNS i zweryfikuj integralność danych; samo cofnięcie DNS nie cofa zapisów do bazy.

## Obecne ograniczenia
- Brak potwierdzonego VPS, IP, domeny i dostępu SSH.
- Konfiguracja HTTPS jest szablonem, nie uruchomionym certyfikatem.
- RX CLOUD CI potwierdza wybrane testy, nie zgodność wszystkich funkcji produkcyjnych.
