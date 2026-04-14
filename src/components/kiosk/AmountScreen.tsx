import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  onConfirm: (amount: number) => void;
}

const amounts = [5, 10, 20, 50];

const AmountScreen = ({ onConfirm }: Props) => {
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const handleSelect = (amt: number) => {
    onConfirm(amt);
  };

  const handleCustomConfirm = () => {
    const val = Number(customValue);
    if (val > 0) onConfirm(val);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-extrabold font-heading text-foreground tracking-tight">
          Welchen Betrag möchtest du spenden?
        </h1>
        <p className="text-3xl text-muted-foreground mt-2">
          Koliko želiš dati sadake?
        </p>
      </div>

      {!customMode ? (
        <>
          <div className="grid grid-cols-4 gap-6 w-full max-w-3xl mb-12">
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
            Eigenen Betrag wählen · Druga suma (unesi sam)
          </button>
        </>
      ) : (
        <div className="flex items-center justify-center gap-8 w-full max-w-2xl">
          {/* Zurück */}
          <button
            onClick={() => { setCustomMode(false); setCustomValue(""); }}
            className="flex-shrink-0 h-20 px-8 rounded-full bg-primary/10 flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-primary/15"
          >
            <ArrowLeft className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-primary">Zurück / Nazad</span>
          </button>

          {/* Betrag in der Mitte */}
          <div className="flex-1 rounded-3xl bg-card border border-border p-8 flex items-center justify-center gap-3" style={{ boxShadow: 'var(--shadow-card)' }}>
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              placeholder="0"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="w-48 text-6xl font-extrabold font-heading bg-transparent outline-none text-foreground placeholder:text-muted-foreground/30 text-center"
            />
            <span className="text-5xl font-bold text-muted-foreground">€</span>
          </div>

          {/* Weiter */}
          <button
            onClick={handleCustomConfirm}
            disabled={Number(customValue) <= 0}
            className="flex-shrink-0 h-20 px-8 rounded-full bg-gradient-to-br from-primary to-primary/85 text-primary-foreground flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg disabled:opacity-30 disabled:scale-100"
          >
            <span className="text-xl font-bold">Weiter / Dalje</span>
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AmountScreen;
