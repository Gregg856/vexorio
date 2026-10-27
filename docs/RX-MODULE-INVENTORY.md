# RX — inwentaryzacja modułów (GitHub main, 2026-10-27)

Źródło: `Gregg856/vexorio`, drzewo Git `a3f86896d7c8470121cebefaee68254eb29de23b`, 311 pozycji (304 pliki). Inwentaryzacja dotyczy **istnienia plików i przeczytanych implementacji**, nie oznacza potwierdzenia uruchomienia wszystkich usług, modeli ani urządzeń.

## Zasada centralna
RX Strażak = centralny koordynator. RX Czat = interfejs użytkownika do Strażaka. Pozostałe systemy to wyspecjalizowane moduły. Część integracji to **kierunek rozwoju**, nie istniejące połączenie runtime.

## Moduły i rzeczywiste ślady w repozytorium

| Rodzina | Implementacje / punkty wejścia | Ustalony stan |
|---|---|---|
| RX Strażak i rozmowy | `guard-rx-orchestrator.js`, `guard-rx-conversation.js`, `guard-chat.js`, `guard-commands.js`, `guard-lab.html`, `rx-command-bridge.js`, `rx-chat-preview.html` | Orkiestracja doradcza i interfejsy; preview czatu jest demonstracją |
| Wtyczki Strażaka | `guard-plugin-core.js`, `guard-code-audit-plugin.js`, `guard-changes-report-plugin.js`, `guard-task-analyzer-plugin.js`, `guard-task-queue.js` | Rejestr allowlist, odczyt i kontrola zatwierdzenia; nie arbitralne uruchamianie wtyczek |
| RX Queen | `rx-queen-ant-supervisor.cjs`, `rx-queen-ai-bridge.cjs`, `rx-queen-developer-queue.cjs`, `rx-queen-dashboard-render.cjs`, `rx-queen-chat-router.cjs`, `guard-rx-queen-panel.js` | Nadzór i propozycje, nie samoczynne wdrożenia |
| RX Meduza | `rx-medusa-engine.cjs` | Deterministyczne grupowanie i priorytetyzacja sygnałów do Queen; brak samodzielnych napraw |
| Pamięć i raporty | `rx-signal-memory.cjs`, `rx-bibi-unified-adapter.cjs`, `rx-bibi-dashboard-summary.cjs`, `guard/confirmed-fix-memory.cjs` | Przetwarzanie i prezentacja raportów |
| Mrówki RX | `rx-ant-task-board.cjs`, `rx-ant-builder.cjs`, `rx-ant-academy.cjs`, `rx-ant-academy-ci.cjs`, `rx-ant-academy-proof.cjs`, `rx-ant-hibernation.cjs`, `rx-ant-lab.cjs` | Kolejki, projekty testów, rankingi i budżety logiczne; nie autonomiczni agenci programujący |
| AI mrówek | `rx-ant-ai-trainer.cjs`, `rx-ant-ai-evaluator.cjs` | Mały klasyfikator trenowany na danych syntetycznych; nie LLM |
| BIBI AI i router | `rx-ai-core.cjs`, `rx-ai-router.cjs`, `rx-ai-builder.js`, `rx-ai-director.js`, `rx-neuron-v2.js`, `rx-neuron-v21.js`, `guard/ai-core.cjs` | Heurystyki, katalog możliwości, prototypy; nie potwierdzony pełny generatywny mózg |
| RX Developer | `rx-developer-patch-bridge.cjs`, `rx-patch-drafter.cjs`, `guard/rx-developer-core.cjs`, `guard-developer-inspector.js`, `guard-developer-diff.cjs`, `guard-code-fix.js` | Analiza i propozycje zmian; zatwierdzanie wymagane |
| Testy i diagnostyka | `rx-fast-test-engine.cjs`, `rx-evaluator.js`, `rx-error-learner.js`, `rx-bibi-tester-status.js`, `guard/security-diagnostics.cjs`, `.github/workflows/rx-bibi-browser.yml` | Testy uruchamiane w CI, nie stale działająca niezależna usługa |
| Manager i Studio | `rx-bibi-manager.html`, `rx-bibi-studio.html`, `rx-photo-motion.js`, `rx-video-engine.js`, `rx-screen-recorder.html` | Narzędzia przeglądarkowe; generator pełnego AI niepodłączony |
| Chmura / komputer | `rx-cloud-computer.cjs`, `rx-mega-cloud-computer.cjs`, `rx-queen-computer-status.cjs` | Planowanie i ograniczone testy Node w GitHub Actions; fizyczny komputer RX dopiero planowany |
| RX DNA | `rx-dna-core.js`, `rx-dna-memory.cjs`, `rx-dna-lineage.cjs`, `rx-dna-cloud-gateway.cjs`, `rx-dna-cloud-memory.cjs`, `rx-dna-cloud-transport.cjs` | Eksperymentalna pamięć, pochodzenie i transport danych |
| Ewolucja / Genesis | `rx-evolution-engine.cjs`, `rx-genesis.cjs`, `rx-verified-dataset.js`, `rx-integration.cjs` | Moduły badawcze i weryfikacyjne; skuteczność wymaga osobnej ewaluacji |
| Laboratoria | `rx-higgs-lab.cjs`, `rx-cosmic-collider.cjs`, `rx-energy-lab.cjs`, `rx-stellar-lab.cjs`, `rx-stellar-signal.cjs` | Symulacje, estymacje i eksperymenty; bez fizycznej infrastruktury |
| Inne prototypy | `rx-money-engine.cjs`, `rx-money-radar.cjs`, `rx-million-hearts.js` | Kod obecny; nie zakładać realnego zarabiania |
| Katalog UI | `guard-rx-programs.js` | Katalog paneli, eksperymentów i testów; liczba pozycji nie oznacza liczby uruchomionych agentów |

## Znane otwarte kwestie

- `docs/RX-BIBI-AUDIT-2026-10-27.md`: wcześniejsze sporadyczne puste nagranie MediaRecorder z muzyką; wymagany potwierdzony test eksportu.
- Ten sam audyt: regresja testu Chromium katalogu programów; nie oznaczać jako zamknięte bez sprawdzenia aktualnego runu.
- Integracja RX Czat → RX Strażak → Queen/Meduza/mrówki/Developer/Tester/wtyczki wymaga testów end-to-end oraz bezpiecznego API.
- Autoryzacja klient/admin i uprawnienia muszą być egzekwowane po stronie serwera.
- Przyszły komputer RX: brak potwierdzenia sparowanego fizycznego sprzętu i bezpiecznego agenta.

## Nie powtarzać

- Nie przepisywać od zera istniejących paneli i silników.
- Nie ogłaszać zielonego statusu na podstawie braku alarmu.
- Nie mylić katalogu funkcji z procesami stale działającymi.
- Nie dopisywać automatycznego wdrażania bez zgody właściciela.
- Po zmianie weryfikować CI dla dokładnego commitu i osobno wdrożenie.
