-- V7 Ironclad Seal — Row-Level Security (PostgreSQL / Supabase)
-- Apply after `profiles`, `bookings`, and `merchant_wallets` exist and reference `auth.users`.
-- Adjust column names if your schema uses snake_case mirrors of Prisma (`user_id` vs `userId`).

-- —— profiles ——
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Optional: block direct INSERT/DELETE from clients (use service role or signup trigger only).
DROP POLICY IF EXISTS profiles_insert_service ON public.profiles;
-- Uncomment if inserts are server-only:
-- CREATE POLICY profiles_insert_service ON public.profiles FOR INSERT TO authenticated WITH CHECK (false);

-- —— bookings ——
-- Expects `user_id` (booker) and `merchant_id` (merchant user id). If you only store `business_id`,
-- replace `merchant_id` with a subquery on `businesses.owner_id` (see commented variant below).

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bookings_select_parties ON public.bookings;
CREATE POLICY bookings_select_parties
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR merchant_id = auth.uid()
  );

/*
-- Variant when `merchant_id` is not denormalized (join through business):
CREATE POLICY bookings_select_parties
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = bookings.business_id
        AND b.owner_id = auth.uid()
    )
  );
*/

-- Bookers may create rows for themselves; state transitions (capture, complete) should use **service role** or Edge Functions.
DROP POLICY IF EXISTS bookings_insert_booker ON public.bookings;
CREATE POLICY bookings_insert_booker
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS bookings_no_direct_update ON public.bookings;
CREATE POLICY bookings_no_direct_update
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS bookings_no_direct_delete ON public.bookings;
CREATE POLICY bookings_no_direct_delete
  ON public.bookings
  FOR DELETE
  TO authenticated
  USING (false);

-- —— merchant_wallets ——
-- Merchant may **read** their row; **no** direct UPDATE/INSERT/DELETE from the app (treasury updates via webhook Edge Function).

ALTER TABLE public.merchant_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS merchant_wallets_select_own ON public.merchant_wallets;
CREATE POLICY merchant_wallets_select_own
  ON public.merchant_wallets
  FOR SELECT
  TO authenticated
  USING (merchant_id = auth.uid());

DROP POLICY IF EXISTS merchant_wallets_no_insert ON public.merchant_wallets;
CREATE POLICY merchant_wallets_no_insert
  ON public.merchant_wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS merchant_wallets_no_update ON public.merchant_wallets;
CREATE POLICY merchant_wallets_no_update
  ON public.merchant_wallets
  FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS merchant_wallets_no_delete ON public.merchant_wallets;
CREATE POLICY merchant_wallets_no_delete
  ON public.merchant_wallets
  FOR DELETE
  TO authenticated
  USING (false);
