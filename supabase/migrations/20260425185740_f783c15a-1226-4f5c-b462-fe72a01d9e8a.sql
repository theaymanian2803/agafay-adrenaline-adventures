CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE IF NOT EXISTS public.section_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  video_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT section_videos_key_length CHECK (char_length(section_key) BETWEEN 1 AND 60),
  CONSTRAINT section_videos_label_length CHECK (char_length(label) BETWEEN 1 AND 80),
  CONSTRAINT section_videos_url_format CHECK (
    video_url IS NULL OR (
      char_length(video_url) <= 1000
      AND video_url ~* '^https?://[^\s<>"'']+\.(mp4|webm)(\?[^\s<>"'']*)?$'
    )
  )
);

ALTER TABLE public.section_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active section videos" ON public.section_videos;
CREATE POLICY "Anyone can view active section videos"
ON public.section_videos
FOR SELECT
USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage section videos" ON public.section_videos;
CREATE POLICY "Admins manage section videos"
ON public.section_videos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_section_videos_updated_at ON public.section_videos;
CREATE TRIGGER update_section_videos_updated_at
BEFORE UPDATE ON public.section_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.section_videos (section_key, label, sort_order)
VALUES
  ('hero', 'Hero', 10),
  ('highlights', 'Highlights', 20),
  ('tours', 'Tours', 30),
  ('pricing', 'Pricing', 40),
  ('testimonials', 'Testimonials', 50),
  ('booking', 'Booking Form', 60),
  ('footer', 'Footer', 70)
ON CONFLICT (section_key) DO NOTHING;