import { useEffect } from "react";
import contactlessIcon from "@/assets/contactless-icon.png";

interface Props {
  onSuccess: () => void;
}

const PaymentScreen = ({ onSuccess }: Props) => {
  // Simulate payment success after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onSuccess, 4000);
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <div className="animate-pulse-gentle mb-10">
        <img src={contactlessIcon} alt="Kontaktlos bezahlen" className="w-36 h-36 object-contain" />
      </div>

      <p className="text-2xl font-semibold font-heading text-foreground text-center leading-relaxed max-w-lg">
        Bitte Karte oder Smartphone auf das Kartenlesegerät halten.
      </p>

      <div className="mt-10 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-primary"
            style={{
              animation: `pulse-gentle 1.5s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default PaymentScreen;
