import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import StartScreen from "./StartScreen";
import PurposeScreen from "./PurposeScreen";
import AmountScreen from "./AmountScreen";
import PaymentScreen from "./PaymentScreen";
import ThankYouScreen from "./ThankYouScreen";

type Screen = "start" | "purpose" | "amount" | "payment" | "thankyou";

interface PurposeItem {
  id?: string;
  de: string;
  bs: string;
}

const INACTIVITY_TIMEOUT = 15000;

const KioskApp = () => {
  const [screen, setScreen] = useState<Screen>("start");
  const [purpose, setPurpose] = useState<PurposeItem>({ de: "", bs: "" });
  const [amount, setAmount] = useState(0);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setScreen("start");
      setAmount(0);
      setPurpose({ de: "", bs: "" });
    }, INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    if (screen === "purpose" || screen === "amount") {
      resetInactivityTimer();

      const onInteraction = () => resetInactivityTimer();
      window.addEventListener("pointerdown", onInteraction);
      window.addEventListener("keydown", onInteraction);

      return () => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        window.removeEventListener("pointerdown", onInteraction);
        window.removeEventListener("keydown", onInteraction);
      };
    } else {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    }
  }, [screen, resetInactivityTimer]);

  // Shared top-left back button — rendered once at a fixed viewport position
  // so it stays in the exact same spot on every screen that needs it.
  const showBack = screen === "amount" || screen === "payment";
  const handleBack = () => {
    if (screen === "amount") setScreen("purpose");
    else if (screen === "payment") setScreen("amount");
  };

  return (
    <div className={`h-full w-full overflow-hidden${showBack ? " pt-20" : ""}`}>
      {showBack && (
        <button
          onClick={handleBack}
          aria-label="Zurück"
          className="fixed top-6 left-6 z-50 text-lg font-semibold text-primary bg-primary/10 px-6 py-3 rounded-full hover:bg-primary/15 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück · Nazad
        </button>
      )}

      {screen === "start" && (
        <StartScreen onStart={() => setScreen("purpose")} />
      )}
      {screen === "purpose" && (
        <PurposeScreen onSelect={(p) => { setPurpose(p); setScreen("amount"); }} />
      )}
      {screen === "amount" && (
        <AmountScreen
          purpose={purpose}
          onConfirm={(a) => {
            setAmount(a);
            setScreen("payment");
          }}
        />
      )}
      {screen === "payment" && (
        <PaymentScreen
          amount={amount}
          purpose={purpose}
          purposeId={purpose.id}
          onSuccess={() => setScreen("thankyou")}
          onBack={() => setScreen("amount")}
        />
      )}
      {screen === "thankyou" && (
        <ThankYouScreen onReset={() => { setAmount(0); setPurpose({ de: "", bs: "" }); setScreen("purpose"); }} />
      )}
    </div>
  );
};

export default KioskApp;
