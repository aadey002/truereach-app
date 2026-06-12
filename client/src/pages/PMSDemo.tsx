import { useState, useEffect, useRef } from "react";

// ── TrueReach Embedded Validation Engine ──────────────────────────────────
const trueReachValidate = async (phoneNumber: string) => {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return { status: "invalid", reason: "Incorrect digit count" };
  try {
    const response = await fetch('/api/validate-realtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber, country: 'US' })
    });
    const data = await response.json();
    if (!data.valid) {
      return { status: "invalid", reason: data.warnings?.[0] || "Number could not be validated" };
    }
    const smsCapable = data.can_receive_sms === true;
    const carrier = data.carrier || "Unknown";
    return { status: "valid", smsCapable, carrier };
  } catch (e) {
    return { status: "invalid", reason: "Validation service unavailable" };
  }
};

// ── Types ─────────────────────────────────────────────────────────────────
type ValidationStatus = "idle" | "checking" | "valid" | "landline" | "invalid";
interface StatusConfig {
  border: string;
  glow: string;
  badge: string | null;
  label: string;
}

// ── Color tokens ───────────────────────────────────────────────────────────
const STATUS: Record<ValidationStatus, StatusConfig> = {
  idle:     { border: "hsl(var(--border))", glow: "none",                           badge: null, label: "" },
  checking: { border: "hsl(var(--muted-foreground))", glow: "none",                           badge: "⟳",  label: "Validating…" },
  valid:    { border: "#22c55e", glow: "0 0 0 3px rgba(34,197,94,.25)",  badge: "✓",  label: "Valid & Textable" },
  landline: { border: "#3b82f6", glow: "0 0 0 3px rgba(59,130,246,.25)", badge: "☎",  label: "Valid — Non-Mobile · Verify SMS" },
  invalid:  { border: "#ef4444", glow: "0 0 0 3px rgba(239,68,68,.25)",  badge: "✕",  label: "Invalid Number" },
};

const STATUS_BG: Partial<Record<ValidationStatus, string>> = {
  valid:    "bg-green-500",
  landline: "bg-blue-500",
  invalid:  "bg-red-500",
};

// ── Format phone ───────────────────────────────────────────────────────────
const fmt = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
};

// ── Phone Field Component ─────────────────────────────────────────────────
interface PhoneFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  status: ValidationStatus;
  reason?: string;
  carrier?: string;
  onValidate: () => void;
}

