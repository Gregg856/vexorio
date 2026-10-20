-- VEXORIO — projekt zasad bezpieczeństwa czatu.
-- NIE uruchamiać bez sprawdzenia struktury tabel i istniejących polityk w Supabase.
-- Wymagane: public.conversations(id, listing_id, buyer_id uuid, seller_id uuid),
-- public.messages(id, conversation_id, sender_id uuid, content, created_at),
-- public.listings(id, owner_id uuid).
-- Sprawdź istniejące duplikaty przed dodaniem unikalnego indeksu.
-- Uruchamiaj w kontrolowanym środowisku testowym po wykonaniu kopii zapasowej.

BEGIN;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Usuń lub skoryguj stare, zbyt szerokie polityki ręcznie.
-- Samo dodanie poniższych zasad NIE odbierze dostępu nadanego
-- przez istniejące permissive policies.
CREATE POLICY "vexorio_chat_participants_read_conversations"
ON public.conversations FOR SELECT TO authenticated
USING (buyer_id = (select auth.uid()) OR seller_id = (select auth.uid()));

CREATE POLICY "vexorio_chat_buyer_starts_conversation"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (
 buyer_id = (select auth.uid())
 AND seller_id <> (select auth.uid())
 AND EXISTS (
  SELECT 1 FROM public.listings l
  WHERE l.id = listing_id AND l.owner_id = seller_id
 )
);

CREATE POLICY "vexorio_chat_participants_read_messages"
ON public.messages FOR SELECT TO authenticated
USING (
 EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id
  AND (c.buyer_id = (select auth.uid()) OR c.seller_id = (select auth.uid()))
 )
);

CREATE POLICY "vexorio_chat_participants_send_messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
 sender_id = (select auth.uid())
 AND length(trim(body)) BETWEEN 1 AND 2000
 AND EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id
  AND (c.buyer_id = (select auth.uid()) OR c.seller_id = (select auth.uid()))
 )
);

-- Indeks dodaj dopiero po usunięciu ewentualnych duplikatów.
-- CREATE UNIQUE INDEX conversations_unique_buyer_listing
-- ON public.conversations(listing_id, buyer_id);

COMMIT;
