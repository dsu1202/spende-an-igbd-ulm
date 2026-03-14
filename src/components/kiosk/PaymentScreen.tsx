import { useEffect } from "react";
import { ArrowRight } from "lucide-react";

interface Props {
  amount: number;
  purpose: string;
  onSuccess: () => void;
}

const PaymentScreen = ({ amount, purpose, onSuccess }: Props) => {
  useEffect(() => {
    const timer = setTimeout(onSuccess, 6000);
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      {/* Top: Purpose & Amount */}
      <div className="text-center mb-12">
        <p className="text-xl text-muted-foreground mb-2">{purpose}</p>
        <span className="text-6xl font-bold font-heading text-primary">{amount} €</span>
      </div>

      {/* Center: Card instruction with arrow */}
      <div className="flex items-center gap-6 bg-primary text-primary-foreground rounded-2xl px-12 py-8 active:scale-95 transition-transform">
        <p className="text-2xl font-semibold font-heading leading-relaxed">
          Karte an das Kartenlesegerät halten zum Spenden
        </p>
        <ArrowRight className="w-10 h-10 flex-shrink-0 animate-pulse-gentle" />
      </div>

      {/* Animated dots */}
      <div className="mt-10 flex gap-3">
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
