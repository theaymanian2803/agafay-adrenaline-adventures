import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionVideo from "@/components/site/SectionVideo";

const tiers = [
  {
    name: "Hourly",
    price: 45,
    unit: "/ hour",
    desc: "Perfect for a quick adrenaline fix.",
    features: ["1 hour ride", "Helmet & goggles", "Safety briefing", "Photo spot stop"],
  },
  {
    name: "Half-Day",
    price: 120,
    unit: "/ rider",
    desc: "Our most-booked experience. Includes Berber tea.",
    features: ["3-hour guided ride", "Full safety gear", "Traditional Moroccan tea break", "Hotel pickup in Marrakech", "Pro photos included"],
    featured: true,
  },
  {
    name: "Full-Day",
    price: 220,
    unit: "/ rider",
    desc: "Full Agafay + Atlas experience. Lunch included.",
    features: ["6-hour epic ride", "Full safety gear", "Berber lunch in the desert", "Hotel pickup & drop-off", "Pro photos & video", "Sunset finale"],
  },
];

const Pricing = ({ videoUrl }: { videoUrl?: string | null }) => (
  <section id="pricing" className="relative py-28">
    <div className="absolute inset-0 bg-gradient-dune opacity-50" />
    <div className="container mx-auto relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-primary">Pricing</span>
        <h2 className="mt-3 font-display text-5xl md:text-7xl leading-none">
          Simple. Honest. <span className="text-gradient-primary">Thrilling.</span>
        </h2>
      </motion.div>

      <SectionVideo src={videoUrl} label="Pricing" className="mt-12" />

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: i * 0.12 }}
            className={`relative rounded-2xl border p-8 ${
              tier.featured
                ? "border-primary/60 bg-card shadow-glow scale-[1.02]"
                : "border-border bg-card/60"
            }`}
          >
            {tier.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                Most Popular
              </span>
            )}
            <h3 className="font-display text-3xl uppercase tracking-wider">{tier.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{tier.desc}</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-6xl text-gradient-primary">€{tier.price}</span>
              <span className="text-sm text-muted-foreground">{tier.unit}</span>
            </div>
            <ul className="mt-8 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant={tier.featured ? "hero" : "outlineGlow"}
              className="mt-8 w-full"
              onClick={() => document.getElementById("book")?.scrollIntoView({ behavior: "smooth" })}
            >
              Book {tier.name}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Pricing;