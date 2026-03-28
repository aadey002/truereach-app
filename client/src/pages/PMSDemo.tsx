import { useState, useEffect, useRef } from "react";

// ── TrueReach Embedded Validation Engine ──────────────────────────────────
const trueReachValidate = async (phoneNumber: string) => {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return { status: "invalid", reason: "Incorrect digit count" };
  const areaCode = digits.slice(-10, -7);
  const invalidAreaCodes = ["000", "111", "123", "555"];
  if (invalidAreaCodes.includes(areaCode)) return { status: "invalid", reason: "Invalid area code" };
  if (digits === "0000000000" || digits === "1111111111") return { status: "invalid", reason: "Placeholder number detected" };
  const smsCapable = parseInt(areaCode) % 2 === 0;
  return { status: "valid", smsCapable, carrier: smsCapable ? "T-Mobile" : "Landline/VoIP" };
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
  idle:     { border: "#334155", glow: "none",                           badge: null, label: "" },
  checking: { border: "#94a3b8", glow: "none",                           badge: "⟳",  label: "Validating…" },
  valid:    { border: "#22c55e", glow: "0 0 0 3px rgba(34,197,94,.25)",  badge: "✓",  label: "Valid & Textable" },
  landline: { border: "#3b82f6", glow: "0 0 0 3px rgba(59,130,246,.25)", badge: "☎",  label: "Valid — Not Textable" },
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
      <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
        {label}
      </label>
      <div className="relative flex items-center">
        <div
          className="flex items-center w-full"
          style={{
            border: `2px solid ${s.border}`,
            boxShadow: s.glow,
            borderRadius: 8,
            background: "#0f172a",
            transition: "border-color 0.3s, box-shadow 0.3s",
          }}
        >
          <span style={{ padding: "0 10px", color: "#475569", fontSize: 14 }}>📞</span>
          <input
            value={value}
            onChange={(e) => onChange(fmt(e.target.value))}
            onBlur={onValidate}
            placeholder="(555) 000-0000"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#e2e8f0",
              fontSize: 15,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.04em",
              padding: "10px 0",
            }}
          />
          {status === "checking" && (
            <span style={{ padding: "0 12px", color: "#64748b", fontSize: 18, animation: "spin 1s linear infinite" }}>⟳</span>
          )}
          {hasResult && (
            <span
              className={STATUS_BG[status] || ""}
              style={{
                margin: "4px 6px",
                borderRadius: 6,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap" as const,
              }}
            >
              {s.badge} {s.label}
            </span>
          )}
        </div>
      </div>
      {hasResult && reason && (
        <p style={{ color: "#ef4444", fontSize: 11, marginTop: 2, paddingLeft: 4 }}>⚠ {reason}</p>
      )}
      {hasResult && carrier && status !== "invalid" && (
        <p style={{ color: "#64748b", fontSize: 11, marginTop: 2, paddingLeft: 4 }}>Carrier: {carrier}</p>
      )}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{
      display: "flex", gap: 16, flexWrap: "wrap" as const,
      background: "#0f172a", borderRadius: 10, padding: "10px 16px",
      border: "1px solid #1e293b", marginBottom: 20,
    }}>
      {[
        { color: "#22c55e", label: "Valid & SMS-capable" },
        { color: "#3b82f6", label: "Valid – Landline/VoIP only" },
        { color: "#ef4444", label: "Invalid / Undeliverable" },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: color }} />
          <span style={{ color: "#94a3b8", fontSize: 12 }}>{label}</span>
        </div>
      ))}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", animation: "pulse 2s infinite" }} />
        <span style={{ color: "#7c3aed", fontSize: 11, fontWeight: 600 }}>TrueReach Active</span>
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
      addLog(`${fieldLabel} — ${result.smsCapable ? "✓ SMS-capable" : "☎ Landline/VoIP"} (${result.carrier})`, result.smsCapable ? "success" : "info");
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
    <div style={{ minHeight: "100vh", background: "#020817", fontFamily: "'Inter', system-ui, sans-serif", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💊</div>
            <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 18 }}>RxCare PMS</span>
            <span style={{ color: "#334155", fontSize: 18 }}>·</span>
            <span style={{ color: "#64748b", fontSize: 13 }}>Patient Profile</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0f172a", border: "1px solid #7c3aed40", borderRadius: 8, padding: "6px 12px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 600 }}>TrueReach</span>
            <span style={{ color: "#4c1d95", fontSize: 10 }}>v2.4 embedded</span>
          </div>
        </div>

        <Legend />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

          {/* Patient Card */}
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", padding: "20px 24px", borderBottom: "1px solid #1e293b", display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed30,#3b82f620)", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👩‍⚕️</div>
              <div>
                <h2 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 18, margin: 0 }}>{patient.name}</h2>
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  <span style={{ color: "#64748b", fontSize: 12 }}>DOB: <span style={{ color: "#94a3b8" }}>{patient.dob}</span></span>
                  <span style={{ color: "#64748b", fontSize: 12 }}>MRN: <span style={{ color: "#94a3b8", fontFamily: "JetBrains Mono" }}>{patient.mrn}</span></span>
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{ background: "#dc262620", color: "#f87171", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: "1px solid #dc262640" }}>
                  ⚠ {patient.allergies}
                </div>
              </div>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column" as const, gap: 20 }}>
              {/* Quick demo presets */}
              <div style={{ background: "#1e293b50", borderRadius: 8, padding: "10px 14px" }}>
                <p style={{ color: "#475569", fontSize: 11, fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Quick Demo — Load Phone</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => { setPrimaryPhone(p.phone); setPrimaryStatus("idle"); setPrimaryMeta({}); }}
                      style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#94a3b8", fontSize: 12, padding: "4px 12px", cursor: "pointer" }}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    onClick={() => validate(primaryPhone, setPrimaryStatus, setPrimaryMeta, "Primary")}
                    style={{ marginLeft: "auto", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, padding: "4px 14px", cursor: "pointer", fontWeight: 600 }}
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
                  <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, display: "block", marginBottom: 4 }}>{lbl}</label>
                  <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14 }}>{val}</div>
                </div>
              ))}

              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <button style={{ flex: 1, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 14, padding: "11px", cursor: "pointer" }}>
                  Save Profile
                </button>
                <button
                  disabled={primaryStatus !== "valid" && altStatus !== "valid"}
                  style={{
                    flex: 1,
                    background: primaryStatus === "valid" || altStatus === "valid" ? "#16a34a20" : "#1e293b",
                    border: `1px solid ${primaryStatus === "valid" || altStatus === "valid" ? "#22c55e40" : "#1e293b"}`,
                    borderRadius: 8,
                    color: primaryStatus === "valid" || altStatus === "valid" ? "#22c55e" : "#475569",
                    fontWeight: 600, fontSize: 14, padding: "11px",
                    cursor: primaryStatus === "valid" || altStatus === "valid" ? "pointer" : "not-allowed",
                  }}
                >
                  📱 Send SMS Reminder
                </button>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            {/* Validation log */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden", flex: 1 }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>📋</span>
                <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>Validation Log</span>
                <span style={{ marginLeft: "auto", background: "#7c3aed20", color: "#a78bfa", fontSize: 10, padding: "2px 8px", borderRadius: 10 }}>TrueReach API</span>
              </div>
              <div ref={logRef} style={{ padding: "12px 16px", display: "flex", flexDirection: "column" as const, gap: 6, maxHeight: 200, overflowY: "auto" as const }}>
                {log.length === 0 && <p style={{ color: "#334155", fontSize: 12, textAlign: "center" as const, padding: "20px 0" }}>No activity yet…</p>}
                {log.map((entry, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, animation: "fadeIn 0.2s ease" }}>
                    <span style={{ color: "#475569", fontSize: 10, fontFamily: "JetBrains Mono", flexShrink: 0, paddingTop: 1 }}>{entry.ts}</span>
                    <span style={{ fontSize: 12, color: entry.type === "error" ? "#f87171" : entry.type === "success" ? "#4ade80" : "#94a3b8" }}>{entry.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ color: "#7c3aed", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 12 }}>How It Works</p>
              {[
                { icon: "①", text: "Tech opens patient profile in PMS" },
                { icon: "②", text: "TrueReach script auto-validates on load" },
                { icon: "③", text: "Color border flags status instantly" },
                { icon: "④", text: "Re-validates on any manual edit + blur" },
                { icon: "⑤", text: "SMS button locks if no valid mobile" },
              ].map(({ icon, text }) => (
                <div key={icon} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{icon}</span>
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Status key */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>Border Status Key</p>
              {[
                { color: "#22c55e", icon: "✓", label: "Green", desc: "Valid & textable" },
                { color: "#3b82f6", icon: "☎", label: "Blue",  desc: "Valid, landline only" },
                { color: "#ef4444", icon: "✕", label: "Red",   desc: "Invalid / flagged" },
              ].map(({ color, icon, label, desc }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 20, borderRadius: 4, border: `2px solid ${color}`, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color, fontSize: 10, fontWeight: 700 }}>{icon}</span>
                  </div>
                  <span style={{ color, fontSize: 12, fontWeight: 600, width: 40 }}>{label}</span>
                  <span style={{ color: "#64748b", fontSize: 12 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center" as const, color: "#1e293b", fontSize: 11, marginTop: 20 }}>
          TrueReach Phone Validation · Embedded SDK Demo · © 2026 TrueReach Health
        </p>
      </div>
    </div>
  );
}
