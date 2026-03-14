import { useState, useCallback } from "react";
import StartScreen from "./StartScreen";
import AmountScreen from "./AmountScreen";
import PaymentScreen from "./PaymentScreen";
import ThankYouScreen from "./ThankYouScreen";

type Screen = "start" | "amount" | "payment" | "thankyou";

const KioskApp = () => {
  const [screen, setScreen] = useState<Screen>("start");
  const [amount, setAmount] = useState(0);

  const reset = useCallback(() => {
    setScreen("start");
    setAmount(0);
  }, []);

  return (
    <div className="h-full w-full overflow-hidden">
      {screen === "start" && (
        <StartScreen onStart={() => setScreen("amount")} />
      )}
      {screen === "amount" && (
        <AmountScreen
          onBack={() => setScreen("start")}
          onConfirm={(a) => {
            setAmount(a);
            setScreen("payment");
          }}
        />
      )}
      {screen === "payment" && (
        <PaymentScreen amount={amount} purpose="" onSuccess={() => setScreen("thankyou")} />
      )}
      {screen === "thankyou" && <ThankYouScreen onReset={reset} />}
    </div>
  );
};

export default KioskApp;
