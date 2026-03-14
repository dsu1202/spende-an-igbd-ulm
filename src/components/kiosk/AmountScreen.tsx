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
      <h1 className="text-4xl font-bold font-heading text-foreground mb-16">
        Wie viel möchtest du spenden?
      </h1>

      {!customMode ? (
        <>
          <div className="grid grid-cols-4 gap-8 w-full max-w-4xl mb-12">
            {amounts.map((amt) => {
              const isRecommended = amt === 20;
              return (
                <button
                  key={amt}
                  onClick={() => handleSelect(amt)}
                  className={`kiosk-card flex flex-col items-center justify-center aspect-video text-4xl font-bold font-heading relative
                    ${isRecommended ? "bg-accent ring-2 ring-primary" : ""}
                  `}
                >
                  {isRecommended && (
                    <span className="absolute top-3 right-3 text-xs font-semibold font-body text-accent-foreground bg-primary/10 px-3 py-1 rounded-full">
                      Empfohlen
                    </span>
                  )}
                  <span className="text-foreground">{amt} €</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCustomMode(true)}
            className="text-xl font-medium text-primary underline underline-offset-4"
          >
            Eigenen Betrag wählen
          </button>
        </>
      ) : (
        <div className="w-full max-w-md space-y-8">
          <div className="kiosk-card flex items-center gap-4">
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              placeholder="Betrag"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="flex-1 text-5xl font-bold font-heading bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50 text-center"
            />
            <span className="text-4xl font-bold text-muted-foreground">€</span>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setCustomMode(false); setCustomValue(""); }}
              className="text-xl font-medium text-primary underline underline-offset-4"
            >
              Zurück zur Auswahl
            </button>
            {Number(customValue) > 0 && (
              <button
                onClick={handleCustomConfirm}
                className="bg-primary text-primary-foreground rounded-full w-18 h-18 flex items-center justify-center active:scale-95 transition-transform animate-fade-in"
              >
                <ArrowRight className="w-9 h-9" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AmountScreen;
