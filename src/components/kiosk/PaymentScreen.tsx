import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-14 py-12 max-w-3xl w-full">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-primary-foreground/5" />

          <div className="relative flex flex-col items-center text-center gap-6">
            {/* Spinner */}
            <div
              className="w-16 h-16 rounded-full border-4 border-primary-foreground/30 border-t-primary-foreground animate-spin"
              aria-hidden="true"
            />

            {/* Status text */}
            <div className="space-y-2">
              <p className="text-3xl font-bold font-heading leading-snug">
                Zahlung läuft – bitte Anweisungen am Kartenlesegerät folgen
              </p>
              <p className="text-2xl opacity-80 leading-snug">
                Plaćanje u toku – slijedi upute na čitaču kartica
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentScreen;
