import mosqueLogo from "@/assets/mosque-logo.png";

interface Props {
  onStart: () => void;
}

const StartScreen = ({ onStart }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <img src={mosqueLogo} alt="Moschee Logo" className="w-40 h-40 mb-10 object-contain" />

      <div className="text-center max-w-2xl space-y-6 mb-12">
        <p className="text-2xl font-semibold font-heading text-foreground leading-relaxed">
          Unterstütze mit deiner Spende gute Zwecke.
        </p>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Podrži dobra djela svojom sadakom.
        </p>

        <div className="pt-4 space-y-3">
          <p className="text-lg text-muted-foreground italic leading-relaxed">
            „Was du an Gutem spendest, kommt dir selbst zugute."
            <br />
            <span className="text-base not-italic">(Qur'an 2:272)</span>
          </p>
          <p className="text-base text-muted-foreground italic leading-relaxed">
            „Što god udijeliš od dobra, to je za tvoje dobro."
            <br />
            <span className="text-sm not-italic">(Kur'an 2:272)</span>
          </p>
        </div>
      </div>

      <button
        onClick={onStart}
        className="bg-primary text-primary-foreground font-heading font-bold text-2xl px-16 py-6 rounded-2xl active:scale-95 transition-transform"
      >
        Spenden starten
      </button>
    </div>
  );
};

export default StartScreen;
