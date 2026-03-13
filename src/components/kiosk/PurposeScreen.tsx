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
      <h1 className="text-3xl font-bold font-heading text-foreground mb-12">
        Wofür möchtest du spenden?
      </h1>

      <div className="w-full max-w-2xl space-y-5">
        {purposes.map((purpose) => (
          <button
            key={purpose}
            onClick={() => onSelect(purpose)}
            className="kiosk-card w-full text-left text-xl font-semibold font-body text-foreground min-h-[100px] flex items-center"
          >
            {purpose}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PurposeScreen;
