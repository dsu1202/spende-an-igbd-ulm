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
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold font-heading text-foreground">
          Wofür möchtest du spenden?
        </h1>
        <p className="text-3xl text-muted-foreground mt-2">
          Za šta želiš dati sadaku?
        </p>
      </div>

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
