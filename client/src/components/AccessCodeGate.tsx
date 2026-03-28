import { useState, useEffect } from "react";

const CORRECT_CODE = "Tee@thc1";
const SESSION_KEY  = "truereach_dev_access";

export default function AccessCodeGate({ children }: { children: React.ReactNode }) {
  const [input, setInput]       = useState("");
  const [error, setError]       = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "granted") setUnlocked(true);
  }, []);

  const handleSubmit = () => {
    if (input === CORRECT_CODE) {
      sessionStorage.setItem(SESSION_KEY, "granted");
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "40px 48px", width: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 20px" }}>📡</div>
        <h2 style={{ color: "#111827", fontWeight: 800, fontSize: 20, margin: "0 0 8px" }}>Developer Access</h2>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 28px" }}>Enter your access code to view the TrueReach integration documentation.</p>
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Enter access code"
          style={{ width: "100%", padding: "11px 14px", border: `2px solid ${error ? "#ef4444" : "#e5e7eb"}`, borderRadius: 8, fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "inherit", transition: "border-color 0.2s", color: "#111827" }}
        />
        {error && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 12px" }}>⚠ Incorrect access code. Please try again.</p>}
        <button
          onClick={handleSubmit}
          style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 15, padding: "12px", cursor: "pointer" }}
        >
          Unlock Documentation →
        </button>
        <p style={{ color: "#d1d5db", fontSize: 12, marginTop: 20 }}>Contact TrueReach to request access</p>
      </div>
    </div>
  );
}
