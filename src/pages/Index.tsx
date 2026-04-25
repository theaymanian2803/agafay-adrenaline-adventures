import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import Highlights from "@/components/site/Highlights";
import Tours from "@/components/site/Tours";
import Pricing from "@/components/site/Pricing";
import Testimonials from "@/components/site/Testimonials";
import BookingForm from "@/components/site/BookingForm";
import Footer from "@/components/site/Footer";
import { useSectionVideos } from "@/hooks/useSectionVideos";

const Index = () => {
  const videos = useSectionVideos();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero videoUrl={videos.hero?.video_url} />
      <Highlights videoUrl={videos.highlights?.video_url} />
      <Tours videoUrl={videos.tours?.video_url} />
      <Pricing videoUrl={videos.pricing?.video_url} />
      <Testimonials videoUrl={videos.testimonials?.video_url} />
      <BookingForm videoUrl={videos.booking?.video_url} />
      <Footer videoUrl={videos.footer?.video_url} />
    </main>
  );
};

export default Index;