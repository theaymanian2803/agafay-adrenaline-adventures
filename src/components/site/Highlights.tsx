import { motion } from "framer-motion";
import { Compass, ShieldCheck, Wrench, Sun } from "lucide-react";
import SectionVideo from "@/components/site/SectionVideo";

const items = [
  { icon: Compass, title: "Agafay Oasis", desc: "Cross hidden palm oases and Berber trails most tourists never see." },
  { icon: ShieldCheck, title: "Expert Local Guides", desc: "Certified Marrakech-born guides leading every ride from start to finish." },
  { icon: Wrench, title: "Top-Tier Gear", desc: "Modern fleet — Yamaha, Honda, Polaris — fully serviced helmets & goggles." },
  { icon: Sun, title: "Sunset Trails", desc: "Time your ride with the gold-hour glow over the Atlas Mountains." },
];

const Highlights = ({ videoUrl }: { videoUrl?: string | null }) => (
  <section id="highlights" className="relative py-28">
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="max-w-2xl"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-primary">Why Agafay Quad</span>
        <h2 className="mt-3 font-display text-5xl md:text-7xl leading-none">
          Built for the <span className="text-gradient-primary">desert</span>.
          <br />Tuned for thrill.
        </h2>
      </motion.div>

      <SectionVideo src={videoUrl} label="Highlights" className="mt-12" />

      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="group relative bg-card p-8 transition-colors hover:bg-secondary"
          >
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-gradient-primary group-hover:text-primary-foreground group-hover:shadow-glow">
              <item.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-6 font-display text-3xl">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Highlights;