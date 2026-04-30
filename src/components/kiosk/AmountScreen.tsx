import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onConfirm: (amount: number) => void;
}

const FALLBACK_AMOUNTS = [5, 10, 20, 50];

const AmountScreen = ({ onConfirm }: Props) => {
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [amounts, setAmounts] = useState<number[]>(FALLBACK_AMOUNTS);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("preset_amounts")
        .select("amount, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!active) return;
      if (!error && data && data.length > 0) {
        setAmounts(data.map((d) => d.amount));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSelect = (amt: number) => {
    onConfirm(amt);
  };

  const MAX_CUSTOM = 99999;

  const handleNumpadPress = (key: string) => {
    if (key === "backspace") {
      setCustomValue((v) => v.slice(0, -1));
      return;
    }
    const next = customValue + key;
    if (next.length <= 5 && Number(next) <= MAX_CUSTOM) setCustomValue(next);
  };

  const handleCustomConfirm = () => {
    const val = Number(customValue);
    if (val > 0 && val <= MAX_CUSTOM) onConfirm(val);
  };

  // Auto-scale display font based on digit count
  const displaySize = (val: string) => {
    const len = (val || "0").length;
    if (len <= 2) return "text-6xl";
    if (len <= 3) return "text-5xl";
    if (len <= 4) return "text-4xl";
    return "text-3xl";
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      {!customMode && (
        <div className="text-center mb-14">
          <h1 className="text-4xl font-extrabold font-heading text-foreground tracking-tight">
            Welchen Betrag möchtest du spenden?
          </h1>
          <p className="text-3xl text-muted-foreground mt-2">
            Koliko želiš dati sadake?
          </p>
        </div>
      )}

      {!customMode ? (
        <>
          <div
            className="grid gap-6 w-full max-w-3xl mb-12"
            style={{
              gridTemplateColumns: `repeat(${Math.min(Math.max(amounts.length, 1), 4)}, minmax(0, 1fr))`,
            }}
          >
            {amounts.map((amt) => (
              <button
                key={amt}
                onClick={() => handleSelect(amt)}
                className="group relative overflow-hidden bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-3xl flex flex-col items-center justify-center aspect-square text-5xl font-extrabold font-heading active:scale-95 transition-all duration-200 hover:shadow-lg"
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary-foreground/10" />
                <span className="relative">{amt} €</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setCustomMode(true)}
            className="text-lg font-semibold text-primary bg-primary/10 px-8 py-3 rounded-full hover:bg-primary/15 transition-colors"
          >
            Eigenen Betrag wählen · Izaberi drugu sumu
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          {/* Amount display */}
          <div className="w-full rounded-2xl bg-card border border-border py-4 flex items-center justify-center gap-2" style={{ boxShadow: 'var(--shadow-card)' }}>
            <span className={`${displaySize(customValue)} font-extrabold font-heading text-foreground transition-all duration-150 min-w-[2ch] text-center`}>
              {customValue || "0"}
            </span>
            <span className="text-4xl font-bold text-muted-foreground">€</span>
          </div>

          {/* Numpad grid — fixed height rows, not aspect-square */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {["1","2","3","4","5","6","7","8","9"].map((k) => (
              <button
                key={k}
                onClick={() => handleNumpadPress(k)}
                className="h-14 rounded-xl bg-card border border-border text-2xl font-bold text-foreground active:scale-95 transition-all hover:bg-muted"
              >
                {k}
              </button>
            ))}
            {/* Bottom row: backspace · 0 · confirm */}
            <button
              onClick={() => handleNumpadPress("backspace")}
              className="h-14 rounded-xl bg-card border border-border flex items-center justify-center active:scale-95 transition-all hover:bg-muted"
            >
              <svg className="w-6 h-6 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                <line x1="18" y1="9" x2="12" y2="15"/>
                <line x1="12" y1="9" x2="18" y2="15"/>
              </svg>
            </button>
            <button
              onClick={() => handleNumpadPress("0")}
              className="h-14 rounded-xl bg-card border border-border text-2xl font-bold text-foreground active:scale-95 transition-all hover:bg-muted"
            >
              0
            </button>
            <button
              onClick={handleCustomConfirm}
              disabled={Number(customValue) <= 0}
              className="h-14 rounded-xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={() => { setCustomMode(false); setCustomValue(""); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Zurück zu den Beträgen
          </button>
        </div>
      )}
    </div>
  );
};

export default AmountScreen;
