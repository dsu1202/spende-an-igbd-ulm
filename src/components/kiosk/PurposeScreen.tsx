import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onSelect: (purpose: { de: string; bs: string }) => void;
}

const fallbackPurposes = [
  { de: "Projekt Vakuf", bs: "Projekat Vakuf" },
  { de: "Spende an die Moschee", bs: "Sadaka za džamiju" },
  { de: "Spende an hilfsbedürftige Kinder in Bosnien", bs: "Sadaka za djecu u potrebi u Bosni" },
];

const PurposeScreen = ({ onSelect }: Props) => {
  const [purposes, setPurposes] = useState<{ de: string; bs: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("donation_purposes")
        .select("title_de, title_bs")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error || !data || data.length === 0) {
        setPurposes(fallbackPurposes);
      } else {
        setPurposes(data.map((d) => ({ de: d.title_de, bs: d.title_bs })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      <div className={`w-full max-w-4xl flex justify-center gap-8`}>
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
            <span className="relative text-2xl opacity-75 text-center leading-snug">
              {purpose.bs}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PurposeScreen;
