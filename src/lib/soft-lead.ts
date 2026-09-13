/**
 * Contact-gated soft-lead capture for abandoned quote/booking forms.
 * One session key → debounced upserts + pagehide beacon. Low traffic to BB.
 */

const SESSION_STORAGE_KEY = "bb_soft_lead_session";
const DEBOUNCE_MS = 2500;

export type SoftLeadSnapshot = {
  customer_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  service_type?: string;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  intent?: "quote" | "book";
  property?: Record<string, unknown>;
  quote?: Record<string, unknown>;
  attribution?: Record<string, unknown>;
  last_step?: string;
};

export function getSoftLeadSessionKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, key);
    return key;
  } catch {
    return `sl_${Date.now().toString(36)}`;
  }
}

export function hasSoftLeadContact(email?: string, phone?: string): boolean {
  const emailOk =
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const phoneOk =
    typeof phone === "string" && phone.replace(/\D/g, "").length >= 10;
  return emailOk || phoneOk;
}

function buildBody(snapshot: SoftLeadSnapshot, sessionKey: string) {
  return JSON.stringify({
    session_key: sessionKey,
    customer_name: snapshot.customer_name || undefined,
    email: snapshot.email || undefined,
    phone: snapshot.phone || undefined,
    address: snapshot.address || undefined,
    service_type: snapshot.service_type || undefined,
    preferred_date: snapshot.preferred_date || undefined,
    preferred_time: snapshot.preferred_time || undefined,
    notes: snapshot.notes || undefined,
    intent: snapshot.intent,
    property: snapshot.property,
    quote: snapshot.quote,
    attribution: snapshot.attribution,
    last_step: snapshot.last_step,
  });
}

async function postSoftLead(
  endpoint: string,
  snapshot: SoftLeadSnapshot,
  sessionKey: string,
  keepalive = false,
) {
  if (!hasSoftLeadContact(snapshot.email, snapshot.phone)) return;
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: buildBody(snapshot, sessionKey),
      keepalive,
    });
  } catch {
    // Best-effort — never block the UI.
  }
}

/**
 * Debounced soft-lead saver + pagehide flush.
 * Call `schedule(snapshot)` whenever form fields change; call `flush`/`dispose` on unmount.
 */
export function createSoftLeadTracker(options?: {
  endpoint?: string;
  debounceMs?: number;
}) {
  const endpoint = options?.endpoint ?? "/api/leads/partial";
  const debounceMs = options?.debounceMs ?? DEBOUNCE_MS;
  const sessionKey = getSoftLeadSessionKey();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latest: SoftLeadSnapshot | null = null;
  let disposed = false;

  const flush = (keepalive = false) => {
    if (disposed || !latest) return;
    const snap = latest;
    void postSoftLead(endpoint, snap, sessionKey, keepalive);
  };

  const onPageHide = () => flush(true);
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush(true);
  };

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
  }

  return {
    sessionKey,
    schedule(snapshot: SoftLeadSnapshot) {
      if (disposed) return;
      latest = snapshot;
      if (!hasSoftLeadContact(snapshot.email, snapshot.phone)) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        flush(false);
      }, debounceMs);
    },
    flush,
    dispose() {
      disposed = true;
      if (timer) clearTimeout(timer);
      timer = null;
      if (typeof window !== "undefined") {
        window.removeEventListener("pagehide", onPageHide);
        document.removeEventListener("visibilitychange", onVisibility);
      }
    },
  };
}
