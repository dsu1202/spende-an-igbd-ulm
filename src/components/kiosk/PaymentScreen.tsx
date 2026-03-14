import { useEffect, useState, useCallback } from "react";
import { MoveRight, CreditCard, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  amount: number;
  purpose: string;
  onSuccess: () => void;
}

const SUMUP_AFFILIATE_KEY = "sup_afk_PYhm1NegyIYiml8qmL3d17PUYhQQ2Dxu";

const PaymentScreen = ({ amount, purpose, onSuccess }: Props) => {
  const [showRetry, setShowRetry] = useState(false);

  const buildSumUpDeepLink = useCallback(() => {
    const params = new URLSearchParams({
      "amount": amount.toFixed(2),
      "currency": "EUR",
      "title": purpose || "Spende",
      "affiliate-key": SUMUP_AFFILIATE_KEY,
      "callback": window.location.href,
    });
    return `sumupmerchant://pay/1.0?${params.toString()}`;
  }, [amount, purpose]);

  const startPayment = useCallback(() => {
    setShowRetry(false);
    const deepLink = buildSumUpDeepLink();
    window.location.href = deepLink;
    const retryTimer = setTimeout(() => setShowRetry(true), 3000);
    return () => clearTimeout(retryTimer);
  }, [buildSumUpDeepLink]);

  // Auto-start payment on mount
  useEffect(() => {
    startPayment();
  }, [startPayment]);

  // Listen for return from SumUp app
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const timer = setTimeout(onSuccess, 1500);
        return () => clearTimeout(timer);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [onSuccess]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-12 animate-fade-in gap-10">
      {/* Amount */}
      <div className="rounded-full bg-primary/10 backdrop-blur-sm px-14 py-5 border border-primary/20">
        <span className="text-7xl font-extrabold font-heading text-primary tracking-tight">{amount} €</span>
      </div>

      {/* Instruction card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-14 py-10 max-w-2xl w-full">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-primary-foreground/5" />

          <div className="relative flex items-center justify-between gap-8">
            <div className="space-y-2">
              <p className="text-3xl font-bold font-heading leading-snug">
                Bitte die Zahlung in der SumUp App abschließen
              </p>
              <p className="text-lg opacity-80">
                Halte deine Karte an das Lesegerät
              </p>
            </div>
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center">
              <MoveRight className="w-10 h-10 animate-bounce-right" strokeWidth={2.5} />
            </div>
          </div>

          {showRetry && (
            <div className="relative mt-8 flex flex-col items-center gap-4">
              <p className="text-base opacity-70">SumUp App nicht geöffnet?</p>
              <div className="flex gap-4">
                <Button
                  onClick={startPayment}
                  variant="secondary"
                  className="rounded-xl px-6 py-3 text-lg font-semibold gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Erneut versuchen
                </Button>
                <Button
                  onClick={onSuccess}
                  variant="ghost"
                  className="rounded-xl px-6 py-3 text-lg font-semibold text-primary-foreground/70 hover:text-primary-foreground"
                >
                  Überspringen
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentScreen;
