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

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: "today",     label: "Heute" },
  { id: "yesterday", label: "Gestern" },
  { id: "last7",     label: "Letzte 7 Tage" },
  { id: "thisMonth", label: "Dieser Monat" },
  { id: "lastMonth", label: "Letzter Monat" },
  { id: "thisYear",  label: "Dieses Jahr" },
  { id: "lastYear",  label: "Letztes Jahr" },
  { id: "custom",    label: "Benutzerdefiniert" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TransactionsTab = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  // Filters
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");

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

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;
    fetchDonations(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // ---------------------------------------------------------------------------
  // Derived device list for dropdown
  // ---------------------------------------------------------------------------

  const deviceNames = useMemo(() => {
    const names = new Set<string>();
    for (const d of donations) {
      if (d.device_name) names.add(d.device_name);
    }
    return Array.from(names).sort();
  }, [donations]);

  // Reset device filter when it disappears from the list
  useEffect(() => {
    if (deviceFilter !== "all" && !deviceNames.includes(deviceFilter)) {
      setDeviceFilter("all");
    }
  }, [deviceNames, deviceFilter]);

  // ---------------------------------------------------------------------------
  // Apply device filter
  // ---------------------------------------------------------------------------

  const filteredDonations = useMemo(() => {
    if (deviceFilter === "all") return donations;
    return donations.filter((d) => d.device_name === deviceFilter);
  }, [donations, deviceFilter]);

  const successes = useMemo(
    () => filteredDonations.filter((d) => d.status === "success"),
    [filteredDonations],
  );

  const totals = useMemo(() => {
    const total = successes.reduce((sum, d) => sum + d.amount, 0);
    return { count: successes.length, total, attempts: filteredDonations.length };
  }, [successes, filteredDonations]);

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
    // Always show per-device from the unfiltered donations so you get the full picture
    const map = new Map<string, { name: string; amount: number; count: number; attempts: number }>();
    for (const d of donations) {
      const key = d.device_name ?? "Unbekanntes Gerät";
      const existing = map.get(key);
      if (existing) {
        if (d.status === "success") { existing.amount += d.amount; existing.count += 1; }
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
        <Button variant="outline" size="sm" onClick={() => fetchDonations(range)} className="mt-4 gap-2">
          <RefreshCw className="w-4 h-4" />
          Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Period dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
            Zeitraum
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="h-9 rounded-lg border border-border bg-card pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Tablet dropdown — only shown when device data exists */}
        {hasDeviceData && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
              Gerät
            </label>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">Alle Geräte</option>
              {deviceNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Custom date inputs */}
        {period === "custom" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Von</label>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-36 h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bis</label>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-36 h-9 text-sm"
              />
            </div>
            {customFrom && customTo && (
              <Button size="sm" variant="outline" className="h-9 gap-1.5 self-end" onClick={() => fetchDonations(range)}>
                <RefreshCw className="w-3.5 h-3.5" />
                Laden
              </Button>
            )}
          </>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-3 md:p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium leading-tight">Spenden gesamt</p>
              <p className="text-base md:text-2xl font-bold text-foreground mt-1 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">{totals.total.toFixed(2)} €</p>
            </div>
            <div className="rounded-xl border bg-card p-3 md:p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium leading-tight">Zahlungen</p>
              <p className="text-xl md:text-3xl font-bold text-foreground mt-1 tabular-nums">{totals.count}</p>
            </div>
            <div className="rounded-xl border bg-card p-3 md:p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium leading-tight">Versuche</p>
              <p className="text-xl md:text-3xl font-bold text-foreground mt-1 tabular-nums">{totals.attempts}</p>
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
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Per-device breakdown — card layout, works on all screen sizes */}
          {hasDeviceData && deviceFilter === "all" && byDevice.length > 0 && (
            <div className="rounded-xl border bg-card p-4 md:p-5 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Einnahmen nach Gerät
              </h2>
              <div className="space-y-2">
                {byDevice.map((dev) => (
                  <div key={dev.name} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                    <span className="font-semibold text-sm text-foreground truncate">{dev.name}</span>
                    <div className="flex items-center gap-3 shrink-0 text-sm">
                      <span className="tabular-nums font-bold text-foreground">{dev.amount.toFixed(2)} €</span>
                      <span className="text-muted-foreground tabular-nums">{dev.count} ×</span>
                      <span className="text-muted-foreground/60 tabular-nums text-xs">({dev.attempts})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions table */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Transaktionen</h2>
            <Button variant="outline" size="sm" onClick={() => fetchDonations(range)} className="gap-2">
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
                      <TableCell className="font-semibold">{d.amount} {d.currency}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="text-sm font-medium truncate">{d.purpose_title_de}</p>
                          <p className="text-xs text-muted-foreground truncate">{d.purpose_title_bs}</p>
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
