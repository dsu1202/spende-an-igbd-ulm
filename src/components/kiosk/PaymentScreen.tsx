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
    <div className="flex flex-col items-center justify-center h-full px-16 animate-fade-in">
      {/* Amount badge */}
      <div className="mb-10 bg-primary/5 rounded-2xl px-10 py-4">
        <span className="text-5xl font-bold font-heading text-primary">{amount} €</span>
      </div>

      {/* Contactless icon with animated rings */}
      <div className="relative mb-12">
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" style={{ animationDuration: '2.5s' }} />
        <div className="relative w-32 h-32 rounded-full bg-card flex items-center justify-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <img src={contactlessIcon} alt="Kontaktlos" className="w-20 h-20 object-contain animate-pulse-gentle" />
        </div>
      </div>

      <p className="text-2xl font-semibold font-heading text-foreground text-center leading-relaxed max-w-lg mb-4">
        Bitte Karte oder Smartphone an das Lesegerät halten
      </p>

      <p className="text-lg text-muted-foreground">
        Warten auf Zahlung…
      </p>

      {/* Animated dots */}
      <div className="mt-8 flex gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-primary/40"
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