function PhoneField({ label, value, onChange, status, reason, carrier, onValidate }: PhoneFieldProps) {
  const s = STATUS[status] || STATUS.idle;
  const hasResult = ["valid","landline","invalid"].includes(status);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
        {label}
      </label>
      <div className="relative flex items-center">
        <div
          className="flex items-center w-full rounded-lg bg-background transition-all duration-300"
          style={{
            border: `2px solid ${s.border}`,
            boxShadow: s.glow,
          }}
        >
          <span className="px-2.5 text-muted-foreground text-sm">📞</span>
          <input
            value={value}
            onChange={(e) => onChange(fmt(e.target.value))}
            onBlur={onValidate}
            placeholder="(555) 000-0000"
            className="flex-1 bg-transparent border-none outline-none text-foreground text-[15px] font-mono tracking-wide py-2.5"
          />
          {status === "checking" && (
            <span className="px-3 text-muted-foreground text-lg animate-spin">⟳</span>
          )}
          {hasResult && (
            <span
              className={`${STATUS_BG[status] || ""} m-1 mx-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-bold text-white tracking-wide whitespace-nowrap`}
            >
              {s.badge} {s.label}
            </span>
          )}
        </div>
      </div>
      {hasResult && reason && (
        <p className="text-destructive text-[11px] mt-0.5 pl-1">⚠ {reason}</p>
      )}
      {hasResult && carrier && status !== "invalid" && (
        <p className="text-muted-foreground text-[11px] mt-0.5 pl-1">Carrier: {carrier}</p>
      )}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex gap-4 flex-wrap bg-card rounded-[10px] px-4 py-2.5 border border-border mb-5">
      {[
        { color: "#22c55e", label: "Valid & SMS-capable" },
        { color: "#3b82f6", label: "Valid – Non-Mobile · Verify SMS" },
        { color: "#ef4444", label: "Invalid / Undeliverable" },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm" style={{ background: color }} />
          <span className="text-muted-foreground text-xs">{label}</span>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-primary text-[11px] font-semibold">TrueReach Active</span>
      </div>
    </div>
  );
}

// ── Demo phone presets ────────────────────────────────────────────────────
const PRESETS = [
  { label: "Valid (SMS)", phone: "(404) 555-1234" },
  { label: "Landline",    phone: "(305) 555-9876" },
  { label: "Invalid",     phone: "(555) 000-0000" },
];

// ── Main Component ────────────────────────────────────────────────────────
export default function PMSDemo() {
  const patient = {
    name: "Margaret L. Thompson",
    dob: "03/14/1958",
    mrn: "RX-00482917",
    insurance: "BlueCross Shield",
    allergies: "Penicillin, Sulfa",
  };

  const [primaryPhone, setPrimaryPhone] = useState("(404) 867-5309");
  const [primaryStatus, setPrimaryStatus] = useState<ValidationStatus>("idle");
  const [primaryMeta, setPrimaryMeta] = useState<{ reason?: string; carrier?: string }>({});

  const [altPhone, setAltPhone] = useState("(555) 123-4567");
  const [altStatus, setAltStatus] = useState<ValidationStatus>("idle");
  const [altMeta, setAltMeta] = useState<{ reason?: string; carrier?: string }>({});

  const [log, setLog] = useState<{ msg: string; type: string; ts: string }[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type = "info") =>
    setLog((prev) => [{ msg, type, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));

  const validate = async (
    phone: string,
    setStatus: (s: ValidationStatus) => void,
    setMeta: (m: { reason?: string; carrier?: string }) => void,
    fieldLabel: string
  ) => {
    if (!phone || phone.replace(/\D/g, "").length < 10) return;
    setStatus("checking");
    addLog(`Validating ${fieldLabel}: ${phone}`, "info");
    const result = await trueReachValidate(phone);
    if (result.status === "valid") {
      const s: ValidationStatus = result.smsCapable ? "valid" : "landline";
      setStatus(s);
      setMeta({ carrier: result.carrier });
      addLog(`${fieldLabel} — ${result.smsCapable ? "✓ SMS-capable" : "☎ Non-Mobile · Verify SMS"} (${result.carrier})`, result.smsCapable ? "success" : "info");
    } else {
      setStatus("invalid");
      setMeta({ reason: result.reason });
      addLog(`${fieldLabel} — ✕ INVALID: ${result.reason}`, "error");
    }
  };

  useEffect(() => {
    validate(primaryPhone, setPrimaryStatus, setPrimaryMeta, "Primary");
    setTimeout(() => validate(altPhone, setAltStatus, setAltMeta, "Alternate"), 600);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
      `}</style>

      <div className="max-w-[860px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-base">💊</div>
            <span className="text-foreground font-bold text-lg">RxCare PMS</span>
            <span className="text-border text-lg">·</span>
            <span className="text-muted-foreground text-[13px]">Patient Profile</span>
          </div>
          <div className="flex items-center gap-2 bg-card border border-primary/25 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-semibold">TrueReach</span>
            <span className="text-primary/40 text-[10px]">v2.4 embedded</span>
          </div>
        </div>

        <Legend />

        <div className="grid grid-cols-[1fr_340px] gap-5">

          {/* Patient Card */}
          <div className="bg-card border border-border rounded-[14px] overflow-hidden">
            <div className="bg-secondary/50 px-6 py-5 border-b border-border flex gap-4 items-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-border flex items-center justify-center text-2xl">👩‍⚕️</div>
              <div>
                <h2 className="text-foreground font-bold text-lg m-0">{patient.name}</h2>
                <div className="flex gap-3 mt-1">
                  <span className="text-muted-foreground text-xs">DOB: <span className="text-foreground/70">{patient.dob}</span></span>
                  <span className="text-muted-foreground text-xs">MRN: <span className="text-foreground/70 font-mono">{patient.mrn}</span></span>
                </div>
              </div>
              <div className="ml-auto">
                <div className="bg-destructive/10 text-destructive text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-destructive/25">
                  ⚠ {patient.allergies}
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Quick demo presets */}
              <div className="bg-secondary/30 rounded-lg px-3.5 py-2.5">
                <p className="text-muted-foreground/60 text-[11px] font-semibold mb-2 uppercase tracking-wider">Quick Demo — Load Phone</p>
                <div className="flex gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => { setPrimaryPhone(p.phone); setPrimaryStatus("idle"); setPrimaryMeta({}); }}
                      className="bg-background border border-border rounded-md text-muted-foreground text-xs px-3 py-1 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    onClick={() => validate(primaryPhone, setPrimaryStatus, setPrimaryMeta, "Primary")}
                    className="ml-auto bg-primary border-none rounded-md text-primary-foreground text-xs px-3.5 py-1 cursor-pointer font-semibold hover:bg-primary/90 transition-colors"
                  >
                    ↻ Re-validate
                  </button>
                </div>
              </div>

              <PhoneField
                label="Primary Phone *"
                value={primaryPhone}
                onChange={(v) => { setPrimaryPhone(v); setPrimaryStatus("idle"); setPrimaryMeta({}); }}
                status={primaryStatus}
                reason={primaryMeta.reason}
                carrier={primaryMeta.carrier}
                onValidate={() => validate(primaryPhone, setPrimaryStatus, setPrimaryMeta, "Primary")}
              />
              <PhoneField
                label="Alternate Phone"
                value={altPhone}
                onChange={(v) => { setAltPhone(v); setAltStatus("idle"); setAltMeta({}); }}
                status={altStatus}
                reason={altMeta.reason}
                carrier={altMeta.carrier}
                onValidate={() => validate(altPhone, setAltStatus, setAltMeta, "Alternate")}
              />

              {[["Insurance", patient.insurance], ["Primary Physician", "Dr. Raymond K. Patel, MD"]].map(([lbl, val]) => (
                <div key={lbl}>
                  <label className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase block mb-1">{lbl}</label>
                  <div className="bg-background border border-border rounded-lg px-3.5 py-2.5 text-foreground text-sm">{val}</div>
                </div>
              ))}

              <div className="flex gap-2.5 pt-1">
                <button className="flex-1 bg-primary border-none rounded-lg text-primary-foreground font-semibold text-sm py-2.5 cursor-pointer hover:bg-primary/90 transition-colors">
                  Save Profile
                </button>
                <button
                  disabled={primaryStatus !== "valid" && altStatus !== "valid"}
                  className={`flex-1 rounded-lg font-semibold text-sm py-2.5 transition-colors ${
                    primaryStatus === "valid" || altStatus === "valid"
                      ? "bg-green-500/10 border border-green-500/25 text-green-500 cursor-pointer hover:bg-green-500/20"
                      : "bg-secondary border border-border text-muted-foreground/50 cursor-not-allowed"
                  }`}
                >
                  📱 Send SMS Reminder
                </button>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {/* Validation log */}
            <div className="bg-card border border-border rounded-[14px] overflow-hidden flex-1">
              <div className="px-4 py-3.5 border-b border-border flex items-center gap-2">
                <span className="text-sm">📋</span>
                <span className="text-foreground font-semibold text-[13px]">Validation Log</span>
                <span className="ml-auto bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">TrueReach API</span>
              </div>
              <div ref={logRef} className="px-4 py-3 flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                {log.length === 0 && <p className="text-border text-xs text-center py-5">No activity yet…</p>}
                {log.map((entry, i) => (
                  <div key={i} className="flex gap-2" style={{ animation: "fadeIn 0.2s ease" }}>
                    <span className="text-muted-foreground/50 text-[10px] font-mono flex-shrink-0 pt-px">{entry.ts}</span>
                    <span className={`text-xs ${entry.type === "error" ? "text-destructive" : entry.type === "success" ? "text-green-400" : "text-muted-foreground"}`}>{entry.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="bg-card border border-border rounded-[14px] px-4 py-4">
              <p className="text-primary text-[11px] font-bold uppercase tracking-widest mb-3">How It Works</p>
              {[
                { icon: "①", text: "Tech opens patient profile in PMS" },
                { icon: "②", text: "TrueReach script auto-validates on load" },
                { icon: "③", text: "Color border flags status instantly" },
                { icon: "④", text: "Re-validates on any manual edit + blur" },
                { icon: "⑤", text: "SMS button locks if no valid mobile" },
              ].map(({ icon, text }) => (
                <div key={icon} className="flex gap-2.5 mb-2">
                  <span className="text-primary font-bold text-[13px] flex-shrink-0">{icon}</span>
                  <span className="text-muted-foreground text-xs">{text}</span>
                </div>
              ))}
            </div>

            {/* Status key */}
            <div className="bg-card border border-border rounded-[14px] px-4 py-4">
              <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest mb-2.5">Border Status Key</p>
              {[
                { color: "#22c55e", icon: "✓", label: "Green", desc: "Valid & textable" },
                { color: "#3b82f6", icon: "☎", label: "Blue",  desc: "Valid, non-mobile · verify SMS" },
                { color: "#ef4444", icon: "✕", label: "Red",   desc: "Invalid / flagged" },
              ].map(({ color, icon, label, desc }) => (
                <div key={label} className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-5 rounded flex items-center justify-center" style={{ border: `2px solid ${color}`, background: `${color}15` }}>
                    <span style={{ color }} className="text-[10px] font-bold">{icon}</span>
                  </div>
                  <span style={{ color }} className="text-xs font-semibold w-10">{label}</span>
                  <span className="text-muted-foreground text-xs">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-border text-[11px] mt-5">
          TrueReach Phone Validation · Embedded SDK Demo · © 2026 TrueReach Health
        </p>
      </div>
    </div>
  );
}
