import { useEffect } from "react";
import contactlessIcon from "@/assets/contactless-icon.png";

interface Props {
  amount: number;
  onSuccess: () => void;
}

const PaymentScreen = ({ amount, onSuccess }: Props) => {
  useEffect(() => {
    const timer = setTimeout(onSuccess, 4000);
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <div className="mb-8 bg-primary/5 rounded-2xl px-12 py-5">
        <span className="text-6xl font-bold font-heading text-primary">{amount} €</span>
      </div>

      <div className="relative mb-10">
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" style={{ animationDuration: '2.5s' }} />
        <div className="relative w-36 h-36 rounded-full bg-card flex items-center justify-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <img src={contactlessIcon} alt="Kontaktlos" className="w-24 h-24 object-contain animate-pulse-gentle" />
        </div>
      </div>

      <p className="text-3xl font-semibold font-heading text-foreground text-center leading-relaxed max-w-xl mb-3">
        Bitte Karte oder Smartphone an das Lesegerät halten
      </p>

      <p className="text-xl text-muted-foreground">
        Warten auf Zahlung…
      </p>

      <div className="mt-6 flex gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-primary/40"
            style={{
              animation: `pulse-gentle 1.5s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default PaymentScreen;
