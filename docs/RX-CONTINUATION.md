# RX BIBI / RX Brain — punkt kontynuacji (2026-10-31)

## Zasady pracy
- Przed każdą zmianą sprawdź `main`, istniejące pliki, otwarte PR i aktualne testy. Nie powielaj funkcji ani paneli.
- Pracuj na istniejącym panelu `rx-bibi-manager.html`, istniejącym silniku `rx-brain-chat-engine.cjs`, pamięci `rx-brain-memory.cjs` i testach.
- Zmiany: gałąź → testy CI → poprawki → scalanie po zielonych testach → aktualizacja tego punktu.
- Testy grupuj w rozsądne pakiety, nie uruchamiaj bez potrzeby ciężkich testów.
- Nie wdrażaj produkcji bez wyraźnej zgody właściciela.

## Decyzja
- Priorytet: rozwój własnego RX Brain, RX NAUKA, pamięci, diagnostyki i współpracy RX Mrówek w istniejącym kodzie.
- RX CLOUD 24/7, serwer i realne podłączenie HTTPS odłożone na później. Nie wymagaj terminala serwera podczas obecnego etapu.
- Nie twórz nowego czatu, panelu ani dodatkowej infrastruktury.

## Ukończone
- PR #453–#458: administracyjny, prywatny odczyt pamięci RX Brain, adapter RX CLOUD, testy i diagnostyka gotowości. To kod, nie potwierdzenie działającego serwera.
- PR #459: RX NAUKA 3.4 — `recommend()` pokazuje poziom liczby doświadczeń (`insufficient`, `limited`, `observed`) i ostrzeżenie przy przewadze porażek. Test VEXORIO checks zielony, scalony do `main`.
- Pamięć RX Brain jest deterministyczna i doradcza, nie jest wytrenowanym modelem LLM; brak automatycznego wykonania działań.

## Następny krok
- Najpierw odczytaj ten plik oraz stan `main`.
- Sprawdź, gdzie istniejący czat BIBI korzysta z rekomendacji RX Brain. Rozwijaj integrację i użyteczność pamięci, dodając testy regresji.
- Utrzymuj zgodność starego formatu migawki `schema:1`, bez wymyślania zapisanych doświadczeń.
- Po każdym ukończonym etapie aktualizuj punkt kontynuacji.

## Zakończony pakiet: RX NAUKA 3.5
- PR #460 (punkt kontynuacji) scalony do `main` po zielonym VEXORIO checks.
- Rozwijany istniejący `rx-brain-chat-engine.cjs`: odpowiedzi o pamięci wskazują liczbę prób, jakość dowodów i przewagę niepowodzeń, bez wykonania działań.
- Testy regresji w `tests/rx-brain-chat-engine.cjs`.
- PR #461 scalony po zielonych VEXORIO checks i RX CLOUD self-host smoke tests; naprawiono zdublowany import w testach.

## Zakończony pakiet: RX NAUKA 3.6
- Zabezpieczenie przed przekroczeniem 1 000 000 zapisanych prób dla pojedynczego klucza pamięci; odmowa zapisu bez zmiany istniejących danych.
- Test regresji pamięci i integralności migawki. Bez nowego panelu, automatycznego wykonywania i wdrożenia.
- PR #462 scalony po zielonym VEXORIO checks.

## Zakończony pakiet: RX NAUKA 3.7
- Wzmocnienie odczytu pliku pamięci: odrzucenie dowiązań symbolicznych, katalogów i nieprawidłowych rozmiarów.
- Testy odczytu/zapisu, brakującego pliku i niebezpiecznych ścieżek.
- PR #463 scalony po zielonym VEXORIO checks; bez wdrożenia produkcyjnego.

## Zakończony pakiet: RX NAUKA 3.8
- Weryfikacja pól `trainedModel:false` i `autoExecuted:0` podczas odczytu zapisanej pamięci, aby nie przyjmować fałszywych deklaracji autonomii.
- Testy odrzucenia nieprawidłowych metadanych i zgodności poprawnej migawki.
- PR #464 scalony po zielonym VEXORIO checks. Bez serwera i bez zmian w produkcji.

