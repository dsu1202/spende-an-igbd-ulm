import { useState, useCallback, useEffect, useRef } from "react";
import StartScreen from "./StartScreen";
import AmountScreen from "./AmountScreen";
import PaymentScreen from "./PaymentScreen";
import ThankYouScreen from "./ThankYouScreen";

type Screen = "start" | "amount" | "payment" | "thankyou";

const INACTIVITY_TIMEOUT = 30000;

const KioskApp = () => {
  const [screen, setScreen] = useState<Screen>("start");
  const [amount, setAmount] = useState(0);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setScreen("start");
      setAmount(0);
    }, INACTIVITY_TIMEOUT);
  }, []);

  // Start/reset inactivity timer on amount screen
  useEffect(() => {
    if (screen === "amount") {
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
        <StartScreen onStart={() => setScreen("amount")} />
      )}
      {screen === "amount" && (
        <AmountScreen
          onConfirm={(a) => {
            setAmount(a);
            setScreen("payment");
          }}
        />
      )}
      {screen === "payment" && (
        <PaymentScreen amount={amount} purpose="" onSuccess={() => setScreen("thankyou")} onCancel={() => { setAmount(0); setScreen("amount"); }} />
      )}
      {screen === "thankyou" && (
        <ThankYouScreen onReset={() => { setAmount(0); setScreen("amount"); }} />
      )}
    </div>
  );
};

export default KioskApp;
