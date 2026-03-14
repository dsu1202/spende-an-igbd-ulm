import { useState, useCallback } from "react";
import StartScreen from "./StartScreen";
import PurposeScreen from "./PurposeScreen";
import AmountScreen from "./AmountScreen";
import PaymentScreen from "./PaymentScreen";
import ThankYouScreen from "./ThankYouScreen";

type Screen = "start" | "purpose" | "amount" | "payment" | "thankyou";

const KioskApp = () => {
  const [screen, setScreen] = useState<Screen>("start");
  const [_purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState(0);

  const reset = useCallback(() => {
    setScreen("start");
    setPurpose("");
    setAmount(0);
  }, []);

  return (
    <div className="h-full w-full overflow-hidden">
      {screen === "start" && (
        <StartScreen onStart={() => setScreen("purpose")} />
      )}
      {screen === "purpose" && (
        <PurposeScreen
          onSelect={(p) => {
            setPurpose(p);
            setScreen("amount");
          }}
        />
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
        <PaymentScreen amount={amount} purpose={_purpose} onSuccess={() => setScreen("thankyou")} />
      )}
      {screen === "thankyou" && <ThankYouScreen onReset={reset} />}
    </div>
  );
};

export default KioskApp;
