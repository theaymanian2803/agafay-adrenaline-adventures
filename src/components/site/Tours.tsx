import { motion } from "framer-motion";
import { Clock, Gauge, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SectionVideo from "@/components/site/SectionVideo";
import sunset from "@/assets/tour-sunset.jpg";
import palmeraie from "@/assets/tour-palmeraie.jpg";
import atlas from "@/assets/tour-atlas.jpg";

const fallback = [
  { id: "1", name: "Agafay Sunset Drive", description: "Chase the golden hour across stone-desert dunes.", duration: "2 hours", difficulty: "easy", price: 55, image_url: sunset },
  { id: "2", name: "Extreme Palmeraie Track", description: "Punch through palm groves at full throttle.", duration: "3 hours", difficulty: "moderate", price: 85, image_url: palmeraie },
  { id: "3", name: "Atlas Mountain Footprints", description: "Ride to the foothills of the Atlas — rocky panoramic views.", duration: "Half day", difficulty: "extreme", price: 140, image_url: atlas },
];

const imgFor = (url: string | null) => {
  if (!url) return sunset;
  if (url.includes("sunset")) return sunset;
  if (url.includes("palmeraie")) return palmeraie;
  if (url.includes("atlas")) return atlas;
  return url;
};

const difficultyColor: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  moderate: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  extreme: "bg-primary/15 text-primary border-primary/40",
};

const Tours = ({ videoUrl }: { videoUrl?: string | null }) => {
  const [tours, setTours] = useState(fallback);

  useEffect(() => {
    supabase.from("tours").select("*").eq("active", true).order("price", { ascending: true })
      .then(({ data }) => {
        if (data && data.length) setTours(data as any);
      });
  }, []);

  return (
    <section id="tours" className="relative py-28">
      <div className="container mx-auto">
        <div className="flex flex-col items-end justify-between gap-6 md:flex-row md:items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-primary">Our Tours</span>
            <h2 className="mt-3 font-display text-5xl md:text-7xl leading-none">
              Pick your <span className="text-gradient-primary">trail</span>.
            </h2>
          </motion.div>
          <p className="max-w-md text-muted-foreground">
            Three signature routes through Agafay, Palmeraie and the Atlas — each
            with its own rhythm, terrain and adrenaline.
          </p>
        </div>

        <SectionVideo src={videoUrl} label="Tours" className="mt-12" />

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tours.map((t, i) => (
            <motion.article
              key={t.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:border-primary/40 hover:shadow-glow"
            >
              <div className="relative h-72 overflow-hidden">
                <img
                  src={imgFor(t.image_url)}
                  alt={t.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <Badge className={`absolute left-4 top-4 border uppercase tracking-wider ${difficultyColor[t.difficulty]}`}>
                  {t.difficulty}
                </Badge>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 text-xs uppercase tracking-wider text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{t.duration}</span>
                  <span className="inline-flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" />Guided</span>
                </div>
                <h3 className="mt-3 font-display text-3xl">{t.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{t.description}</p>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">From</span>
                    <div className="font-display text-3xl text-gradient-primary">€{Number(t.price).toFixed(0)}</div>
                  </div>
                  <Button variant="outlineGlow" size="sm" asChild><Link to={`/tours/${t.id}`}>View Details <ArrowUpRight /></Link></Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Tours;