## Zakończony pakiet: RX NAUKA 3.9
- Unikalne nazwy plików tymczasowych przy zapisie migawki, aby jednoczesne zapisy nie kolidowały na tym samym PID.
- Test równoległych zapisów: końcowy plik jest poprawną migawką jednego z zapisów, bez osieroconych plików tymczasowych.
- Uwaga: to ochrona atomowego pliku, nie łączenie konkurencyjnych doświadczeń; to osobny przyszły etap.
- PR #465 scalony po zielonym VEXORIO checks.

## Zakończony pakiet: RX NAUKA 4.0
- Dodano `learnAndSaveBrain(file, observation)` w istniejącym magazynie pamięci: kolejkuje odczyt → weryfikację → zapis dla jednego pliku w jednym procesie Node.js.
- Test 20 jednoczesnych doświadczeń, odmowy duplikatu i odzyskania kolejki po błędzie.
- **Ograniczenie:** nie zapewnia synchronizacji między różnymi procesami, serwerami ani hostami; nie jest podłączony do autonomicznej nauki i nie potwierdza wdrożenia.
- PR #466 scalony po zielonym VEXORIO checks.

## Zakończony pakiet: RX NAUKA 4.1
- Opcjonalny `chatRXWithStoredMemory(message,{memoryFile,...})` w istniejącym silniku BIBI: odczytuje prawdziwy plik pamięci i przekazuje go do istniejącej odpowiedzi doradczej.
- Testy: prawdziwa zapisana obserwacja, brak zapisu i wykonania podczas rozmowy, brakujący plik, odrzucenie uszkodzonego pliku.
- To funkcja silnika do użycia przez istniejące moduły, **nie jest jeszcze podłączeniem do produkcyjnego panelu ani serwera**.
- PR #467 scalony po zielonych VEXORIO checks i RX CLOUD smoke tests.

## Bieżący pakiet: RX NAUKA 4.2
- W istniejącym panelu `rx-bibi-manager.html` ulepszono już istniejącą komendę odczytu `Co pamiętasz o zadaniu: klucz?`.
- W odpowiedzi: liczba prób, skuteczność, jakość dowodów i ostrzeżenie przy przewadze niepowodzeń; odrzucenie nieprawidłowych wartości z API. Nadal tylko odczyt i wymóg zatwierdzenia.
- Panel już miał uwierzytelnione żądanie do `/api/rx/admin/brain-memory`; nie dodano drugiej ścieżki ani nowego panelu. Dostępność zależy od konfiguracji prywatnego RX CLOUD, której wdrożenia nie potwierdzono.
- Sprawdzić CI i scalić po zielonych testach; nie wdrażać produkcji.

## Aktualizacja ustaleń — RX NAUKA 5.0 (2026-10-31)
- **Właściciel potwierdził: ma już własny serwer i własną chmurę.** Nie proponuj kupna serwera, tworzenia nowego serwera ani odkładania integracji tylko z powodu rzekomego braku infrastruktury.
- Wcześniejszy zapis „RX CLOUD 24/7, serwer i realne podłączenie HTTPS odłożone na później” dotyczył poprzedniego etapu i **nie jest już aktualnym założeniem o posiadaniu serwera**. Nadal nie zakładaj bez pomiaru, że konkretna usługa RX CLOUD działa 24/7 lub że HTTPS i sekretne zmienne są skonfigurowane.
- Używaj istniejącego `rx-cloud-server.cjs`, `worker.js`, `rx-bibi-manager.html`, prywatnej trasy `/__rxcloud/bibi/brain-memory` oraz publicznej bramy administratora `/api/rx/admin/brain-memory`. Nie buduj duplikatów.
- PR #473–#476 scalone: adapter formatu, testy kontraktu, włączenie testów RX NAUKA do CI i test faktycznego `worker.fetch` z symulowanym RX CLOUD. To nie jest jeszcze dowód produkcyjnej dostępności.
- **Najbliższy krok:** zweryfikować na istniejącym własnym serwerze obecność poprawnego pliku `RX_BRAIN_MEMORY_FILE` (lub domyślnego `rx-cloud-private-inbox/rx-brain-memory.json`), zgodność `RX_QUEEN_LOCAL_TOKEN`, `RX_CLOUD_BRAIN_MEMORY_URL`, działanie HTTPS i wynik autoryzowanego odczytu. Nie wypisuj wartości sekretów ani prywatnej pamięci w logach.
- Weryfikacja powinna być tylko do odczytu; przed zmianą produkcji uzyskaj osobną zgodę.

