import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Donation {
  id: string;
  amount: number;
  currency: string;
  purpose_title_de: string;
  purpose_title_bs: string;
  status: string;
  sumup_tx_code: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
}

const statusVariant = (
  status: string,
): { label: string; className: string } => {
  switch (status) {
    case "success":
      return { label: "Erfolgreich", className: "bg-green-100 text-green-700 border-green-200" };
    case "failed":
      return { label: "Fehlgeschlagen", className: "bg-red-100 text-red-700 border-red-200" };
    case "cancelled":
      return { label: "Abgebrochen", className: "bg-amber-100 text-amber-700 border-amber-200" };
    case "pending":
      return { label: "Ausstehend", className: "bg-blue-100 text-blue-700 border-blue-200" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const TransactionsTab = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      // Table likely doesn't exist yet (migration not applied)
      if (error.code === "42P01" || /relation.*does not exist/i.test(error.message)) {
        setTableMissing(true);
      } else {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
      }
      setDonations([]);
    } else {
      setTableMissing(false);
      setDonations(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const totals = useMemo(() => {
    const successes = donations.filter((d) => d.status === "success");
    const total = successes.reduce((sum, d) => sum + d.amount, 0);
    return {
      count: successes.length,
      total,
      attempts: donations.length,
    };
  }, [donations]);

  // Per-project breakdown — only successful donations
  const byProject = useMemo(() => {
    const map = new Map<string, { de: string; bs: string; amount: number; count: number }>();
    for (const d of donations) {
      if (d.status !== "success") continue;
      const key = d.purpose_title_de;
      const existing = map.get(key);
      if (existing) {
        existing.amount += d.amount;
        existing.count += 1;
      } else {
        map.set(key, {
          de: d.purpose_title_de,
          bs: d.purpose_title_bs,
          amount: d.amount,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [donations]);

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
          <code className="px-1.5 py-0.5 bg-amber-100 rounded">donations</code>{" "}
          existiert noch nicht. Bitte das Migrations-SQL in Supabase ausführen,
          dann hier neu laden.
        </p>
        <Button variant="outline" size="sm" onClick={fetchDonations} className="mt-4 gap-2">
          <RefreshCw className="w-4 h-4" />
          Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Spenden gesamt
          </p>
          <p className="text-3xl font-bold text-foreground mt-1">{totals.total.toFixed(2)} €</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Erfolgreiche Zahlungen
          </p>
          <p className="text-3xl font-bold text-foreground mt-1">{totals.count}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Versuche insgesamt
          </p>
          <p className="text-3xl font-bold text-foreground mt-1">{totals.attempts}</p>
        </div>
      </div>

      {/* Per-project breakdown */}
      {byProject.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Einnahmen nach Projekt
          </h2>
          <div className="space-y-3">
            {byProject.map((p) => {
              const pct = totals.total > 0 ? (p.amount / totals.total) * 100 : 0;
              return (
                <div key={p.de}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium text-foreground">{p.de}</span>
                      <span className="text-xs text-muted-foreground ml-2">({p.count} ×)</span>
                    </div>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {p.amount.toFixed(2)} €
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header + refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Transaktionen</h2>
        <Button variant="outline" size="sm" onClick={fetchDonations} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Aktualisieren
        </Button>
      </div>

      {donations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed text-center py-12 text-muted-foreground">
          <p className="text-sm">Noch keine Transaktionen</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Zweck</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SumUp Code</TableHead>
                <TableHead>Fehler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.map((d) => {
                const sv = statusVariant(d.status);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(d.created_at)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {d.amount} {d.currency}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="text-sm font-medium truncate">{d.purpose_title_de}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {d.purpose_title_bs}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={sv.className}>
                        {sv.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {d.sumup_tx_code || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {d.error_code ? (
                        <div>
                          <span className="font-mono font-medium text-red-600">
                            {d.error_code}
                          </span>
                          {d.error_message && (
                            <p className="text-muted-foreground mt-0.5 max-w-[200px] truncate">
                              {d.error_message}
                            </p>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;
