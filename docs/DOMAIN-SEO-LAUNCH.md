# VEXORIO — przygotowanie vexorio.eu (bez zakupu i bez zmiany produkcji)

## Warunek uruchomienia
Domena `vexorio.eu` nie jest jeszcze kupiona. Nie ustawiaj rekordów DNS ani przekierowań przed potwierdzeniem własności domeny.

## Podłączenie w Cloudflare
1. Po zakupie dodaj `vexorio.eu` do konta Cloudflare, potwierdź własność i ustaw serwery nazw podane przez Cloudflare u rejestratora.
2. W panelu Workers & Pages wybierz Worker `vexorio` i dodaj Custom Domain `vexorio.eu`. Sprawdź certyfikat TLS oraz HTTPS.
3. Wybierz jeden adres kanoniczny (zalecany `https://vexorio.eu/`), a drugi wariant `www.vexorio.eu` przekieruj kodem 301 na kanoniczny.
4. Po uruchomieniu zamień hostname Workers na `vexorio.eu` w `sitemap.xml`, `robots.txt`, `og:url` i `rel=canonical` (jeśli obecne); ustaw przekierowanie 301 ze starego hostname, jeśli platforma na to pozwala.
5. Dodaj nowy origin do listy dozwolonych adresów logowania Supabase Auth, w tym Google OAuth callback/redirect URLs, zgodnie z rzeczywistą konfiguracją. Nie zmieniaj sekretów i nie dodawaj wildcardów bez potrzeby.
6. Sprawdź logowanie Google, publikowanie, czat, zdjęcia, zgłoszenia, powiadomienia, HTTPS i nagłówki bezpieczeństwa na nowej domenie.

## Google i zdobywanie prawdziwych użytkowników
- Po podłączeniu domeny zweryfikuj własność w Google Search Console i zgłoś `https://vexorio.eu/sitemap.xml`.
- Nie indeksuj prywatnych wiadomości, panelu konta, stron moderatora ani niezatwierdzonych ogłoszeń. Weryfikuj publiczne adresy przed dodaniem ich do mapy witryny.
- Zacznij od prawdziwych ogłoszeniodawców w wybranych regionach i trzech językach PL/DE/EN; nie generuj fikcyjnych ogłoszeń, opinii ani kont.
- Monitoruj Search Console: zaindeksowane strony, błędy indeksacji, kliknięcia i zapytania.
- Przed uruchomieniem działań marketingowych sprawdź aktualność regulaminu, polityki prywatności i procesu zgłaszania treści.

## Zasada wdrożenia
Zmiany na produkcji i w produkcyjnej bazie danych wymagają osobnej kontroli; ten dokument niczego nie przełącza.
