import { useState, useCallback, useEffect, useRef } from "react";
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

const INACTIVITY_TIMEOUT = 30000;

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

  return (
    <div className="h-full w-full overflow-hidden">
      {screen === "start" && (
        <StartScreen onStart={() => setScreen("purpose")} />
      )}
      {screen === "purpose" && (
        <PurposeScreen onSelect={(p) => { setPurpose(p); setScreen("amount"); }} />
      )}
      {screen === "amount" && (
        <AmountScreen
          onConfirm={(a) => {
            setAmount(a);
            setScreen("payment");
          }}
          onBack={() => setScreen("purpose")}
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
