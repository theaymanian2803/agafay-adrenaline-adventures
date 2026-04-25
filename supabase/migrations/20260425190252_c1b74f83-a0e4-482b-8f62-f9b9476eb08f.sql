CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_length CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT categories_description_length CHECK (description IS NULL OR char_length(description) <= 500)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories"
ON public.categories
FOR SELECT
USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quad_type TEXT,
  ADD COLUMN IF NOT EXISTS route_from TEXT,
  ADD COLUMN IF NOT EXISTS route_to TEXT,
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS terrain TEXT,
  ADD COLUMN IF NOT EXISTS included_items TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.quads
  ADD COLUMN IF NOT EXISTS quad_type TEXT,
  ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS transmission TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS route_from TEXT,
  ADD COLUMN IF NOT EXISTS route_to TEXT,
  ADD COLUMN IF NOT EXISTS quad_type TEXT;

INSERT INTO public.categories (name, slug, description, sort_order)
VALUES
  ('Sunset Rides', 'sunset-rides', 'Golden-hour quad routes across Agafay desert viewpoints.', 10),
  ('Family Friendly', 'family-friendly', 'Accessible quad experiences with calmer routes and guide support.', 20),
  ('Extreme Adventure', 'extreme-adventure', 'Higher-adrenaline routes with rocky tracks and longer distances.', 30)
ON CONFLICT (slug) DO NOTHING;