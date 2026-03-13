import { useState } from "react";
import { ArrowRight } from "lucide-react";

interface Props {
  onConfirm: (amount: number) => void;
}

const amounts = [5, 10, 20, 50];

const AmountScreen = ({ onConfirm }: Props) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const activeAmount = customMode ? Number(customValue) : selected;
  const canProceed = activeAmount && activeAmount > 0;

  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <h1 className="text-3xl font-bold font-heading text-foreground mb-12">
        Wie viel möchtest du spenden?
      </h1>

      {!customMode ? (
        <>
          <div className="grid grid-cols-2 gap-5 w-full max-w-lg mb-8">
            {amounts.map((amt) => {
              const isRecommended = amt === 20;
              const isSelected = selected === amt;
              return (
                <button
                  key={amt}
                  onClick={() => setSelected(amt)}
                  className={`kiosk-card flex flex-col items-center justify-center min-h-[120px] text-3xl font-bold font-heading relative
                    ${isSelected ? "kiosk-card-selected" : ""}
                    ${isRecommended && !isSelected ? "bg-accent" : ""}
                  `}
                >
                  {isRecommended && (
                    <span className="absolute top-3 right-3 text-xs font-semibold font-body text-accent-foreground bg-accent px-3 py-1 rounded-full">
                      Empfohlen
                    </span>
                  )}
                  <span className="text-foreground">{amt} €</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { setCustomMode(true); setSelected(null); }}
            className="text-lg font-medium text-primary underline underline-offset-4 mb-8"
          >
            Eigenen Betrag wählen
          </button>
        </>
      ) : (
        <div className="w-full max-w-md mb-8 space-y-5">
          <div className="kiosk-card flex items-center gap-4">
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              placeholder="Betrag"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="flex-1 text-4xl font-bold font-heading bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50 text-center"
            />
            <span className="text-3xl font-bold text-muted-foreground">€</span>
          </div>
          <button
            onClick={() => { setCustomMode(false); setCustomValue(""); }}
            className="text-lg font-medium text-primary underline underline-offset-4"
          >
            Zurück zur Auswahl
          </button>
        </div>
      )}

      {canProceed && (
        <div className="flex items-center gap-6 animate-fade-in">
          <p className="text-lg text-muted-foreground max-w-xs text-right leading-relaxed">
            Karte auf das Kartenlesegerät halten, um zu spenden.
          </p>
          <button
            onClick={() => onConfirm(activeAmount!)}
            className="bg-primary text-primary-foreground rounded-full w-20 h-20 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowRight className="w-10 h-10" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AmountScreen;
