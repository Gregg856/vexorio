# RX BIBI #585 — przygotowanie własnej usługi modelu

Zbadano istniejące szablony Linux/systemd. Dodano **opcjonalny** `deploy/rx-bibi-model.service`, uruchamiający istniejący `rx-bibi-own-inference.cjs` na `127.0.0.1`. Nie tworzy nowego serwera, nie uruchamia usług automatycznie, nie dotyka produkcji.

## Kolejność po uzyskaniu dostępu do własnego hosta
1. Potwierdź system operacyjny hosta (ten szablon dotyczy Linux/systemd, nie Windows), Node.js 22+, wolny port i lokalny plik treningowy w wersji 1.
2. W prywatnym `/etc/rxcloud/rxcloud.env` ustaw `RX_BIBI_TRAINING_FILE` na istniejący plik i `RX_BIBI_MODEL_PORT` na wolny port; kluczy nie dodawaj do repo. Usługa modelu powinna wystartować osobno, lokalnie.
3. Zweryfikuj `POST http://127.0.0.1:<port>/infer` z wiadomością z zatwierdzonego treningu oraz oczekiwane 422 dla nieznanego tekstu.
4. Dopiero po tym włącz `RX_BIBI_MODEL_ENABLED=true` na serwerze RX CLOUD, sprawdź prywatny `GET /__rxcloud/model/probe` i przetestuj `Zapytaj model: ...` w zalogowanym czacie.
5. Osobno zatwierdź `RX_BIBI_CLIENT_MODEL_FIRST=true`, jeśli chcesz model jako domyślny. Zachowaj rollback: ustaw flagę `false` i restartuj RX CLOUD.

**Uwaga:** model to klasyfikator tokenowy, nie generatywny LLM. CI sprawdza szablon, a nie stan Twojego hosta. Nie wykonano instalacji ani restartu usług. Jeśli hostem jest Windows, trzeba przygotować inny sposób zarządzania procesem.
