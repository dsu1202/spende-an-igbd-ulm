import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PresetAmount {
  id: string;
  amount: number;
  sort_order: number;
  is_active: boolean;
}

const PresetAmountsTab = () => {
  const [presets, setPresets] = useState<PresetAmount[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAmount, setNewAmount] = useState("");

  const fetchPresets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("preset_amounts")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      if (error.code === "42P01" || /relation.*does not exist/i.test(error.message)) {
        setTableMissing(true);
      } else {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
      }
      setPresets([]);
    } else {
      setTableMissing(false);
      setPresets(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleAdd = async () => {
    const amount = parseInt(newAmount, 10);
    if (!amount || amount <= 0 || amount > 500) {
      toast({
        title: "Ungültiger Betrag",
        description: "Betrag muss zwischen 1 und 500 liegen.",
        variant: "destructive",
      });
      return;
    }
    const maxOrder = presets.length > 0 ? Math.max(...presets.map((p) => p.sort_order)) : -1;
    const { error } = await supabase.from("preset_amounts").insert({
      amount,
      sort_order: maxOrder + 1,
      is_active: true,
    });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Betrag hinzugefügt" });
    setNewAmount("");
    setDialogOpen(false);
    fetchPresets();
  };

  const handleDelete = async (p: PresetAmount) => {
    if (!confirm(`Betrag ${p.amount} € wirklich löschen?`)) return;
    const { error } = await supabase.from("preset_amounts").delete().eq("id", p.id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Gelöscht" });
    fetchPresets();
  };

  const handleToggleActive = async (p: PresetAmount) => {
    const { error } = await supabase
      .from("preset_amounts")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    fetchPresets();
  };

  const swapOrder = async (a: PresetAmount, b: PresetAmount) => {
    // Swap sort_order between two rows
    const { error: e1 } = await supabase
      .from("preset_amounts")
      .update({ sort_order: b.sort_order })
      .eq("id", a.id);
    const { error: e2 } = await supabase
      .from("preset_amounts")
      .update({ sort_order: a.sort_order })
      .eq("id", b.id);
    if (e1 || e2) {
      toast({
        title: "Fehler beim Sortieren",
        description: (e1 || e2)!.message,
        variant: "destructive",
      });
      return;
    }
    fetchPresets();
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    swapOrder(presets[i], presets[i - 1]);
  };

  const moveDown = (i: number) => {
    if (i === presets.length - 1) return;
    swapOrder(presets[i], presets[i + 1]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (tableMissing) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-8 text-center">
        <p className="text-lg font-semibold text-amber-900 mb-2">
          Datenbank noch nicht eingerichtet
        </p>
        <p className="text-sm text-amber-800 max-w-xl mx-auto">
          Die Tabelle{" "}
          <code className="px-1.5 py-0.5 bg-amber-100 rounded">preset_amounts</code>{" "}
          existiert noch nicht. Bitte das Migrations-SQL in Supabase ausführen.
          Der Kiosk nutzt bis dahin die Standard-Beträge 5 / 10 / 20 / 50 €.
        </p>
        <Button variant="outline" size="sm" onClick={fetchPresets} className="mt-4 gap-2">
          <RefreshCw className="w-4 h-4" />
          Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Voreingestellte Beträge</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Diese Beträge werden auf dem Kiosk zur Auswahl angezeigt (max. 4 nebeneinander).
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Betrag hinzufügen
        </Button>
      </div>

      {presets.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed text-center py-12 text-muted-foreground">
          <p className="text-sm">Keine Beträge konfiguriert</p>
          <p className="text-xs mt-1">
            Der Kiosk nutzt dann die Standard-Beträge 5 / 10 / 20 / 50 €.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {presets.map((p, i) => (
            <div
              key={p.id}
              className={`rounded-xl border bg-card p-4 flex flex-col gap-3 ${
                !p.is_active ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl font-extrabold font-heading text-foreground">
                  {p.amount} €
                </span>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    title="Nach oben"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveDown(i)}
                    disabled={i === presets.length - 1}
                    title="Nach unten"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant={p.is_active ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggleActive(p)}
                  className="text-xs"
                >
                  {p.is_active ? "Aktiv" : "Inaktiv"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(p)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Betrag hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Betrag in Euro (1 – 500)</Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="z.B. 25"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAdd}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PresetAmountsTab;
