import { motion } from "framer-motion";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const reviews = [
  { name: "Sofia L.", country: "Madrid, Spain", text: "Best part of our Marrakech trip. The sunset over Agafay from a quad — life-changing.", rating: 5 },
  { name: "James W.", country: "London, UK", text: "Top-tier bikes, professional guides, and the tea stop in the desert was unreal.", rating: 5 },
  { name: "Amina R.", country: "Paris, France", text: "Family-friendly but still seriously fun. Our guide Hassan made it unforgettable.", rating: 5 },
  { name: "Chris D.", country: "Berlin, Germany", text: "Atlas tour was brutal in the best way. Worth every euro. Will be back.", rating: 5 },
  { name: "Yuki T.", country: "Tokyo, Japan", text: "Photos they sent us afterwards were incredible. Whole experience felt premium.", rating: 5 },
];

const Testimonials = () => (
  <section id="reviews" className="relative py-28 bg-secondary/30">
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-primary">Riders Speak</span>
        <h2 className="mt-3 font-display text-5xl md:text-7xl leading-none">
          1,200+ <span className="text-gradient-primary">5-star</span> reviews.
        </h2>
      </motion.div>

      <div className="mt-16">
        <Carousel opts={{ loop: true, align: "start" }} className="w-full">
          <CarouselContent className="-ml-4">
            {reviews.map((r, i) => (
              <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="h-full rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/40">
                  <div className="flex gap-0.5 text-primary">
                    {Array.from({ length: r.rating }).map((_, k) => (
                      <Star key={k} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-base leading-relaxed">"{r.text}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-primary font-display text-xl text-primary-foreground">
                      {r.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.country}</div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </div>
  </section>
);

export default Testimonials;