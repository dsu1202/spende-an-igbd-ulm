import { useEffect, useCallback, useState, useRef } from "react";
import { MoveRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  amount: number;
  purpose: string;
  onSuccess: () => void;
}

type CheckoutStatus = "creating" | "pending" | "paid" | "failed";

const POLL_INTERVAL = 2000;

const PaymentScreen = ({ amount, purpose, onSuccess }: Props) => {
  const [status, setStatus] = useState<CheckoutStatus>("creating");
  const [error, setError] = useState<string | null>(null);
  const checkoutIdRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    if (!checkoutIdRef.current) return;

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "sumup-checkout",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          body: undefined,
        }
      );

      // Use fetch directly for GET with query params
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sumup-checkout?action=status&id=${checkoutIdRef.current}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const checkout = await res.json();

      if (checkout.status === "PAID") {
        setStatus("paid");
        stopPolling();
        setTimeout(onSuccess, 1500);
      } else if (checkout.status === "FAILED" || checkout.status === "EXPIRED") {
        setStatus("failed");
        setError("Zahlung fehlgeschlagen");
        stopPolling();
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, [onSuccess, stopPolling]);

  const createCheckout = useCallback(async () => {
    setStatus("creating");
    setError(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sumup-checkout?action=create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            currency: "EUR",
            description: purpose || "Spende",
          }),
        }
      );

      const checkout = await res.json();

      if (checkout.error) {
        throw new Error(checkout.error);
      }

      checkoutIdRef.current = checkout.id;
      setStatus("pending");

      // Start polling for payment status
      pollingRef.current = setInterval(pollStatus, POLL_INTERVAL);
    } catch (err) {
      console.error("Checkout creation error:", err);
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen");
    }
  }, [amount, purpose, pollStatus]);

  useEffect(() => {
    createCheckout();
    return () => stopPolling();
  }, [createCheckout, stopPolling]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in gap-10">
      {/* Amount */}
      <div className="rounded-full bg-primary/10 backdrop-blur-sm px-14 py-5 border border-primary/20">
        <span className="text-7xl font-extrabold font-heading text-primary tracking-tight">
          {amount} €
        </span>
      </div>

      {/* Status card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-14 py-10 max-w-2xl w-full">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-primary-foreground/5" />

        <div className="relative flex items-center justify-between gap-8">
          <div className="space-y-2">
            {status === "creating" && (
              <p className="text-3xl font-bold font-heading leading-snug">
                Zahlung wird vorbereitet…
              </p>
            )}
            {status === "pending" && (
              <p className="text-3xl font-bold font-heading leading-snug">
                Halte deine Karte an das Kartenlesegerät zum Spenden
              </p>
            )}
            {status === "paid" && (
              <p className="text-3xl font-bold font-heading leading-snug">
                Zahlung erfolgreich! ✓
              </p>
            )}
            {status === "failed" && (
              <p className="text-3xl font-bold font-heading leading-snug">
                {error || "Zahlung fehlgeschlagen"}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center">
            {(status === "creating" || status === "pending") ? (
              status === "creating" ? (
                <Loader2 className="w-10 h-10 animate-spin" strokeWidth={2.5} />
              ) : (
                <MoveRight className="w-10 h-10 animate-bounce-right" strokeWidth={2.5} />
              )
            ) : null}
          </div>
        </div>
      </div>

      {status === "failed" && (
        <button
          onClick={createCheckout}
          className="text-lg font-semibold text-primary bg-primary/10 px-8 py-3 rounded-full hover:bg-primary/15 transition-colors"
        >
          Erneut versuchen
        </button>
      )}
    </div>
  );
};

export default PaymentScreen;
