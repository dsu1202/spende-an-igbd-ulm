import { useEffect } from "react";

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
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in gap-10">
      <div className="rounded-full bg-primary/10 backdrop-blur-sm px-14 py-5 border border-primary/20">
        <span className="text-7xl font-extrabold font-heading text-primary tracking-tight">
          {amount} €
        </span>
      </div>

      {/* Tap-Animation: Handy an Kartenleser */}
      <div className="relative w-72 h-48 flex items-end justify-center">
        {/* Card Reader (SumUp Air) */}
        <svg
          viewBox="0 0 120 160"
          className="w-28 h-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body */}
          <rect x="10" y="0" width="100" height="160" rx="16" className="fill-muted stroke-border" strokeWidth="2" />
          {/* Screen */}
          <rect x="22" y="12" width="76" height="50" rx="8" className="fill-background stroke-border" strokeWidth="1.5" />
          {/* NFC area */}
          <circle cx="60" cy="100" r="18" className="stroke-primary" strokeWidth="2" strokeDasharray="6 4" fill="none" />
          <circle cx="60" cy="100" r="10" className="stroke-primary/60" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
          <circle cx="60" cy="100" r="4" className="fill-primary/40" />
          {/* Buttons */}
          <rect x="30" y="135" width="24" height="12" rx="4" className="fill-destructive/60" />
          <rect x="66" y="135" width="24" height="12" rx="4" className="fill-primary/60" />
        </svg>

        {/* Phone – animiert sich von oben heran */}
        <svg
          viewBox="0 0 70 130"
          className="w-16 h-auto absolute right-6 animate-tap-phone"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="2" y="2" width="66" height="126" rx="12" className="fill-foreground/90 stroke-foreground" strokeWidth="2" />
          <rect x="8" y="14" width="54" height="96" rx="4" className="fill-primary/20" />
          {/* Camera notch */}
          <circle cx="35" cy="8" r="3" className="fill-muted" />
          {/* Home bar */}
          <rect x="22" y="116" width="26" height="4" rx="2" className="fill-muted" />
          {/* NFC waves on phone */}
          <path d="M28 55 Q35 48 42 55" className="stroke-primary-foreground/60" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M24 50 Q35 40 46 50" className="stroke-primary-foreground/40" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>

        {/* NFC Pulse */}
        <div className="absolute bottom-12 left-1/2 -translate-x-3 animate-nfc-pulse">
          <div className="w-6 h-6 rounded-full bg-primary/30" />
        </div>
      </div>

      <div className="text-center space-y-2 max-w-xl">
        <p className="text-2xl font-bold font-heading text-foreground">
          Halte deine Karte oder dein Handy an das Kartenlesegerät
        </p>
        <p className="text-xl text-muted-foreground">
          Prisloni svoju karticu ili mobitel na čitač kartica
        </p>
      </div>
    </div>
  );
};

export default PaymentScreen;
