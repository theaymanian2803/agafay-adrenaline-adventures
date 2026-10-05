import { db } from "@/lib/db";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Gauge, MapPin, Mountain, Route, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import sunset from "@/assets/tour-sunset.jpg";

type TourDetailData = {
  id: string; name: string; description: string | null; duration: string; difficulty: string; price: number; image_url: string | null;
  quad_type: string | null; route_from: string | null; route_to: string | null; distance_km: number | null; terrain: string | null; included_items: string[] | null;
  categories: { name: string; description: string | null } | null;
};

const TourDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState<TourDetailData | null>(null);

  useEffect(() => {
    if (!id) return;
    db
      .from("tours")
      .select("*, categories(name, description)")
      .eq("id", id)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => setTour((data as any) || null));
  }, [id]);

  if (!tour) {
    return <main className="min-h-screen bg-background text-foreground"><Navbar /><div className="container mx-auto py-32 text-center text-muted-foreground">Loading tour details...</div></main>;
  }

  const book = () => {
    navigate("/");
    setTimeout(() => document.getElementById("book")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative min-h-[78vh] overflow-hidden pt-24">
        <img src={tour.image_url || sunset} alt={tour.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="container relative z-10 mx-auto flex min-h-[70vh] items-end pb-16">
          <div className="max-w-4xl">
            <Button variant="outlineGlow" size="sm" asChild><Link to="/"><ArrowLeft /> Back</Link></Button>
            <div className="mt-8 flex flex-wrap gap-3">
              {tour.categories?.name && <Badge className="border-primary/40 bg-primary/15 text-primary">{tour.categories.name}</Badge>}
              <Badge variant="secondary">{tour.difficulty}</Badge>
            </div>
            <h1 className="mt-5 font-display text-6xl leading-none md:text-8xl">{tour.name}</h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{tour.description}</p>
            <Button variant="hero" size="xl" className="mt-8" onClick={book}>Book this ride <ArrowRight /></Button>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-6"><MapPin className="h-5 w-5 text-primary" /><p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">From / To</p><h2 className="mt-1 font-display text-3xl">{tour.route_from || "Agafay Base"} → {tour.route_to || "Desert Trail"}</h2></div>
          <div className="rounded-2xl border border-border bg-card p-6"><Mountain className="h-5 w-5 text-primary" /><p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Quad Type</p><h2 className="mt-1 font-display text-3xl">{tour.quad_type || "450cc ATV"}</h2></div>
          <div className="rounded-2xl border border-border bg-card p-6"><Route className="h-5 w-5 text-primary" /><p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Distance</p><h2 className="mt-1 font-display text-3xl">{tour.distance_km ? `${tour.distance_km} km` : tour.duration}</h2></div>
          <div className="rounded-2xl border border-border bg-card p-6"><Gauge className="h-5 w-5 text-primary" /><p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Terrain</p><h2 className="mt-1 font-display text-3xl">{tour.terrain || "Stone desert"}</h2></div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto grid gap-10 lg:grid-cols-[1fr_420px]">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-primary">Included</span>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(tour.included_items?.length ? tour.included_items : ["Helmet & goggles", "Local guide", "Safety briefing", "Photo stop"]).map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"><ShieldCheck className="h-5 w-5 text-primary" /> {item}</div>
              ))}
            </div>
          </div>
          <aside className="rounded-2xl border border-primary/30 bg-card p-8 shadow-glow">
            <Users className="h-6 w-6 text-primary" />
            <p className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">Starting from</p>
            <div className="font-display text-7xl text-gradient-primary">€{Number(tour.price).toFixed(0)}</div>
            <Button variant="hero" size="lg" className="mt-8 w-full" onClick={book}>Reserve now</Button>
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default TourDetail;