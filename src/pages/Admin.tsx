import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DonationPurpose {
  id: string;
  title_de: string;
  title_bs: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const Admin = () => {
  const [purposes, setPurposes] = useState<DonationPurpose[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DonationPurpose | null>(null);
  const [titleDe, setTitleDe] = useState("");
  const [titleBs, setTitleBs] = useState("");

  const fetchPurposes = async () => {
    const { data, error } = await supabase
      .from("donation_purposes")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      setPurposes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPurposes();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setTitleDe("");
    setTitleBs("");
    setDialogOpen(true);
  };

  const openEdit = (p: DonationPurpose) => {
    setEditing(p);
    setTitleDe(p.title_de);
    setTitleBs(p.title_bs);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!titleDe.trim() || !titleBs.trim()) {
      toast({ title: "Bitte beide Titel ausfüllen", variant: "destructive" });
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("donation_purposes")
        .update({ title_de: titleDe.trim(), title_bs: titleBs.trim() })
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Spendenaktion aktualisiert" });
    } else {
      const maxOrder = purposes.length > 0 ? Math.max(...purposes.map((p) => p.sort_order)) + 1 : 0;
      const { error } = await supabase
        .from("donation_purposes")
        .insert({ title_de: titleDe.trim(), title_bs: titleBs.trim(), sort_order: maxOrder });
      if (error) {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Spendenaktion erstellt" });
    }

    setDialogOpen(false);
    fetchPurposes();
  };

  const handleToggleActive = async (p: DonationPurpose) => {
    const { error } = await supabase
      .from("donation_purposes")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    fetchPurposes();
  };

  const handleDelete = async (p: DonationPurpose) => {
    if (!confirm(`"${p.title_de}" wirklich löschen?`)) return;
    const { error } = await supabase
      .from("donation_purposes")
      .delete()
      .eq("id", p.id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Gelöscht" });
    fetchPurposes();
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Spendenaktionen verwalten</h1>
            <p className="text-muted-foreground mt-1">Erstelle und verwalte die Spendemöglichkeiten für den Kiosk</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Neue Aktion
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Laden...</p>
        ) : purposes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Noch keine Spendenaktionen vorhanden</p>
            <p className="mt-1">Erstelle die erste Aktion mit dem Button oben</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel (DE)</TableHead>
                  <TableHead>Titel (BS)</TableHead>
                  <TableHead className="text-center">Aktiv</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purposes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title_de}</TableCell>
                    <TableCell>{p.title_bs}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={() => handleToggleActive(p)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(p.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Aktion bearbeiten" : "Neue Spendenaktion"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Titel (Deutsch)</Label>
                <Input
                  value={titleDe}
                  onChange={(e) => setTitleDe(e.target.value)}
                  placeholder="z.B. Spende an die Moschee"
                />
              </div>
              <div className="space-y-2">
                <Label>Titel (Bosnisch)</Label>
                <Input
                  value={titleBs}
                  onChange={(e) => setTitleBs(e.target.value)}
                  placeholder="z.B. Sadaka za džamiju"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                {editing ? "Speichern" : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
