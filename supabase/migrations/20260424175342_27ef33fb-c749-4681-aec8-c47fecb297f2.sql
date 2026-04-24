
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS offer_title TEXT,
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT
  WITH CHECK (
    char_length(customer_name) BETWEEN 1 AND 120
    AND char_length(customer_email) BETWEEN 5 AND 200
    AND customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND participants BETWEEN 1 AND 30
    AND booking_date >= CURRENT_DATE
    AND discount_percent BETWEEN 0 AND 100
    AND subtotal >= 0
    AND total >= 0
  );
