# RX BIBI #586 — diagnostyka hosta

Uruchom `node deploy/rx-bibi-host-readiness.cjs` na własnym serwerze z Node 22+. Skrypt tylko odczytuje platformę, konfigurację portu, poprawność treningu i flagi. Nie wypisuje sekretów ani ścieżek, nie zmienia produkcji. Wynik GitHub Actions dotyczy runnera CI, nie prywatnego serwera. Zajęty port może oznaczać działający model — wtedy należy użyć prywatnego `/__rxcloud/model/probe`. Nie przesyłaj tokenów ani prywatnych danych do czatu.
