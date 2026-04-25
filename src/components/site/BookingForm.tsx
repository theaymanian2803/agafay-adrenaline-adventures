import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Tag, Sparkles } from "lucide-react";
import SectionVideo from "@/components/site/SectionVideo";

type Tour = { id: string; name: string; price: number };
type Quad = { id: string; name: string };
type Offer = { id: string; title: string; description: string | null; discount_percent: number; starts_at: string; ends_at: string };

const NO_OFFER = "__none__";

const schema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_email: z.string().trim().email().max(200),
  customer_phone: z.string().trim().max(40).optional(),
  booking_date: z.string().refine((v) => v && new Date(v) >= new Date(new Date().toDateString()), "Pick a future date"),
  tour_id: z.string().uuid().optional(),
  quad_id: z.string().uuid().optional(),
  participants: z.coerce.number().int().min(1).max(30),
  notes: z.string().max(500).optional(),
});

const BookingForm = ({ videoUrl }: { videoUrl?: string | null }) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [quads, setQuads] = useState<Quad[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [offerId, setOfferId] = useState<string>(NO_OFFER);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    booking_date: "",
    tour_id: undefined as string | undefined,
    quad_id: undefined as string | undefined,
    participants: 2,
    notes: "",
  });

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    supabase.from("tours").select("id,name,price").eq("active", true)
      .then(({ data }) => setTours((data as Tour[]) || []));
    supabase.from("quads").select("id,name").eq("status", "available")
      .then(({ data }) => setQuads((data as Quad[]) || []));
    supabase
      .from("offers")
      .select("id,title,description,discount_percent,starts_at,ends_at")
      .eq("active", true)
      .lte("starts_at", today)
      .gte("ends_at", today)
      .order("discount_percent", { ascending: false })
      .then(({ data }) => setOffers((data as Offer[]) || []));
  }, []);

  // Auto-apply best offer on first load (only if user hasn't picked one)
  useEffect(() => {
    if (offers.length > 0 && offerId === NO_OFFER) {
      setOfferId(offers[0].id);
    }
  }, [offers, offerId]);

  const selectedTour = useMemo(
    () => tours.find((t) => t.id === form.tour_id) || null,
    [tours, form.tour_id]
  );
  const selectedOffer = useMemo(
    () => offers.find((o) => o.id === offerId) || null,
    [offers, offerId]
  );

  const tourPrice = selectedTour ? Number(selectedTour.price) : 0;
  const subtotal = tourPrice * form.participants;
  const discountPercent = selectedOffer?.discount_percent ?? 0;
  const discountAmount = +(subtotal * discountPercent / 100).toFixed(2);
  const total = +(subtotal - discountAmount).toFixed(2);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please check your inputs");
      return;
    }
    if (!form.tour_id) {
      toast.error("Please select a tour");
      return;
    }
    setSubmitting(true);
    const payload: any = {
      ...parsed.data,
      offer_id: selectedOffer?.id ?? null,
      offer_title: selectedOffer?.title ?? null,
      discount_percent: discountPercent,
      subtotal,
      total,
    };
    if (!payload.tour_id) delete payload.tour_id;
    if (!payload.quad_id) delete payload.quad_id;
    const { error } = await supabase.from("bookings").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit booking. Please try again.");
      return;
    }
    toast.success(
      selectedOffer
        ? `Booking received! ${discountPercent}% off applied — total €${total.toFixed(2)}.`
        : "Booking received! We'll be in touch within 24h."
    );
    setForm({ ...form, customer_name: "", customer_email: "", customer_phone: "", notes: "", booking_date: "" });
  };

  return (
    <section id="book" className="relative py-28">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid gap-12 lg:grid-cols-2 lg:items-center"
        >
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-primary">Book your ride</span>
            <h2 className="mt-3 font-display text-5xl md:text-7xl leading-none">
              Ready to <span className="text-gradient-primary">ride</span>?
            </h2>
            <p className="mt-6 max-w-md text-muted-foreground">
              Reserve your spot in 60 seconds. We'll confirm your booking by
              email within a day. Hotel pickup available in Marrakech.
            </p>

            {offers.length > 0 && (
              <div className="mt-8 space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] text-primary inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> Active promos
                </span>
                <ul className="space-y-2">
                  {offers.map((o) => (
                    <li key={o.id} className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                      <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <div>
                        <div className="font-semibold">
                          {o.title} <span className="text-primary">— {o.discount_percent}% off</span>
                        </div>
                        {o.description && <div className="text-xs text-muted-foreground">{o.description}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <SectionVideo src={videoUrl} label="Booking" className="mt-8" />
          </div>

          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" min={new Date().toISOString().split("T")[0]} value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="participants">Riders</Label>
                <Input id="participants" type="number" min={1} max={30} value={form.participants} onChange={(e) => setForm({ ...form, participants: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Tour</Label>
                <Select value={form.tour_id} onValueChange={(v) => setForm({ ...form, tour_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a tour" /></SelectTrigger>
                  <SelectContent>
                    {tours.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — €{Number(t.price).toFixed(0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quad (optional)</Label>
                <Select value={form.quad_id} onValueChange={(v) => setForm({ ...form, quad_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Any available" /></SelectTrigger>
                  <SelectContent>
                    {quads.map((q) => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Promo code</Label>
                <Select value={offerId} onValueChange={setOfferId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No promo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_OFFER}>No promo</SelectItem>
                    {offers.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.title} — {o.discount_percent}% off
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} />
              </div>
            </div>

            {/* Live quote */}
            <div className="mt-6 rounded-xl border border-border bg-background/40 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedTour ? `${selectedTour.name} × ${form.participants}` : "Select a tour to see pricing"}
                </span>
                <span className="tabular-nums">€{subtotal.toFixed(2)}</span>
              </div>
              {selectedOffer && discountAmount > 0 && (
                <div className="mt-2 flex items-center justify-between text-sm text-primary">
                  <span className="inline-flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> {selectedOffer.title} ({discountPercent}%)
                  </span>
                  <span className="tabular-nums">−€{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
                <span className="font-display text-3xl text-gradient-primary tabular-nums">€{total.toFixed(2)}</span>
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="mt-6 w-full" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : "Confirm booking"}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default BookingForm;