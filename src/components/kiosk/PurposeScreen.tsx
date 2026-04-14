interface Props {
  onSelect: (purpose: { de: string; bs: string }) => void;
}

const purposes = [
  { de: "Projekt Vakuf", bs: "Projekat Vakuf" },
  { de: "Spende an die Moschee", bs: "Sadaka za džamiju" },
  { de: "Spende an hilfsbedürftige Kinder in Bosnien", bs: "Sadaka za djecu u potrebi u Bosni" },
];

const PurposeScreen = ({ onSelect }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-extrabold font-heading text-foreground tracking-tight">
          Wofür möchtest du spenden?
        </h1>
        <p className="text-3xl text-muted-foreground mt-2">
          Za šta želiš dati sadaku?
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-3 gap-8">
        {purposes.map((purpose) => (
          <button
            key={purpose.de}
            onClick={() => onSelect(purpose)}
            className="group relative overflow-hidden bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-3xl flex flex-col items-center justify-center aspect-square active:scale-95 transition-all duration-200 hover:shadow-lg px-8 gap-3"
          >
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary-foreground/10" />
            <span className="relative text-2xl font-extrabold font-heading text-center leading-snug">
              {purpose.de}
            </span>
            <span className="relative text-xl opacity-75 text-center leading-snug">
              {purpose.bs}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PurposeScreen;
