import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PresetAmount {
  id: string;
  amount: number;
  sort_order: number;
  is_active: boolean;
}

const PresetAmountsTab = () => {
  const [presets, setPresets] = useState<PresetAmount[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  const fetchPresets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("preset_amounts")
      .select("*")
      .order("sort_order", { ascending: true })
      .limit(4);
    if (error) {
      if (error.code === "42P01" || /relation.*does not exist/i.test(error.message)) {
        setTableMissing(true);
      } else {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
      }
      setPresets([]);
    } else {
      setTableMissing(false);
      const rows = data || [];
      setPresets(rows);
      // Initialise edit values from DB
      const vals: Record<string, string> = {};
      rows.forEach((p) => { vals[p.id] = String(p.amount); });
      setEditValues(vals);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleSave = async (p: PresetAmount) => {
    const raw = editValues[p.id] ?? "";
    const amount = parseInt(raw, 10);
    if (!amount || amount <= 0 || amount > 500) {
      toast({
        title: "Ungültiger Betrag",
        description: "Betrag muss zwischen 1 und 500 liegen.",
        variant: "destructive",
      });
      return;
    }
    setSaving((s) => ({ ...s, [p.id]: true }));
    const { error } = await supabase
      .from("preset_amounts")
      .update({ amount })
      .eq("id", p.id);
    setSaving((s) => ({ ...s, [p.id]: false }));
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Betrag auf ${amount} € aktualisiert` });
    fetchPresets();
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
      <div>
        <h2 className="text-lg font-semibold text-foreground">Voreingestellte Beträge</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Betrag anpassen und auf Speichern klicken. Die vier Felder erscheinen in dieser Reihenfolge auf dem Kiosk.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {presets.map((p, i) => (
          <div key={p.id} className="rounded-xl border bg-card p-5 flex flex-col gap-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Betrag {i + 1}
            </p>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={500}
                value={editValues[p.id] ?? ""}
                onChange={(e) =>
                  setEditValues((v) => ({ ...v, [p.id]: e.target.value }))
                }
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(p); }}
                className="text-2xl font-extrabold font-heading h-12 text-center"
              />
              <span className="text-xl font-bold text-muted-foreground">€</span>
            </div>

            <Button
              size="sm"
              className="w-full gap-2"
              disabled={saving[p.id] || editValues[p.id] === String(p.amount)}
              onClick={() => handleSave(p)}
            >
              {saving[p.id] ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              Speichern
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PresetAmountsTab;
