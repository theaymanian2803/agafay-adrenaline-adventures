import { db } from "@/lib/db";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Offer = { id: string; title: string; description: string | null; discount_percent: number; starts_at: string; ends_at: string; active: boolean };

const today = () => new Date().toISOString().split("T")[0];
const empty = { title: "", description: "", discount_percent: 10, starts_at: today(), ends_at: today(), active: true };

const OffersTab = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await db.from("offers").select("*").order("created_at", { ascending: false });
    setOffers((data as Offer[]) || []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (o: Offer) => { setEditing(o); setForm(o); setOpen(true); };

  const save = async () => {
    const payload = { ...form, discount_percent: Number(form.discount_percent) };
    const { error } = editing
      ? await db.from("offers").update(payload).eq("id", editing.id)
      : await db.from("offers").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Offer updated" : "Offer created");
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    await db.from("offers").delete().eq("id", id);
    toast.success("Offer deleted"); load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-3xl tracking-wider">Promotional Offers</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="hero" onClick={openNew}><Plus /> New Offer</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Offer</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Discount (%)</Label><Input type="number" min={1} max={100} value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Starts</Label><Input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
                <div><Label>Ends</Label><Input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
              </div>
              <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /></div>
              <Button variant="hero" className="w-full" onClick={save}>{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Title</TableHead><TableHead>Discount</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {offers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No offers yet</TableCell></TableRow>}
            {offers.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.title}</TableCell>
                <TableCell><span className="text-primary font-semibold">{o.discount_percent}%</span></TableCell>
                <TableCell className="text-muted-foreground text-sm">{o.starts_at} → {o.ends_at}</TableCell>
                <TableCell><Badge variant={o.active ? "default" : "secondary"}>{o.active ? "Active" : "Paused"}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(o)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OffersTab;