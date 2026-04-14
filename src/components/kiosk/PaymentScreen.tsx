import { useEffect } from "react";
import { MoveRight } from "lucide-react";

interface Props {
  amount: number;
  purpose: string;
  onSuccess: () => void;
}

const AUTO_ADVANCE_DELAY = 5000;

const PaymentScreen = ({ amount, purpose, onSuccess }: Props) => {
  useEffect(() => {
    const timer = setTimeout(onSuccess, AUTO_ADVANCE_DELAY);
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-extrabold font-heading text-foreground tracking-tight">
          Halte deine Karte an das Kartenlesegerät
        </h1>
        <p className="text-3xl text-muted-foreground mt-2">
          Prisloni svoju karticu na čitač kartica
        </p>
      </div>

      {/* Betrag + Animation */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-14 py-10 max-w-3xl w-full">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-primary-foreground/5" />

        <div className="relative flex items-center justify-between gap-8">
          {/* Betrag */}
          <span className="text-7xl font-extrabold font-heading tracking-tight">
            {amount} €
          </span>

          {/* Pfeil */}
          <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center">
            <MoveRight className="w-10 h-10 animate-bounce" strokeWidth={2.5} />
          </div>

          {/* Card reader animation */}
          <div className="flex-shrink-0 relative w-28 h-28">
            {/* Reader body */}
            <svg viewBox="0 0 100 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="15" y="20" width="70" height="100" rx="12" className="fill-primary-foreground/20 stroke-primary-foreground/50" strokeWidth="1.5" />
              <rect x="25" y="28" width="50" height="30" rx="6" className="fill-primary-foreground/10 stroke-primary-foreground/30" strokeWidth="1" />
              {/* NFC symbol */}
              <path d="M42 75 Q50 68 58 75" className="stroke-primary-foreground/60" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M38 70 Q50 60 62 70" className="stroke-primary-foreground/40" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M34 65 Q50 52 66 65" className="stroke-primary-foreground/25" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <circle cx="50" cy="78" r="2.5" className="fill-primary-foreground/50" />
            </svg>

            {/* Card tapping in */}
            <svg viewBox="0 0 60 40" className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 animate-tap-phone" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="52" height="32" rx="5" className="fill-primary-foreground/80 stroke-primary-foreground" strokeWidth="1.5" />
              <rect x="12" y="14" width="10" height="8" rx="1.5" className="fill-primary/40 stroke-primary/60" strokeWidth="0.8" />
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
  );
};

export default PaymentScreen;
