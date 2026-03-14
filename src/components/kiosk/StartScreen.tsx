import mosqueLogo from "@/assets/mosque-logo.png";

interface Props {
  onStart: () => void;
}

const StartScreen = ({ onStart }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <img src={mosqueLogo} alt="Moschee Logo" className="w-36 h-36 mb-8 object-contain" />

      <div className="text-center max-w-2xl space-y-4 mb-14">
        <p className="text-3xl font-extrabold font-heading text-foreground leading-relaxed tracking-tight">
          Unterstütze mit deiner Spende gute Zwecke.
        </p>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Podrži dobra djela svojom sadakom.
        </p>
      </div>

      <button
        onClick={onStart}
        className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/85 text-primary-foreground font-heading font-extrabold text-2xl px-16 py-6 rounded-full active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary-foreground/10" />
        <span className="relative">Spenden starten</span>
      </button>
    </div>
  );
};

export default StartScreen;
