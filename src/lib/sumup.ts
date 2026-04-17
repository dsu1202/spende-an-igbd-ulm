/**
 * SumUp Bridge
 * -----------
 * Contract between the web UI and the native Android SumUp SDK.
 *
 * In the Android kiosk app, a Kotlin JS interface named `SumUpBridge` is
 * injected into the WebView. It exposes `startPayment(jsonRequest)` and
 * posts results back via `window.__sumupResult(jsonResponse)`.
 *
 * In a regular browser (dev), we fall back to a mock that prompts the
 * developer to simulate success / failure / cancel.
 */

export type PaymentStatus = "success" | "failed" | "cancelled";

export type PaymentErrorCode =
  | "DECLINED"          // card declined by issuer
  | "CANCELLED"         // user aborted
  | "NO_READER"         // Solo not connected / Bluetooth off
  | "NOT_LOGGED_IN"     // SumUp merchant not logged in
  | "TIMEOUT"           // payment didn't complete in time
  | "NETWORK"           // no internet connection to SumUp backend
  | "INVALID_AMOUNT"    // amount < min or > max per SumUp rules
  | "SDK_ERROR"         // unexpected SDK error
  | "UNKNOWN";          // everything else

export interface PaymentRequest {
  amount: number;
  currency: "EUR";
  purpose: { de: string; bs: string };
  purposeId?: string;
}

export interface PaymentResult {
  status: PaymentStatus;
  txCode?: string;           // SumUp transaction code on success
  errorCode?: PaymentErrorCode;
  errorMessage?: string;
}

// Shape injected by the Android WebView
interface NativeSumUpBridge {
  startPayment: (requestJson: string) => void;
  isAvailable?: () => boolean;
}

declare global {
  interface Window {
    SumUpBridge?: NativeSumUpBridge;
    __sumupResult?: (resultJson: string) => void;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** True when running inside the Android kiosk WebView with the native SDK. */
export const isNativeBridgeAvailable = (): boolean =>
  typeof window !== "undefined" && !!window.SumUpBridge;

/**
 * Start a payment. Returns a promise that resolves with the final result.
 * Never throws — all errors are reflected in `result.status` / `errorCode`.
 */
export const startPayment = (req: PaymentRequest): Promise<PaymentResult> => {
  if (isNativeBridgeAvailable()) {
    return startPaymentNative(req);
  }
  return startPaymentMock(req);
};

// ---------------------------------------------------------------------------
// Native (Android WebView)
// ---------------------------------------------------------------------------

const startPaymentNative = (req: PaymentRequest): Promise<PaymentResult> =>
  new Promise((resolve) => {
    // Android calls window.__sumupResult(json) when finished.
    let settled = false;

    const settle = (result: PaymentResult) => {
      if (settled) return;
      settled = true;
      window.__sumupResult = undefined;
      resolve(result);
    };

    window.__sumupResult = (json: string) => {
      try {
        const parsed = JSON.parse(json) as PaymentResult;
        settle(parsed);
      } catch (e) {
        settle({
          status: "failed",
          errorCode: "SDK_ERROR",
          errorMessage: "Invalid response from native bridge",
        });
      }
    };

    // Safety net: if native never responds within 5 min, fail gracefully.
    setTimeout(() => {
      settle({
        status: "failed",
        errorCode: "TIMEOUT",
        errorMessage: "No response from card reader",
      });
    }, 5 * 60 * 1000);

    try {
      window.SumUpBridge!.startPayment(JSON.stringify(req));
    } catch (e) {
      settle({
        status: "failed",
        errorCode: "SDK_ERROR",
        errorMessage: e instanceof Error ? e.message : "Bridge error",
      });
    }
  });

// ---------------------------------------------------------------------------
// Mock (browser dev)
// ---------------------------------------------------------------------------

const startPaymentMock = (req: PaymentRequest): Promise<PaymentResult> =>
  new Promise((resolve) => {
    // Simulate reader delay
    setTimeout(() => {
      const choice = window.prompt(
        `[DEV MOCK] SumUp payment for ${req.amount} € — type one of:\n` +
          `  s = success\n  d = declined\n  c = cancelled\n  n = no reader`,
        "s",
      );
      switch ((choice || "").trim().toLowerCase()) {
        case "d":
          resolve({
            status: "failed",
            errorCode: "DECLINED",
            errorMessage: "Card was declined (mock)",
          });
          break;
        case "c":
          resolve({ status: "cancelled", errorCode: "CANCELLED" });
          break;
        case "n":
          resolve({
            status: "failed",
            errorCode: "NO_READER",
            errorMessage: "No SumUp reader connected (mock)",
          });
          break;
        default:
          resolve({
            status: "success",
            txCode: `MOCK-${Date.now()}`,
          });
      }
    }, 800);
  });
