interface Props {
  onSelect: (purpose: string) => void;
}

const purposes = [
  "Projekt Vakuf",
  "Spende an die Moschee",
  "Spende an hilfsbedürftige Kinder in Bosnien",
];

const PurposeScreen = ({ onSelect }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <h1 className="text-4xl font-bold font-heading text-foreground mb-16">
        Wofür möchtest du spenden?
      </h1>

      <div className="w-full max-w-4xl grid grid-cols-3 gap-8">
        {purposes.map((purpose) => (
          <button
            key={purpose}
            onClick={() => onSelect(purpose)}
            className="kiosk-card aspect-video text-center text-2xl font-semibold font-body text-foreground flex items-center justify-center px-8"
          >
            {purpose}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PurposeScreen;
