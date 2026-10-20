-- VEXORIO: reviewed chat RLS migration (NOT YET APPLIED).
-- Actual tables verified 2026-10-20: messages.body (not content).
-- Apply only after backup and approval, because these policies affect live DB.
-- Existing policies are permissive: replace them rather than adding overlapping policies.

BEGIN;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- A buyer can only contact the true owner of a listing.
ALTER POLICY "Buyers can start conversations"
ON public.conversations TO authenticated
WITH CHECK (
  buyer_id = (SELECT auth.uid())
  AND seller_id IS NOT NULL
  AND seller_id <> buyer_id
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_id AND l.owner_id = seller_id
  )
);

-- Only conversation participants may view it.
ALTER POLICY "Participants can read conversations"
ON public.conversations TO authenticated
USING (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()));

-- Only participants may read messages.
ALTER POLICY "Participants can read messages"
ON public.messages TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (c.buyer_id = (SELECT auth.uid()) OR c.seller_id = (SELECT auth.uid()))
  )
);

-- A participant can only send as themselves, within length limits.
ALTER POLICY "Participants can send messages"
ON public.messages TO authenticated
WITH CHECK (
  sender_id = (SELECT auth.uid())
  AND length(trim(body)) BETWEEN 1 AND 2000
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (c.buyer_id = (SELECT auth.uid()) OR c.seller_id = (SELECT auth.uid()))
  )
);

-- Optional, after checking for duplicate buyer/listing pairs:
-- CREATE UNIQUE INDEX conversations_unique_buyer_listing
-- ON public.conversations(listing_id, buyer_id);

COMMIT;
