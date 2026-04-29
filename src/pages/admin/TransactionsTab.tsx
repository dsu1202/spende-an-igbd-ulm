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
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  device_name: string | null;
}

type Period =
  | "today"
  | "yesterday"
  | "last7"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusVariant = (status: string): { label: string; className: string } => {
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

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const getPeriodRange = (
  period: Period,
  customFrom: string,
  customTo: string,
): DateRange => {
  const now = new Date();

  switch (period) {
    case "today":
      return { from: startOfDay(now), to: now };

    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }

    case "last7": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: startOfDay(d), to: now };
    }

    case "thisMonth":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };

    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return { from: start, to: end };
    }

    case "thisYear":
      return { from: new Date(now.getFullYear(), 0, 1), to: now };

    case "lastYear": {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = endOfDay(new Date(now.getFullYear() - 1, 11, 31));
      return { from: start, to: end };
    }

    case "custom": {
      const from = customFrom ? new Date(customFrom + "T00:00:00") : startOfDay(now);
      const to = customTo ? new Date(customTo + "T23:59:59") : endOfDay(now);
      return { from, to };
    }
  }
};

const PERIOD_LABELS: { id: Period; label: string }[] = [
  { id: "today", label: "Heute" },
  { id: "yesterday", label: "Gestern" },
  { id: "last7", label: "7 Tage" },
  { id: "thisMonth", label: "Dieser Monat" },
  { id: "lastMonth", label: "Letzter Monat" },
  { id: "thisYear", label: "Dieses Jahr" },
  { id: "lastYear", label: "Letztes Jahr" },
  { id: "custom", label: "Benutzerdefiniert" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TransactionsTab = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  // Period filter state
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useMemo(
    () => getPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo],
  );

  const fetchDonations = useCallback(async (r: DateRange) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .gte("created_at", r.from.toISOString())
      .lte("created_at", r.to.toISOString())
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      if (error.code === "42P01" || /relation.*does not exist/i.test(error.message)) {
        setTableMissing(true);
      } else {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
      }
      setDonations([]);
    } else {
      setTableMissing(false);
      setDonations((data as Donation[]) || []);
    }
    setLoading(false);
  }, []);

  // Re-fetch whenever the computed range changes, but debounce custom inputs
  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchDonations(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // ---------------------------------------------------------------------------
  // Aggregations (all on already-fetched + period-filtered data)
  // ---------------------------------------------------------------------------

  const successes = useMemo(
    () => donations.filter((d) => d.status === "success"),
    [donations],
  );

  const totals = useMemo(() => {
    const total = successes.reduce((sum, d) => sum + d.amount, 0);
    return { count: successes.length, total, attempts: donations.length };
  }, [successes, donations]);

  const byProject = useMemo(() => {
    const map = new Map<string, { de: string; bs: string; amount: number; count: number }>();
    for (const d of successes) {
      const key = d.purpose_title_de;
      const existing = map.get(key);
      if (existing) {
        existing.amount += d.amount;
        existing.count += 1;
      } else {
        map.set(key, { de: d.purpose_title_de, bs: d.purpose_title_bs, amount: d.amount, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [successes]);

  const byDevice = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; count: number; attempts: number }>();
    for (const d of donations) {
      const key = d.device_name ?? "Unbekanntes Gerät";
      const existing = map.get(key);
      if (existing) {
        if (d.status === "success") {
          existing.amount += d.amount;
          existing.count += 1;
        }
        existing.attempts += 1;
      } else {
        map.set(key, {
          name: key,
          amount: d.status === "success" ? d.amount : 0,
          count: d.status === "success" ? 1 : 0,
          attempts: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [donations]);

  const hasDeviceData = useMemo(
    () => donations.some((d) => d.device_name != null),
    [donations],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchDonations(range)}
          className="mt-4 gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Period filter bar ── */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {PERIOD_LABELS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPeriod(id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                period === id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Von</label>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-40 h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Bis</label>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-40 h-8 text-sm"
              />
            </div>
            {customFrom && customTo && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => fetchDonations(range)}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Laden
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Summary cards ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Spenden gesamt
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {totals.total.toFixed(2)} €
              </p>
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

          {/* ── Per-project breakdown ── */}
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
                          <span className="text-xs text-muted-foreground ml-2">
                            ({p.count} ×)
                          </span>
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

          {/* ── Per-device breakdown ── */}
          {hasDeviceData && byDevice.length > 0 && (
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Einnahmen nach Gerät
              </h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gerät</TableHead>
                      <TableHead className="text-right">Erfolgreiche Zahlungen</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                      <TableHead className="text-right">Versuche</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byDevice.map((dev) => (
                      <TableRow key={dev.name}>
                        <TableCell className="font-medium">{dev.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{dev.count}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                          {dev.amount.toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {dev.attempts}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ── Transactions table ── */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Transaktionen</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDonations(range)}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aktualisieren
            </Button>
          </div>

          {successes.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed text-center py-12 text-muted-foreground">
              <p className="text-sm">Keine erfolgreichen Zahlungen im gewählten Zeitraum</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Zweck</TableHead>
                    {hasDeviceData && <TableHead>Gerät</TableHead>}
                    <TableHead>SumUp Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {successes.map((d) => (
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
                      {hasDeviceData && (
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {d.device_name ?? "—"}
                        </TableCell>
                      )}
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {d.sumup_tx_code || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionsTab;
