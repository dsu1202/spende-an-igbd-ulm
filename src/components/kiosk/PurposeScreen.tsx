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
    <div className="flex flex-col items-center justify-center h-full px-16 animate-fade-in">
      <h1 className="text-3xl font-bold font-heading text-foreground mb-14">
        Wofür möchtest du spenden?
      </h1>

      <div className="w-full max-w-5xl grid grid-cols-3 gap-6">
        {purposes.map((purpose) => (
          <button
            key={purpose}
            onClick={() => onSelect(purpose)}
            className="kiosk-card aspect-video text-center text-xl font-semibold font-body text-foreground flex items-center justify-center px-6"
          >
            {purpose}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PurposeScreen;
