import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "pendingDonations";
const FLUSH_TIMEOUT_MS = 4000;

export interface QueuedDonation {
  amount: number;
  currency: string;
  purpose_id: string | null;
  purpose_title_de: string;
  purpose_title_bs: string;
  status: string;
  sumup_tx_code: string | null;
  error_code: string | null;
  error_message: string | null;
  device_name: string | null;
  created_at: string;
}

const readQueue = (): QueuedDonation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedDonation[]) : [];
  } catch {
    return [];
  }
};

const writeQueue = (items: QueuedDonation[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be full or unavailable — nothing we can do
  }
};

const enqueue = (donation: QueuedDonation) => {
  const queue = readQueue();
  queue.push(donation);
  writeQueue(queue);
};

const withTimeout = <T,>(p: PromiseLike<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    Promise.resolve(p).then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });

/**
 * Try to insert the donation immediately. If it fails (offline, timeout,
 * server error), buffer it in localStorage so it can be retried later.
 * Never throws.
 */
export const logDonationOrQueue = async (d: QueuedDonation): Promise<void> => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    enqueue(d);
    return;
  }
  try {
    const { error } = await withTimeout(
      supabase.from("donations").insert(d),
      FLUSH_TIMEOUT_MS,
    );
    if (error) {
      enqueue(d);
    }
  } catch {
    enqueue(d);
  }
};

/**
 * Flush any queued donations to the backend. Safe to call on app start
 * and whenever the network becomes available again.
 */
export const flushDonationQueue = async (): Promise<void> => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: QueuedDonation[] = [];
  for (const d of queue) {
    try {
      const { error } = await withTimeout(
        supabase.from("donations").insert(d),
        FLUSH_TIMEOUT_MS,
      );
      if (error) remaining.push(d);
    } catch {
      remaining.push(d);
      // Stop early — network is probably gone again
      writeQueue([...remaining, ...queue.slice(queue.indexOf(d) + 1)]);
      return;
    }
  }
  writeQueue(remaining);
};

export const getPendingDonationCount = (): number => readQueue().length;

/** Register listeners so the queue flushes whenever the network returns. */
export const startDonationQueueAutoFlush = () => {
  if (typeof window === "undefined") return;
  // Initial flush
  void flushDonationQueue();
  window.addEventListener("online", () => { void flushDonationQueue(); });
};