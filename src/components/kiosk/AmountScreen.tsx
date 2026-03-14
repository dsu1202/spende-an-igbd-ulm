import { useState } from "react";
import { ArrowRight } from "lucide-react";

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
      <h1 className="text-4xl font-extrabold font-heading text-foreground mb-14 tracking-tight">
        Wie viel möchtest du spenden?
      </h1>

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
            Eigenen Betrag wählen
          </button>
        </>
      ) : (
        <div className="w-full max-w-md space-y-8">
          <div className="rounded-3xl bg-card border border-border p-8 flex items-center gap-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              placeholder="Betrag"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="flex-1 text-5xl font-extrabold font-heading bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40 text-center"
            />
            <span className="text-4xl font-bold text-muted-foreground">€</span>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setCustomMode(false); setCustomValue(""); }}
              className="text-lg font-semibold text-primary bg-primary/10 px-6 py-3 rounded-full hover:bg-primary/15 transition-colors"
            >
              Zurück
            </button>
            {Number(customValue) > 0 && (
              <button
                onClick={handleCustomConfirm}
                className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center active:scale-95 transition-transform animate-fade-in shadow-lg"
              >
                <ArrowRight className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AmountScreen;
