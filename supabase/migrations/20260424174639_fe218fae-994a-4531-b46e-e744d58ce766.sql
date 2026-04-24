
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT
  WITH CHECK (
    char_length(customer_name) BETWEEN 1 AND 120
    AND char_length(customer_email) BETWEEN 5 AND 200
    AND customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND participants BETWEEN 1 AND 30
    AND booking_date >= CURRENT_DATE
  );

DROP POLICY IF EXISTS "Public read quad images" ON storage.objects;
CREATE POLICY "Public read individual quad images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'quad-images' AND name IS NOT NULL AND name <> '');
