import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import Highlights from "@/components/site/Highlights";
import Tours from "@/components/site/Tours";
import Pricing from "@/components/site/Pricing";
import Testimonials from "@/components/site/Testimonials";
import BookingForm from "@/components/site/BookingForm";
import Footer from "@/components/site/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Highlights />
      <Tours />
      <Pricing />
      <Testimonials />
      <BookingForm />
      <Footer />
    </main>
  );
};

export default Index;