import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

interface Props {
  amount: number;
  purpose: { de: string; bs: string };
  onSuccess: () => void;
  onBack: () => void;
}

const AUTO_ADVANCE_DELAY = 5000;

const PaymentScreen = ({ amount, purpose, onSuccess, onBack }: Props) => {
  useEffect(() => {
    const timer = setTimeout(onSuccess, AUTO_ADVANCE_DELAY);
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <button
        onClick={onBack}
        className="absolute top-12 left-16 text-lg font-semibold text-primary bg-primary/10 px-6 py-3 rounded-full hover:bg-primary/15 transition-colors flex items-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück · Nazad
      </button>
      <div className="rounded-full bg-primary/10 backdrop-blur-sm px-14 py-5 border border-primary/20 mb-4">
        <span className="text-7xl font-extrabold font-heading text-primary tracking-tight">
          {amount} €
        </span>
      </div>
      <p className="text-2xl font-semibold text-foreground mb-1">für {purpose.de}</p>
      <p className="text-2xl text-muted-foreground mb-10">za {purpose.bs}</p>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-14 py-10 max-w-3xl w-full">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-primary-foreground/5" />

        <div className="relative flex items-center justify-between gap-8">
          {/* Text */}
          <div className="space-y-3 flex-1">
            <p className="text-3xl font-bold font-heading leading-snug">
              Halte deine Karte an das Kartenlesegerät
            </p>
            <p className="text-2xl opacity-80 leading-snug">
              Prisloni svoju karticu na čitač kartica
            </p>
          </div>

          {/* Card reader animation + arrow */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            {/* Card reader with card tapping */}
            <div className="relative w-28 h-28">
              {/* Reader body */}
              <svg viewBox="0 0 100 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Reader body */}
                <rect x="15" y="20" width="70" height="100" rx="12" className="fill-primary-foreground/20 stroke-primary-foreground/50" strokeWidth="1.5" />
                {/* Screen */}
                <rect x="25" y="28" width="50" height="30" rx="6" className="fill-primary-foreground/10 stroke-primary-foreground/30" strokeWidth="1" />
                {/* NFC symbol on reader */}
                <path d="M42 75 Q50 68 58 75" className="stroke-primary-foreground/60" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M38 70 Q50 60 62 70" className="stroke-primary-foreground/40" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M34 65 Q50 52 66 65" className="stroke-primary-foreground/25" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <circle cx="50" cy="78" r="2.5" className="fill-primary-foreground/50" />
              </svg>

              {/* Card tapping in */}
              <svg viewBox="0 0 60 40" className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 animate-tap-phone" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="52" height="32" rx="5" className="fill-primary-foreground/80 stroke-primary-foreground" strokeWidth="1.5" />
                {/* Chip */}
                <rect x="12" y="14" width="10" height="8" rx="1.5" className="fill-primary/40 stroke-primary/60" strokeWidth="0.8" />
                {/* Stripe */}
                <rect x="30" y="12" width="18" height="3" rx="1" className="fill-primary-foreground/40" />
                <rect x="30" y="18" width="12" height="3" rx="1" className="fill-primary-foreground/30" />
              </svg>

              {/* NFC pulse */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 animate-nfc-pulse">
                <div className="w-5 h-5 rounded-full bg-primary-foreground/40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
