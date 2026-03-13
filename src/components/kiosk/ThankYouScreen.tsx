import { useEffect } from "react";
import { CheckCircle } from "lucide-react";

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
      <CheckCircle className="w-28 h-28 text-primary mb-10" strokeWidth={1.5} />

      <div className="text-center space-y-4 mb-10">
        <p className="text-2xl font-semibold font-heading text-foreground">
          Möge deine Spende angenommen werden.
        </p>
        <p className="text-xl text-muted-foreground italic">
          Taqabbal minna wa minkum.
        </p>
        <p className="text-xl text-muted-foreground">
          Neka tvoja sadaka bude primljena.
        </p>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg text-muted-foreground">
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
