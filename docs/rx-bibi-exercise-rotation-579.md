# RX BIBI #579 — ćwiczenia wybierane z błędów

Nowy moduł `rx-bibi-exercise-rotation.cjs` wykorzystuje wynik oceny z #576, by wybrać wyłącznie niepoprawne przypadki kontrolne. `markCompleted(file,id)` zapisuje lokalną historię wykonanych ćwiczeń, a `readHistory(file)` odtwarza ją po restarcie. To osobny zapis od danych modelu; nie wymaga nowego panelu ani serwera.

Zaznaczenie ćwiczenia jako wykonanego **nie** oznacza, że model nauczył się odpowiedzi. Ocenę jakości należy powtórzyć po zatwierdzonym treningu przez bramkę #578. Historia jest lokalna i nie jest jeszcze współdzielona między serwerami. Nie ma automatycznego treningu z prywatnych rozmów ani wdrożenia produkcyjnego.
