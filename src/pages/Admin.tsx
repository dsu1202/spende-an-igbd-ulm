import { useState, useEffect, useCallback } from "react";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, LogOut, GripVertical, X, History } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";

interface DonationPurpose {
  id: string;
  title_de: string;
  title_bs: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface HistoryEntry {
  id: string;
  purpose_title_de: string;
  purpose_title_bs: string;
  position: number;
  action: string;
  created_at: string;
}

const POSITION_LABELS = ["Links", "Mitte", "Rechts"];

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login fehlgeschlagen", description: error.message, variant: "destructive" });
    } else {
      onLogin();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-foreground text-center mb-6">Admin-Bereich</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label>E-Mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
          </div>
          <div className="space-y-2">
            <Label>Passwort</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Anmelden..." : "Anmelden"}
          </Button>
        </form>
      </div>
    </div>
  );
};

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [purposes, setPurposes] = useState<DonationPurpose[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DonationPurpose | null>(null);
  const [titleDe, setTitleDe] = useState("");
  const [titleBs, setTitleBs] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [dragItem, setDragItem] = useState<DonationPurpose | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchPurposes = useCallback(async () => {
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
  }, []);

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from("purpose_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      setHistory(data || []);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchPurposes();
      fetchHistory();
    }
  }, [session, fetchPurposes, fetchHistory]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const activePurposes = purposes.filter((p) => p.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const inactivePurposes = purposes.filter((p) => !p.is_active);

  // Slots: positions 0, 1, 2
  const slots: (DonationPurpose | null)[] = [null, null, null];
  activePurposes.forEach((p) => {
    const idx = p.sort_order;
    if (idx >= 0 && idx <= 2) slots[idx] = p;
  });

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
      toast({ title: "Aktualisiert" });
    } else {
      // New purpose starts inactive
      const { error } = await supabase
        .from("donation_purposes")
        .insert({ title_de: titleDe.trim(), title_bs: titleBs.trim(), is_active: false, sort_order: 99 });
      if (error) {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Spendenaktion erstellt" });
    }

    setDialogOpen(false);
    fetchPurposes();
  };

  const handleDelete = async (p: DonationPurpose) => {
    if (!confirm(`"${p.title_de}" wirklich löschen?`)) return;
    if (p.is_active) {
      await logHistory(p, p.sort_order + 1, "deactivated");
    }
    const { error } = await supabase.from("donation_purposes").delete().eq("id", p.id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Gelöscht" });
    fetchPurposes();
    fetchHistory();
  };

  const logHistory = async (p: DonationPurpose, position: number, action: string) => {
    await supabase.from("purpose_history").insert({
      purpose_id: p.id,
      purpose_title_de: p.title_de,
      purpose_title_bs: p.title_bs,
      position,
      action,
    });
  };

  const assignToSlot = async (purpose: DonationPurpose, slotIndex: number) => {
    // If slot is occupied, deactivate the current occupant
    const current = slots[slotIndex];
    if (current && current.id !== purpose.id) {
      await supabase.from("donation_purposes").update({ is_active: false, sort_order: 99 }).eq("id", current.id);
      await logHistory(current, slotIndex + 1, "deactivated");
    }

    // If purpose was already active at another slot, log the move
    if (purpose.is_active && purpose.sort_order !== slotIndex) {
      await logHistory(purpose, slotIndex + 1, "moved");
    } else if (!purpose.is_active) {
      await logHistory(purpose, slotIndex + 1, "activated");
    }

    // Activate and assign to slot
    await supabase.from("donation_purposes").update({ is_active: true, sort_order: slotIndex }).eq("id", purpose.id);

    fetchPurposes();
    fetchHistory();
  };

  const removeFromSlot = async (purpose: DonationPurpose, slotIndex: number) => {
    await supabase.from("donation_purposes").update({ is_active: false, sort_order: 99 }).eq("id", purpose.id);
    await logHistory(purpose, slotIndex + 1, "deactivated");
    fetchPurposes();
    fetchHistory();
  };

  const handleDragStart = (p: DonationPurpose) => {
    setDragItem(p);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnSlot = (slotIndex: number) => {
    if (dragItem) {
      assignToSlot(dragItem, slotIndex);
      setDragItem(null);
    }
  };

  const handleDropOnInactive = () => {
    if (dragItem && dragItem.is_active) {
      removeFromSlot(dragItem, dragItem.sort_order);
      setDragItem(null);
    }
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

  const actionLabel = (action: string) => {
    switch (action) {
      case "activated": return "Aktiviert";
      case "deactivated": return "Deaktiviert";
      case "moved": return "Verschoben";
      default: return action;
    }
  };

  const actionColor = (action: string) => {
    switch (action) {
      case "activated": return "text-green-600 bg-green-50";
      case "deactivated": return "text-red-600 bg-red-50";
      case "moved": return "text-blue-600 bg-blue-50";
      default: return "text-muted-foreground bg-muted";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AdminLogin onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Spendenaktionen verwalten</h1>
            <p className="text-muted-foreground mt-1">Ziehe Aktionen auf die 3 Positionen oder entferne sie</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="gap-2">
              <History className="w-4 h-4" />
              Verlauf
            </Button>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Neue Aktion
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Abmelden">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active Slots */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Aktive Positionen im Kiosk</h2>
          <div className="grid grid-cols-3 gap-6">
            {slots.map((slot, i) => (
              <div
                key={i}
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnSlot(i)}
                className={`relative rounded-2xl border-2 border-dashed min-h-[200px] flex flex-col items-center justify-center transition-all ${
                  slot
                    ? "border-primary/30 bg-primary/5"
                    : "border-muted-foreground/20 bg-muted/30"
                } ${dragItem ? "ring-2 ring-primary/20" : ""}`}
              >
                {/* Position label */}
                <div className="absolute top-3 left-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Position {i + 1} · {POSITION_LABELS[i]}
                </div>

                {slot ? (
                  <div
                    draggable
                    onDragStart={() => handleDragStart(slot)}
                    className="w-full h-full p-5 pt-10 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-1 mb-3 text-muted-foreground">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold text-foreground text-center leading-snug">{slot.title_de}</p>
                    <p className="text-base text-muted-foreground text-center mt-1">{slot.title_bs}</p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(slot)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeFromSlot(slot, i)} className="text-destructive hover:text-destructive">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground/60 p-5">
                    <p className="text-sm">Leer</p>
                    <p className="text-xs mt-1">Ziehe eine Aktion hierher</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Inactive Pool */}
        <div
          className={`mb-8 ${dragItem?.is_active ? "ring-2 ring-primary/20 rounded-xl" : ""}`}
          onDragOver={handleDragOver}
          onDrop={handleDropOnInactive}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Verfügbare Aktionen</h2>
          {inactivePurposes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
              <p className="text-sm">Keine inaktiven Aktionen</p>
              <p className="text-xs mt-1">Erstelle neue Aktionen oder entferne aktive</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {inactivePurposes.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => handleDragStart(p)}
                  className="rounded-xl border bg-card p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Zum Zuweisen ziehen</span>
                      </div>
                      <p className="font-semibold text-foreground">{p.title_de}</p>
                      <p className="text-sm text-muted-foreground">{p.title_bs}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(p)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        {showHistory && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Verlauf</h2>
            {history.length === 0 ? (
              <p className="text-muted-foreground text-sm">Noch keine Einträge</p>
            ) : (
              <div className="rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zeitpunkt</TableHead>
                      <TableHead>Aktion</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Spendenaktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(h.created_at)}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${actionColor(h.action)}`}>
                            {actionLabel(h.action)}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          Position {h.position} · {POSITION_LABELS[h.position - 1]}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{h.purpose_title_de}</span>
                            <span className="text-muted-foreground ml-2 text-sm">/ {h.purpose_title_bs}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Aktion bearbeiten" : "Neue Spendenaktion"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Titel (Deutsch)</Label>
                <Input value={titleDe} onChange={(e) => setTitleDe(e.target.value)} placeholder="z.B. Spende an die Moschee" />
              </div>
              <div className="space-y-2">
                <Label>Titel (Bosnisch)</Label>
                <Input value={titleBs} onChange={(e) => setTitleBs(e.target.value)} placeholder="z.B. Sadaka za džamiju" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={handleSave}>{editing ? "Speichern" : "Erstellen"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
