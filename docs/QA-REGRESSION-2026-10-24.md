# VEXORIO — audyt i rejestr regresji (24.10.2026)

## Stan zatwierdzony
- Repo: Gregg856/vexorio, branch main. Strona: https://vexorio.grzegorzbub1985.workers.dev/
- Ostatnia poprawka wyglądu mobilnych kart: f832dd27 — zdjęcia `object-fit:contain` (bez obcinania góry), z zachowaniem zwartego układu kart (`height:auto`, `align-items:start`, brak `margin-top:auto` przy cenie).
- Ostatni GitHub Actions dla f832dd27: **VEXORIO checks success**, **Deploy VEXORIO success** (runs 40073893525, 40073893562).
- **Nie zmieniać ponownie kadrowania, proporcji, odstępów ani głównego układu strony bez reprodukcji błędu i porównania na telefonie**. Wcześniejsze iteracje: 4911a46 → 323d01c → 756e882 → 4e64060 → f832dd2. Nie powtarzać.

## Testy wykonane
- GitHub Actions dla ostatniego commita: automatyczne checks i deployment PASS. Są to testy statyczne i smoke test, NIE dowód poprawnego działania po zalogowaniu.
- Publiczny audyt przeglądarkowy, gość, read-only: https://agent.tinyfish.ai/runs/7c088f9c-6b5b-465a-955d-360ad7f5cf86 (24 kroki, completed).
- PASS w przeglądarce desktop: kategorie, podkategorie, wyszukiwanie i filtry, szczegóły ogłoszenia, widoczność przycisków ulubionych, otwarcie formularza zgłoszenia (bez wysyłania), przełączanie PL/DE/EN, otwarcie logowania, sekcje usług i zleceń, obecność linków stopki.
- **Niezweryfikowane**: rzeczywisty widok mobile (automat NIE uruchomił emulacji mobilnej), kadrowanie i wysokości kart na rzeczywistym telefonie (użytkownik zgłaszał regresje; desktop PASS nie dowodzi mobile PASS), logowanie Google/e-mail, dwa konta, wysyłanie/odbiór czatu, powiadomienia push, admin, zgłoszenia, upload zdjęć, tworzenie/edycja ogłoszeń, treści prawne. Ulubione: widoczność, nie pełny przepływ.
- Obserwacja: podkategorie „Praca stała / Praca dorywcza” mogą pozostać po polsku w DE/EN; formularz logowania pokazał separator „lub” po polsku. Zweryfikować w osobnym zadaniu.

## Zasady kolejnych zmian
1. Nie ruszać zaakceptowanej strony głównej; żadnych nowych stron i kont.
2. Najpierw odtworzyć błąd, potem jedna konkretna poprawka, test regresji na mobile i desktop, dopiero publikacja.
3. Po 5 poprawkach testy; nie wracać do naprawionych obszarów bez nowego potwierdzonego błędu.
4. Nie kopiować prawdziwych danych do staging; nowe funkcje testować na staging przed produkcją.
5. W raportach oddzielać PASS automatyczny, PASS przeglądarkowy, NIE TESTOWANO. Zawsze link do strony.
6. Priorytety dotychczasowego planu: czat, licznik wiadomości/push, zgłoszenia vs zgłoszenia zdjęć, moderacja, konta. Pomysły AI z raportu (ochrona antyfraudowa, wyszukiwanie intencji, zlecenie ze zdjęcia) dopiero później.

## Lista kontrolna regresji przed zmianą mobilnych kart
- [ ] Pionowe zdjęcie: góra i dół widoczne; brak przycięcia twarzy.
- [ ] Poziome zdjęcie: bez deformacji.
- [ ] Dwie karty w rzędzie; brak dużych pustych przestrzeni i nakładania się tekstów.
- [ ] Cena, lokalizacja, „Zobacz szczegóły”, „Zgłoś”, „Zgłoś zdjęcie” widoczne.
- [ ] Dla długich tytułów i ogłoszeń bez zdjęcia brak uciętych elementów.
- [ ] Kontrola telefonu i desktopu; odświeżenie cache; dopiero wtedy PASS.


## Dodatkowa kontrola funkcji RPC — 24.10.2026
- `record_listing_view`: funkcja publiczna SECURITY DEFINER podnosi licznik dla aktywnego, zaakceptowanego ogłoszenia. Frontend ogranicza wywołanie do jednego razu na ogłoszenie w sesji, ale **to nie jest zabezpieczenie serwerowe**; możliwe wielokrotne wywołania RPC. Do zaplanowania limitowania po stronie serwera bez zmiany wyglądu kart.
- `has_contractor_premium`: odczytuje status premium wskazanego UUID; funkcja nie służy obecnie aktywnemu premium (premium wyłączone). Nie zmieniać bez sprawdzenia zależności.
- `vexorio_reveal_contact_phone`: odrzuca gości i zablokowanych, ujawnia numer tylko dla własnego ogłoszenia lub aktywnego zaakceptowanego ogłoszenia z `show_contact_phone=true`.
- `vexorio_admin_pending_listings_v2`, `vexorio_admin_review_listing`, `vexorio_admin_publish_reviewed_listing`: wymagają administratora, sprawdzają status oczekujący i walidują parametry; nie wykonywano zapisów.
- Supabase Security Advisor: 4 tabele RLS bez polityk (celowo zamknięte), 2 publiczne RPC SECURITY DEFINER, 13 RPC SECURITY DEFINER dostępnych dla zalogowanych, ochrona przed wyciekłymi hasłami wyłączona. Ostrzeżenie nie jest automatycznie podatnością. Linki: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable i https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- **Nie testowano** aktywnych prób obejścia autoryzacji, rate limitów, mobile ani dwukontowego czatu. Bez nowych kont, bez danych produkcyjnych na staging.
