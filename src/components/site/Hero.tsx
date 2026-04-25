import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroImg from "@/assets/hero-agafay.jpg";

type HeroProps = {
  videoUrl?: string | null;
};

const Hero = ({ videoUrl }: HeroProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section ref={ref} className="relative h-[100svh] w-full overflow-hidden">
      {/* Parallax background */}
      <motion.div style={{ y, scale }} className="absolute inset-0">
        {videoUrl ? (
          <video src={videoUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" aria-label="Agafay quad hero video" />
        ) : (
          <img
            src={heroImg}
            alt="Quad ATV crossing the orange dunes of the Agafay desert near Marrakech at sunset"
            width={1920}
            height={1080}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-dune" />
      </motion.div>

      {/* Content */}
      <motion.div style={{ opacity }} className="relative z-10 flex h-full items-end pb-20 md:items-center md:pb-0">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-primary backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Agafay Desert · Marrakech
            </span>

            <h1 className="mt-6 font-display text-6xl leading-[0.9] sm:text-7xl md:text-[8rem] lg:text-[10rem]">
              CONQUER THE
              <br />
              <span className="text-gradient-primary">AGAFAY DESERT</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
              Marrakech's premier quad experience. Roar across stone-desert
              dunes, palm groves and Atlas foothills with expert local guides.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button variant="hero" size="xl" onClick={() => scrollTo("book")}>
                Book Your Ride <ArrowRight />
              </Button>
              <Button variant="outlineGlow" size="xl" onClick={() => scrollTo("tours")}>
                <Play /> Explore Tours
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-muted-foreground"
      >
        Scroll · Discover
      </motion.div>
    </section>
  );
};

export default Hero;