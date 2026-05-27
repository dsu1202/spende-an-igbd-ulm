import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startDonationQueueAutoFlush } from "./lib/donationQueue";

createRoot(document.getElementById("root")!).render(<App />);

startDonationQueueAutoFlush();
