import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  onConfirm: (amount: number) => void;
  onBack: () => void;
}

const amounts = [5, 10, 20, 50];

const AmountScreen = ({ onConfirm, onBack }: Props) => {
  const [selectedIndex, setSelectedIndex] = useState(2); // default 20€

  const handlePrev = () => {
    setSelectedIndex((i) => (i > 0 ? i - 1 : amounts.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((i) => (i < amounts.length - 1 ? i + 1 : 0));
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <h1 className="text-4xl font-extrabold font-heading text-foreground mb-20 tracking-tight">
        Wie viel möchtest du spenden?
      </h1>

      {/* Amount selector with arrows */}
      <div className="flex items-center gap-12 mb-20">
        <button
          onClick={handlePrev}
          className="w-16 h-16 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-8 h-8 text-foreground" />
        </button>

        <div className="rounded-full bg-primary/10 border border-primary/20 px-16 py-6 min-w-[240px] text-center">
          <span className="text-7xl font-extrabold font-heading text-primary tracking-tight">
            {amounts[selectedIndex]} €
          </span>
        </div>

        <button
          onClick={handleNext}
          className="w-16 h-16 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
        >
          <ChevronRight className="w-8 h-8 text-foreground" />
        </button>
      </div>

      {/* Confirm button */}
      <button
        onClick={() => onConfirm(amounts[selectedIndex])}
        className="bg-gradient-to-r from-primary to-primary/85 text-primary-foreground font-heading font-extrabold text-2xl px-16 py-5 rounded-full active:scale-95 transition-all shadow-lg"
      >
        Weiter
      </button>
    </div>
  );
};

export default AmountScreen;
