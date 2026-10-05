import { db } from "@/lib/db";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Mail, MapPin, Phone, Printer, Route, User, Users, Wrench, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/site/Navbar";

type BookingDetailData = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  booking_date: string;
  participants: number;
  status: string;
  notes: string | null;
  route_from: string | null;
  route_to: string | null;
  quad_type: string | null;
  offer_title: string | null;
  discount_percent: number;
  subtotal: number;
  total: number;
  tours: { name: string; duration: string; difficulty: string; price: number; terrain?: string | null } | null;
  quads: { name: string; engine_size: number; quad_type: string | null; capacity?: number | null; transmission?: string | null } | null;
  categories: { name: string } | null;
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
};

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAdminAuth();
  const [booking, setBooking] = useState<BookingDetailData | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  useEffect(() => {
    if (!loading && !session) navigate("/auth");
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!id || !isAdmin) return;
    db
      .from("bookings")
      .select("*, tours(name,duration,difficulty,price,terrain), quads(name,engine_size,quad_type,capacity,transmission), categories(name)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setBooking((data as any) || null);
        setLoadingBooking(false);
      });
  }, [id, isAdmin]);

  if (loading || loadingBooking) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto py-32 text-center">
          <h1 className="font-display text-5xl">Access Denied</h1>
          <p className="mt-3 text-muted-foreground">Reservation details are only available to admins.</p>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto py-32 text-center">
          <h1 className="font-display text-5xl">Reservation not found</h1>
          <Button variant="outlineGlow" className="mt-6" asChild><Link to="/admin">Back to admin</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="container mx-auto py-28 print-summary">
        <div className="no-print flex flex-wrap gap-3">
          <Button variant="outlineGlow" size="sm" asChild><Link to="/admin"><ArrowLeft /> Back to bookings</Link></Button>
          <Button variant="hero" size="sm" onClick={() => window.print()}><Printer /> Print / Save PDF</Button>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end">
          <div>
            <Badge variant={statusVariant[booking.status] || "secondary"} className="uppercase tracking-wider">{booking.status}</Badge>
            <h1 className="mt-5 font-display text-6xl leading-none md:text-8xl">Reservation Details</h1>
            <p className="mt-4 text-muted-foreground">Booking #{booking.id.slice(0, 8).toUpperCase()}</p>
            <p className="mt-2 hidden text-sm text-muted-foreground print:block">Agafay Quad confirmation summary · {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Total</p>
            <div className="font-display text-6xl text-gradient-primary">€{Number(booking.total).toFixed(2)}</div>
            {booking.discount_percent > 0 && <p className="text-sm text-primary">{booking.offer_title} −{booking.discount_percent}%</p>}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-display text-3xl">Customer</h2>
            <div className="mt-5 space-y-3 text-sm">
              <p className="flex items-center gap-3"><User className="h-4 w-4 text-primary" /> {booking.customer_name}</p>
              <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> <a href={`mailto:${booking.customer_email}`} className="hover:text-primary">{booking.customer_email}</a></p>
              <p className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> {booking.customer_phone ? <a href={`tel:${booking.customer_phone}`} className="hover:text-primary">{booking.customer_phone}</a> : "No phone provided"}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <Route className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-display text-3xl">Pickup Route</h2>
            <div className="mt-5 space-y-3 text-sm">
              <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-primary" /> From: {booking.route_from || "Agafay Base"}</p>
              <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-primary" /> To: {booking.route_to || "Desert Trail"}</p>
              <p className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-primary" /> {booking.booking_date}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <Wrench className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-display text-3xl">Quad</h2>
            <div className="mt-5 space-y-3 text-sm">
              <p>{booking.quads?.name || "Any available quad"}</p>
              <p className="text-muted-foreground">Type: {booking.quad_type || booking.quads?.quad_type || "450cc ATV"}</p>
              <p className="text-muted-foreground">Engine: {booking.quads?.engine_size ? `${booking.quads.engine_size}cc` : "TBC"}</p>
              <p className="flex items-center gap-3"><Users className="h-4 w-4 text-primary" /> {booking.participants} rider{booking.participants === 1 ? "" : "s"}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-3xl">Tour Details</h2>
            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <p><span className="text-muted-foreground">Tour:</span> {booking.tours?.name || "—"}</p>
              <p><span className="text-muted-foreground">Category:</span> {booking.categories?.name || "—"}</p>
              <p><span className="text-muted-foreground">Duration:</span> {booking.tours?.duration || "—"}</p>
              <p><span className="text-muted-foreground">Difficulty:</span> {booking.tours?.difficulty || "—"}</p>
            </div>
            {booking.notes && <p className="mt-6 rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">{booking.notes}</p>}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-3xl">Quote</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>€{Number(booking.subtotal).toFixed(2)}</span></div>
              {booking.discount_percent > 0 && <div className="flex justify-between text-primary"><span>{booking.offer_title || "Discount"}</span><span>−{booking.discount_percent}%</span></div>}
              <div className="flex justify-between border-t border-border pt-3 font-semibold"><span>Total</span><span>€{Number(booking.total).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default BookingDetail;