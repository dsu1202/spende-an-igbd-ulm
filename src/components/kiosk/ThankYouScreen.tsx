import { useEffect } from "react";
import { Check } from "lucide-react";

interface Props {
  onReset: () => void;
}

const ThankYouScreen = ({ onReset }: Props) => {
  useEffect(() => {
    const timer = setTimeout(onReset, 4000);
    return () => clearTimeout(timer);
  }, [onReset]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      {/* Success icon */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg mb-8">
        <Check className="w-14 h-14 text-primary-foreground" strokeWidth={3} />
      </div>

      <div className="text-center mb-14">
        <h1 className="text-4xl font-extrabold font-heading text-foreground tracking-tight">
          Vielen Dank für deine Spende!
        </h1>
        <p className="text-3xl text-muted-foreground mt-2">
          Hvala puno na tvojoj donaciji!
        </p>
      </div>

      <div className="text-center space-y-4 max-w-xl">
        <div className="space-y-1">
          <p className="text-xl text-muted-foreground italic">
            „Was ihr an Gutem spendet, kommt euch selbst zugute."
          </p>
          <p className="text-base text-muted-foreground font-medium">(2:272)</p>
        </div>
        <div className="space-y-1">
          <p className="text-xl text-muted-foreground italic">
            „Što god udijelite od dobra, to je za vaše dobro."
          </p>
          <p className="text-base text-muted-foreground font-medium">(2:272)</p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouScreen;
