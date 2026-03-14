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
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in gap-8">
      {/* Success icon */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
        <Check className="w-14 h-14 text-primary-foreground" strokeWidth={3} />
      </div>

      <div className="text-center space-y-3">
        <p className="text-3xl font-extrabold font-heading text-foreground tracking-tight">
          Möge deine Spende angenommen werden.
        </p>
        <p className="text-xl text-muted-foreground italic">
          Taqabbal minna wa minkum.
        </p>
        <p className="text-xl text-muted-foreground">
          Neka tvoja sadaka bude primljena.
        </p>
      </div>

      <div className="text-center space-y-1 mt-2">
        <p className="text-lg text-muted-foreground font-medium">
          Vielen Dank für deine Unterstützung.
        </p>
        <p className="text-base text-muted-foreground">
          Hvala ti na tvojoj podršci.
        </p>
      </div>
    </div>
  );
};

export default ThankYouScreen;
