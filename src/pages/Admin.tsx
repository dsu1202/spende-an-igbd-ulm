import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Plus, Pencil, Trash2, LogOut, GripVertical, X, History, Rocket, RotateCcw, Eye } from "lucide-react";
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

// Draft slot assignment: which purpose ID goes in which slot
type DraftSlots = [string | null, string | null, string | null];

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

// Mini kiosk preview component
const KioskPreview = ({ slots }: { slots: (DonationPurpose | null)[] }) => {
  const filled = slots.filter(Boolean) as DonationPurpose[];
  return (
    <div className="rounded-2xl border-2 border-muted bg-foreground/5 p-6 aspect-video flex flex-col items-center justify-center gap-4">
      <div className="text-center">
        <p className="text-sm font-bold text-foreground">Wofür möchtest du spenden?</p>
        <p className="text-xs text-muted-foreground">Za šta želiš dati sadaku?</p>
      </div>
      <div className="flex gap-3 w-full max-w-md justify-center">
        {slots.filter(Boolean).map((p, i) => (
          <div
            key={i}
            className="w-[100px] h-[100px] rounded-xl flex flex-col items-center justify-center p-2 text-center bg-primary text-primary-foreground overflow-hidden"
          >
            <span className="text-[10px] font-bold leading-tight">{p!.title_de}</span>
            <span className="text-[9px] opacity-75 leading-tight mt-0.5">{p!.title_bs}</span>
          </div>
        ))}
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
  const [publishing, setPublishing] = useState(false);

  // Draft state: local slot assignments (purpose IDs)
  const [draftSlots, setDraftSlots] = useState<DraftSlots>([null, null, null]);

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
      // Initialize draft from live state
      const newDraft: DraftSlots = [null, null, null];
      (data || []).forEach((p) => {
        if (p.is_active && p.sort_order >= 0 && p.sort_order <= 2) {
          newDraft[p.sort_order] = p.id;
        }
      });
      setDraftSlots(newDraft);
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
    if (!confirm("Möchtest du dich wirklich abmelden?")) return;
    await supabase.auth.signOut();
  };

  const purposeMap = useMemo(() => {
    const map: Record<string, DonationPurpose> = {};
    purposes.forEach((p) => { map[p.id] = p; });
    return map;
  }, [purposes]);

  // Live slots (from DB)
  const liveSlots: (DonationPurpose | null)[] = useMemo(() => {
    const s: (DonationPurpose | null)[] = [null, null, null];
    purposes.forEach((p) => {
      if (p.is_active && p.sort_order >= 0 && p.sort_order <= 2) s[p.sort_order] = p;
    });
    return s;
  }, [purposes]);

  // Draft slots resolved to purposes
  const draftSlotsPurposes: (DonationPurpose | null)[] = draftSlots.map((id) => (id ? purposeMap[id] || null : null));

  // IDs in draft slots
  const draftSlotIds = new Set(draftSlots.filter(Boolean));

  // Inactive = all purposes NOT in draft slots
  const inactivePurposes = purposes.filter((p) => !draftSlotIds.has(p.id));

  // Has draft changed from live?
  const hasChanges = useMemo(() => {
    const liveIds = liveSlots.map((s) => s?.id || null);
    return draftSlots[0] !== liveIds[0] || draftSlots[1] !== liveIds[1] || draftSlots[2] !== liveIds[2];
  }, [draftSlots, liveSlots]);

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
    // Remove from draft if present
    setDraftSlots((prev) => prev.map((id) => (id === p.id ? null : id)) as DraftSlots);
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

  // Draft operations (local state only, no DB writes)
  const draftAssignToSlot = (purposeId: string, slotIndex: number) => {
    setDraftSlots((prev) => {
      const next = [...prev] as DraftSlots;
      // Remove purpose from any existing slot
      for (let i = 0; i < 3; i++) {
        if (next[i] === purposeId) next[i] = null;
      }
      // If slot was occupied by someone else, free them
      // (they go back to inactive pool)
      next[slotIndex] = purposeId;
      return next;
    });
  };

  const draftRemoveFromSlot = (slotIndex: number) => {
    setDraftSlots((prev) => {
      const next = [...prev] as DraftSlots;
      next[slotIndex] = null;
      return next;
    });
  };

  const resetDraft = () => {
    const newDraft: DraftSlots = [null, null, null];
    purposes.forEach((p) => {
      if (p.is_active && p.sort_order >= 0 && p.sort_order <= 2) {
        newDraft[p.sort_order] = p.id;
      }
    });
    setDraftSlots(newDraft);
  };

  // Publish draft to DB
  const publishDraft = async () => {
    if (!confirm("Soll der Entwurf jetzt live geschaltet werden?")) return;
    setPublishing(true);

    try {
      // Deactivate all current active purposes
      for (const p of purposes.filter((p) => p.is_active)) {
        const stillInSlot = draftSlots.indexOf(p.id);
        if (stillInSlot === -1) {
          // Was active, now removed
          await supabase.from("donation_purposes").update({ is_active: false, sort_order: 99 }).eq("id", p.id);
          await logHistory(p, p.sort_order + 1, "deactivated");
        }
      }

      // Activate draft slots
      for (let i = 0; i < 3; i++) {
        const purposeId = draftSlots[i];
        if (purposeId) {
          const p = purposeMap[purposeId];
          if (!p) continue;
          const wasActive = p.is_active;
          const wasSameSlot = wasActive && p.sort_order === i;

          await supabase.from("donation_purposes").update({ is_active: true, sort_order: i }).eq("id", purposeId);

          if (!wasActive) {
            await logHistory(p, i + 1, "activated");
          } else if (!wasSameSlot) {
            await logHistory(p, i + 1, "moved");
          }
        }
      }

      toast({ title: "Live geschaltet!", description: "Die Änderungen sind jetzt im Kiosk sichtbar." });
      fetchPurposes();
      fetchHistory();
    } catch (e) {
      toast({ title: "Fehler beim Veröffentlichen", variant: "destructive" });
    }

    setPublishing(false);
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
      draftAssignToSlot(dragItem.id, slotIndex);
      setDragItem(null);
    }
  };

  const handleDropOnInactive = () => {
    if (dragItem && draftSlotIds.has(dragItem.id)) {
      const idx = draftSlots.indexOf(dragItem.id);
      if (idx !== -1) draftRemoveFromSlot(idx);
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
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-10 relative">
      <Button variant="ghost" size="icon" onClick={handleLogout} title="Abmelden" className="absolute top-4 right-4 z-10">
        <LogOut className="w-5 h-5" />
      </Button>

      <div className="max-w-6xl mx-auto pr-10 md:pr-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Spendenaktionen verwalten</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Ziehe Aktionen auf die 3 Positionen, prüfe die Vorschau und schalte live</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Verlauf</span>
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Neue Aktion</span>
            </Button>
          </div>
        </div>

        {/* Change indicator + publish bar */}
        {hasChanges && (
          <div className="mb-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-3 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              <span className="font-medium text-foreground text-sm md:text-base">Entwurf – noch nicht live</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetDraft} className="gap-2">
                <RotateCcw className="w-3 h-3" />
                Zurücksetzen
              </Button>
              <Button size="sm" onClick={publishDraft} disabled={publishing} className="gap-2">
                <Rocket className="w-3 h-3" />
                {publishing ? "Veröffentlichen..." : "Live schalten"}
              </Button>
            </div>
          </div>
        )}

        {/* Main layout: slots + preview side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Slots (2/3 width) */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Entwurf – Positionen
              {hasChanges && <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Nicht gespeichert</span>}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {draftSlotsPurposes.map((slot, i) => (
                <div
                  key={i}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDropOnSlot(i)}
                  className={`relative rounded-2xl border-2 border-dashed min-h-[140px] sm:min-h-[180px] flex flex-col items-center justify-center transition-all ${
                    slot
                      ? "border-primary/30 bg-primary/5"
                      : "border-muted-foreground/20 bg-muted/30"
                  } ${dragItem ? "ring-2 ring-primary/20" : ""}`}
                >
                  <div className="absolute top-3 left-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {POSITION_LABELS[i]}
                  </div>

                  {slot ? (
                    <div
                      draggable
                      onDragStart={() => handleDragStart(slot)}
                      className="w-full h-full p-4 pt-9 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground mb-2" />
                      <p className="text-base font-bold text-foreground text-center leading-snug">{slot.title_de}</p>
                      <p className="text-sm text-muted-foreground text-center mt-1">{slot.title_bs}</p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(slot)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => draftRemoveFromSlot(i)} className="text-destructive hover:text-destructive">
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

          {/* Live Preview (1/3 width) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Vorschau</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Entwurf</p>
                <KioskPreview slots={draftSlotsPurposes} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Aktuell Live
                </p>
                <KioskPreview slots={liveSlots} />
              </div>
            </div>
          </div>
        </div>

        {/* Inactive Pool */}
        <div
          className={`mb-8 ${dragItem && draftSlotIds.has(dragItem.id) ? "ring-2 ring-primary/20 rounded-xl" : ""}`}
          onDragOver={handleDragOver}
          onDrop={handleDropOnInactive}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Verfügbare Aktionen</h2>
          {inactivePurposes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
              <p className="text-sm">Keine verfügbaren Aktionen</p>
              <p className="text-xs mt-1">Erstelle neue Aktionen oder entferne welche aus den Positionen</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                        <span className="text-xs text-muted-foreground">Ziehen</span>
                      </div>
                      <p className="font-semibold text-foreground text-sm">{p.title_de}</p>
                      <p className="text-xs text-muted-foreground">{p.title_bs}</p>
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
            {(() => {
              // Build time ranges: pair activated with next deactivated/moved
              const ranges: { title_de: string; title_bs: string; position: number; from: string; to: string | null }[] = [];
              // Sort history oldest first for pairing
              const sorted = [...history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

              // Track open activations per purpose+position
              const open: Record<string, { title_de: string; title_bs: string; position: number; from: string }> = {};

              for (const h of sorted) {
                const key = `${h.purpose_title_de}__${h.position}`;
                if (h.action === "activated") {
                  open[key] = { title_de: h.purpose_title_de, title_bs: h.purpose_title_bs, position: h.position, from: h.created_at };
                } else if (h.action === "deactivated" || h.action === "moved") {
                  if (open[key]) {
                    ranges.push({ ...open[key], to: h.created_at });
                    delete open[key];
                  }
                }
              }
              // Still open = currently active
              for (const key of Object.keys(open)) {
                ranges.push({ ...open[key], to: null });
              }

              // Sort newest first
              ranges.sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime());

              if (ranges.length === 0) {
                return <p className="text-muted-foreground text-sm">Noch keine Einträge</p>;
              }

              return (
                <div className="rounded-xl border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Spendenaktion</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Von</TableHead>
                        <TableHead>Bis</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ranges.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div>
                              <span className="font-medium">{r.title_de}</span>
                              <span className="text-muted-foreground ml-2 text-sm">/ {r.title_bs}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            Position {r.position} · {POSITION_LABELS[r.position - 1]}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(r.from)}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {r.to ? (
                              <span className="text-muted-foreground">{formatDate(r.to)}</span>
                            ) : (
                              <span className="text-xs font-medium px-2 py-1 rounded-full text-green-600 bg-green-50">Aktiv</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}
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
