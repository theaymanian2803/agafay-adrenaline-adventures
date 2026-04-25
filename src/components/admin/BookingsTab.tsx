import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Booking = {
  id: string; customer_name: string; customer_email: string; customer_phone: string | null;
  booking_date: string; participants: number; status: string; created_at: string;
  tour_id: string | null; quad_id: string | null;
  route_from: string | null; route_to: string | null; quad_type: string | null;
  offer_title: string | null; discount_percent: number; subtotal: number; total: number;
  tours: { name: string } | null; quads: { name: string } | null;
};

const statusVariant: Record<string, any> = {
  pending: "secondary", confirmed: "default", cancelled: "destructive", completed: "outline",
};

const BookingsTab = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*, tours(name), quads(name)")
      .order("booking_date", { ascending: false });
    setBookings((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status updated"); load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-3xl tracking-wider">Booking Requests</h2>
        <span className="text-sm text-muted-foreground">{bookings.length} total</span>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Tour</TableHead><TableHead>Route</TableHead><TableHead>Quad</TableHead><TableHead>Riders</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {bookings.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No bookings yet</TableCell></TableRow>}
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <div className="font-medium">{b.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{b.customer_email}</div>
                </TableCell>
                <TableCell>{b.booking_date}</TableCell>
                <TableCell>{b.tours?.name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{b.route_from || "—"} → {b.route_to || "—"}</TableCell>
                <TableCell>
                  <div>{b.quads?.name || "Any"}</div>
                  {b.quad_type && <div className="text-xs text-muted-foreground">{b.quad_type}</div>}
                </TableCell>
                <TableCell>{b.participants}</TableCell>
                <TableCell>
                  <div className="font-semibold tabular-nums">€{Number(b.total).toFixed(2)}</div>
                  {b.discount_percent > 0 && (
                    <div className="text-xs text-primary">
                      {b.offer_title} −{b.discount_percent}%
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BookingsTab;