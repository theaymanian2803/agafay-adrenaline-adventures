import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain } from "lucide-react";

const Navbar = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-primary text-primary-foreground">
            <Mountain className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl tracking-wider">AGAFAY QUAD</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-wider text-muted-foreground">
          <button onClick={() => scrollTo("tours")} className="hover:text-foreground transition-colors">Tours</button>
          <button onClick={() => scrollTo("highlights")} className="hover:text-foreground transition-colors">Why Us</button>
          <button onClick={() => scrollTo("pricing")} className="hover:text-foreground transition-colors">Pricing</button>
          <button onClick={() => scrollTo("reviews")} className="hover:text-foreground transition-colors">Reviews</button>
        </nav>
        <Button variant="hero" size="sm" onClick={() => scrollTo("book")}>Book Now</Button>
      </div>
    </header>
  );
};

export default Navbar;