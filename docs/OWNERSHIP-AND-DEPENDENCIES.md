# VEXORIO — kontrola praw i zależności

Ten dokument jest rejestrem technicznym projektu, **nie** opinią prawną ani dowodem wyłącznych praw.

## Własne moduły
- `index.html`, `worker.js`: kod portalu — pochodzenie i prawa do wszystkich fragmentów wymagają odrębnej weryfikacji.
- `guard/*.cjs`, `guard-lab.*`: moduły VEXORIO Guard tworzone w repozytorium. Należy przechowywać historię zmian i dokumentować pochodzenie wkładów.
- `tests/*`: testy projektu.

## Zasady doboru komponentów
1. Przed dołączeniem biblioteki, modelu, wag modelu, zbioru danych lub zewnętrznego API zapisać źródło, wersję, licencję i dozwolony zakres użycia komercyjnego.
2. Licencję **modelu i wag** weryfikować osobno od licencji kodu uruchomieniowego i danych treningowych.
3. Nie zakładać, że „open source” oznacza brak ograniczeń, brak kosztów lub możliwość odsprzedaży.
4. Utrzymywać możliwość zastąpienia modelu przez adapter bez przepisywania portalu.
5. Nie kopiować cudzego kodu, znaków towarowych ani zbiorów danych bez odpowiednich praw.
6. Nie dodawać sekretów, haseł, tokenów i danych osobowych do repozytorium.
7. Nie trenować modeli na danych użytkowników bez sprawdzenia podstawy prawnej, informacji o przetwarzaniu, retencji i uprawnień.

## Rejestr zależności zewnętrznych (do weryfikacji)
| Komponent | Rola | Status praw/licencji |
| --- | --- | --- |
| Supabase | baza i uwierzytelnianie | sprawdzić warunki usługi i eksport danych |
| Cloudflare Workers | hosting i wdrożenie | sprawdzić warunki usługi i plan migracji |
| GitHub Actions | CI/CD | sprawdzić warunki usługi i eksport repozytorium |
| Wrangler | wdrażanie | zweryfikować licencję konkretnej wersji |
| Planowany model moderacji obrazów | przyszły adapter | **nie wybrano; brak zgody na wdrożenie** |

## Status i działania przed komercjalizacją
- Nie ma obecnie osobnej decyzji dotyczącej licencjonowania całego repozytorium. **Nie dodawać automatycznie pliku LICENSE** bez świadomego wyboru właściciela.
- Historia GitHub nie zastępuje umów przenoszących prawa, dokumentacji pochodzenia ani weryfikacji znaków towarowych.
- Przed publiczną sprzedażą Guard: audyt praw autorskich, licencji, znaków towarowych, ochrony danych i warunków klientów.
- Rozważyć rejestrację znaku VEXORIO / VEXORIO Guard po sprawdzeniu kolizji z wcześniejszymi znakami.

## Zasada wdrożeniowa
Guard działa wyłącznie doradczo, dopóki nie zostanie przetestowany i zatwierdzony proces moderacji. Nie publikować ani nie usuwać ogłoszeń automatycznie na podstawie samych sygnałów.
