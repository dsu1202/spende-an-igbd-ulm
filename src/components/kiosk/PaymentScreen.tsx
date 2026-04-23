import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import { startPayment, type PaymentResult } from "@/lib/sumup";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  amount: number;
  purpose: { de: string; bs: string };
  purposeId?: string;
  onSuccess: () => void;
  onBack: () => void;
}

type UiState =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "error"; code: string; message: string }
  | { kind: "success" };

const ERROR_COPY: Record<string, { de: string; bs: string }> = {
  DECLINED: {
    de: "Karte wurde abgelehnt. Bitte versuche eine andere Karte.",
    bs: "Kartica je odbijena. Molimo pokušajte drugom karticom.",
  },
  NO_READER: {
    de: "Kartenlesegerät nicht verbunden.",
    bs: "Čitač kartica nije povezan.",
  },
  NOT_LOGGED_IN: {
    de: "SumUp nicht eingerichtet. Bitte Administrator informieren.",
    bs: "SumUp nije podešen. Obavijestite administratora.",
  },
  TIMEOUT: {
    de: "Zeitüberschreitung. Bitte erneut versuchen.",
    bs: "Vrijeme je isteklo. Molimo pokušajte ponovo.",
  },
  NETWORK: {
    de: "Keine Verbindung zum Zahlungsdienst.",
    bs: "Nema veze sa servisom plaćanja.",
  },
  INVALID_AMOUNT: {
    de: "Betrag ungültig.",
    bs: "Iznos nije valjan.",
  },
  SDK_ERROR: {
    de: "Technischer Fehler. Bitte erneut versuchen.",
    bs: "Tehnička greška. Molimo pokušajte ponovo.",
  },
  UNKNOWN: {
    de: "Ein Fehler ist aufgetreten.",
    bs: "Došlo je do greške.",
  },
};

const errorMsg = (code?: string) => {
  const c = code && ERROR_COPY[code] ? code : "UNKNOWN";
  return ERROR_COPY[c];
};

const logDonation = async (
  amount: number,
  purpose: { de: string; bs: string },
  purposeId: string | undefined,
  result: PaymentResult,
) => {
  try {
    await supabase.from("donations").insert({
      amount,
      currency: "EUR",
      purpose_id: purposeId ?? null,
      purpose_title_de: purpose.de,
      purpose_title_bs: purpose.bs,
      status: result.status,
      sumup_tx_code: result.txCode ?? null,
      error_code: result.errorCode ?? null,
      error_message: result.errorMessage ?? null,
    });
  } catch (e) {
    // Logging must never break the payment UX.
    // Native app also keeps a local log, so we don't lose data.
    // eslint-disable-next-line no-console
    console.error("Failed to log donation", e);
  }
};

const PaymentScreen = ({ amount, purpose, purposeId, onSuccess, onBack }: Props) => {
  const [state, setState] = useState<UiState>({ kind: "idle" });
  const startedRef = useRef(false);

  const run = async () => {
    setState({ kind: "processing" });
    const result = await startPayment({
      amount,
      currency: "EUR",
      purpose,
      purposeId,
    });
    await logDonation(amount, purpose, purposeId, result);

    if (result.status === "success") {
      setState({ kind: "success" });
      onSuccess();
    } else if (result.status === "cancelled") {
      // Silent back — user tapped cancel on the reader
      onBack();
    } else {
      setState({
        kind: "error",
        code: result.errorCode ?? "UNKNOWN",
        message: result.errorMessage ?? "",
      });
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    startedRef.current = true;
    run();
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-12 animate-fade-in">
      <div className="rounded-full bg-primary/10 backdrop-blur-sm px-14 py-5 border border-primary/20 mb-4">
        <span className="text-7xl font-extrabold font-heading text-primary tracking-tight">
          {amount} €
        </span>
      </div>
      <p className="text-2xl font-semibold text-foreground mb-1">für {purpose.de}</p>
      <p className="text-2xl text-muted-foreground mb-10">za {purpose.bs}</p>

      {/* Reassurance banner — shown on both error and payment states */}
      <div className="flex items-center gap-3 bg-muted/60 border border-border rounded-2xl px-6 py-3 max-w-3xl w-full mb-6 text-muted-foreground">
        <ShieldCheck className="w-6 h-6 flex-shrink-0 text-primary" />
        <div>
          <p className="text-base font-medium leading-snug">
            Bitte bezahlen Sie am Kartenlesegerät neben diesem Tablet. Ihre Kartendaten werden nicht auf dem Tablet gespeichert.
          </p>
          <p className="text-sm opacity-75 leading-snug mt-0.5">
            Molimo platite na čitaču kartica pored tableta. Podaci o kartici se ne čuvaju na tabletu.
          </p>
        </div>
      </div>

      {state.kind === "error" ? (
        <div className="relative overflow-hidden rounded-3xl bg-destructive/10 border-2 border-destructive/40 text-foreground px-14 py-10 max-w-3xl w-full">
          <div className="flex items-start gap-5">
            <AlertTriangle className="w-10 h-10 text-destructive flex-shrink-0 mt-1" />
            <div className="flex-1 space-y-2">
              <p className="text-2xl font-bold font-heading leading-snug">
                {errorMsg(state.code).de}
              </p>
              <p className="text-xl opacity-70 leading-snug">
                {errorMsg(state.code).bs}
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={retry}
                  className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full flex items-center gap-2 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Erneut versuchen · Pokušaj ponovo
                </button>
                <button
                  onClick={onBack}
                  className="text-primary bg-primary/10 font-bold px-6 py-3 rounded-full active:scale-95 transition-all"
                >
                  Abbrechen · Odustani
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-14 py-10 max-w-3xl w-full">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-primary-foreground/5" />

          <div className="relative flex items-center justify-between gap-8">
            {/* Text */}
            <div className="space-y-3 flex-1">
              <p className="text-3xl font-bold font-heading leading-snug">
                Halte deine Karte an das Kartenlesegerät
              </p>
              <p className="text-2xl opacity-80 leading-snug">
                Prisloni svoju karticu na čitač kartica
              </p>
            </div>

            {/* Card reader animation + arrow */}
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="15" y="20" width="70" height="100" rx="12" className="fill-primary-foreground/20 stroke-primary-foreground/50" strokeWidth="1.5" />
                  <rect x="25" y="28" width="50" height="30" rx="6" className="fill-primary-foreground/10 stroke-primary-foreground/30" strokeWidth="1" />
                  <path d="M42 75 Q50 68 58 75" className="stroke-primary-foreground/60" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M38 70 Q50 60 62 70" className="stroke-primary-foreground/40" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M34 65 Q50 52 66 65" className="stroke-primary-foreground/25" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <circle cx="50" cy="78" r="2.5" className="fill-primary-foreground/50" />
                </svg>

                <svg viewBox="0 0 60 40" className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 animate-tap-phone" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="52" height="32" rx="5" className="fill-primary-foreground/80 stroke-primary-foreground" strokeWidth="1.5" />
                  <rect x="12" y="14" width="10" height="8" rx="1.5" className="fill-primary/40 stroke-primary/60" strokeWidth="0.8" />
                  <rect x="30" y="12" width="18" height="3" rx="1" className="fill-primary-foreground/40" />
                  <rect x="30" y="18" width="12" height="3" rx="1" className="fill-primary-foreground/30" />
                </svg>

                <div className="absolute top-6 left-1/2 -translate-x-1/2 animate-nfc-pulse">
                  <div className="w-5 h-5 rounded-full bg-primary-foreground/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentScreen;
