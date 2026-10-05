import { db } from "@/lib/db";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Quad = { id: string; name: string; engine_size: number; image_url: string | null; status: string; hourly_rate: number; daily_rate: number; quad_type: string | null; capacity: number; transmission: string | null; short_description: string | null };

const empty = { name: "", engine_size: 450, image_url: "", status: "available", hourly_rate: 0, daily_rate: 0, quad_type: "450cc ATV", capacity: 1, transmission: "Automatic", short_description: "" };

const QuadsTab = () => {
  const [quads, setQuads] = useState<Quad[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Quad | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await db.from("quads").select("*").order("created_at", { ascending: false });
    setQuads((data as Quad[]) || []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (q: Quad) => { setEditing(q); setForm(q); setOpen(true); };


  const save = async () => {
    const payload = {
      name: form.name,
      engine_size: Number(form.engine_size),
      image_url: form.image_url || null,
      status: form.status,
      hourly_rate: Number(form.hourly_rate),
      daily_rate: Number(form.daily_rate),
      quad_type: form.quad_type || null,
      capacity: Number(form.capacity),
      transmission: form.transmission || null,
      short_description: form.short_description || null,
    };
    const { error } = editing
      ? await db.from("quads").update(payload).eq("id", editing.id)
      : await db.from("quads").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Quad updated" : "Quad added");
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this quad?")) return;
    const { error } = await db.from("quads").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Quad deleted"); load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-3xl tracking-wider">Quad Inventory</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="hero" onClick={openNew}><Plus /> Add Quad</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Quad</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Engine (cc)</Label><Input type="number" value={form.engine_size} onChange={(e) => setForm({ ...form, engine_size: e.target.value })} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Hourly rate (€)</Label><Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} /></div>
                <div><Label>Daily rate (€)</Label><Input type="number" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Quad type</Label><Input value={form.quad_type || ""} onChange={(e) => setForm({ ...form, quad_type: e.target.value })} /></div>
                <div><Label>Capacity</Label><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
              </div>
              <div><Label>Transmission</Label><Input value={form.transmission || ""} onChange={(e) => setForm({ ...form, transmission: e.target.value })} /></div>
              <div><Label>Short description</Label><Input value={form.short_description || ""} onChange={(e) => setForm({ ...form, short_description: e.target.value })} /></div>
              <div>
                <Label>Image link</Label>
                <Input placeholder="https://example.com/quad.jpg" value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-24 rounded-md object-cover" />}
              </div>
              <Button variant="hero" className="w-full" onClick={save}>{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Engine</TableHead><TableHead>Status</TableHead><TableHead>Hourly</TableHead><TableHead>Daily</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quads.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No quads yet</TableCell></TableRow>}
            {quads.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.name}</TableCell>
                <TableCell>{q.quad_type || "—"}</TableCell>
                <TableCell>{q.engine_size}cc</TableCell>
                <TableCell><Badge variant={q.status === "available" ? "default" : "secondary"}>{q.status}</Badge></TableCell>
                <TableCell>€{q.hourly_rate}</TableCell>
                <TableCell>€{q.daily_rate}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(q)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default QuadsTab;