import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin, Mountain } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-background">
    <div className="container mx-auto py-16">
      <div className="grid gap-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-primary text-primary-foreground">
              <Mountain className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl tracking-wider">AGAFAY QUAD</span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Premium quad biking in the Agafay desert. Marrakech, Morocco.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="#" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary"><Facebook className="h-4 w-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-xl tracking-wider">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" /> Agafay Desert, Marrakech</li>
            <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 text-primary" /> +212 524 000 000</li>
            <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 text-primary" /> hello@agafayquad.ma</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-xl tracking-wider">Tours</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><a href="#tours" className="hover:text-primary">Sunset Drive</a></li>
            <li><a href="#tours" className="hover:text-primary">Palmeraie Track</a></li>
            <li><a href="#tours" className="hover:text-primary">Atlas Footprints</a></li>
            <li><a href="#pricing" className="hover:text-primary">Pricing</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-xl tracking-wider">Find Us</h4>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <iframe
              title="Agafay Desert location"
              src="https://www.google.com/maps?q=Agafay+Desert,+Marrakech&output=embed"
              loading="lazy"
              className="h-40 w-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Agafay Quad. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Terms</a>
          <a href="#" className="hover:text-primary">Privacy</a>
          <Link to="/admin" className="hover:text-primary">Admin</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;