## Uporządkowanie RX — jeden przepływ (2026-10-31)
- **BIBI / Królowa — interfejs:** istniejący `rx-bibi-manager.html`; nie tworzyć kolejnych paneli.
- **RX Brain — pamięć i rozmowa:** `rx-brain-chat-engine.cjs`, `rx-brain-memory.cjs`, `rx-brain-store.cjs`; pamięć doświadczeń to nie sieć neuronowa.
- **RX Neural — istniejący model językowych intencji:** `rx-text-learner.cjs`, `rx-neural-core.cjs`; to klasyfikator czterech intencji, nie generatywny LLM.
- **Jedno wejście do treningu modelu intencji:** `rx-queen-train-batch.cjs`; przyjmuje zatwierdzony pakiet albo recenzje RX Mrówek z indywidualnym `humanApproved:true` i `testReference`. W obu przypadkach używa `rx-queen-training-selection.cjs`, nie drugiego trenera.
- **RX Mrówki — starszy tor:** `rx-ant-ai-trainer.cjs` i `rx-ant-ai-evaluator.cjs` uczą/oceniają osobny syntetyczny model regresji logistycznej; NIE jest to model rozmowy BIBI. Nie łączyć jego wag z siecią językową.
- **Brama / chmura:** istniejące `worker.js` i `rx-cloud-server.cjs`; brak potwierdzenia wdrożenia produkcyjnego i automatycznego treningu 24/7.
- **Nie dublować:** PR #482 zawiera alternatywny moduł `rx-ant-queen-training.cjs`; integracja wejścia z Mrówek odbywa się teraz bezpośrednio w istniejącym `rx-queen-train-batch.cjs`. Nie scalać obu wariantów.
- **Ochrona:** niezależne dane walidacyjne, zakaz wycieku HOLDOUT/CHALLENGE, brak automatycznej promocji modelu do produkcji. Testy CI wymagane.
- **Kolejny krok:** po zielonym CI sprawdzić, czy istniejący harmonogram Mrówek dostarcza rzeczywiste zatwierdzone recenzje; dopiero wtedy podłączać go do tego samego wejścia. Nie deklarować działania na żywo bez dowodu.

## Zatwierdzony punkt kontynuacji: porządek zakończony, teraz szkolimy BIBI (2026-10-31)
- Właściciel potwierdził: **zapisz ustalenia i przejdź do szkolenia BIBI**, nie rozbudowuj struktury RX.
- PR #483 scalony po zielonym CI #4122; PR #482 zamknięty bez scalenia jako duplikat. Jedynym wejściem zatwierdzonych pakietów i recenzji Mrówek jest `rx-queen-train-batch.cjs`.
- **Nie tworzyć nowych paneli, serwerów, trenerów ani kolejnych nazw RX.** Zachować istniejący panel BIBI, Brain, Neural, Mrówki, chmurę i dane.
- **Najbliższe działanie: faktyczny trening istniejącego `rx-text-learner.cjs`.** Najpierw zebrać 4+ nowych, indywidualnie zatwierdzonych przykładów (każdy z etykietą intencji) i osobne przykłady walidacyjne, nieobecne w treningu, HOLDOUT i CHALLENGE.
- Przekazać je do `rx-queen-train-batch.cjs` (lub przez format recenzji Mrówek). Zmierzyć liczbę trafnych odpowiedzi dla konfiguracji i porównać z dotychczasowym modelem na identycznej walidacji. Nie twierdzić, że nastąpiła poprawa bez wyników.
- Przed automatyzacją sprawdzić, czy istniejące Mrówki już dostarczają zatwierdzone recenzje. Żadnego samoczynnego uczenia z prywatnych rozmów ani wdrażania produkcyjnego bez osobnej zgody.
- **Ograniczenie:** obecny `rx-text-learner.cjs` jest neuronowym klasyfikatorem 4 intencji, a nie generatywnym LLM; testy offline nie oznaczają poprawy rozmowy na żywo.
