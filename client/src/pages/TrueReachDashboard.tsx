import { useState, useEffect } from "react";

// ── Mock data (replace with real API calls to /api/truereach/logs) ─────────
const generateMockData = () => {
  const orgs = ["Highland Pharmacy", "MedFirst PMS", "RxCare Network", "CarePoint Health"];
  const users = ["J. Martinez", "T. Williams", "A. Patel", "S. Johnson", "R. Kim"];
  const reasons = ["Incorrect digit count", "Invalid area code", "Placeholder number", "Disconnected number"];
  const carriers = ["T-Mobile", "Verizon", "AT&T", "Sprint", "Landline/VoIP"];
  const events = [];

  for (let i = 0; i < 80; i++) {
    const type = Math.random() < 0.35 ? "invalid_detected" : Math.random() < 0.55 ? "valid_sms" : Math.random() < 0.75 ? "valid_landline" : "phone_updated";
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    events.push({
      id: i,
      event_type: type,
      org: orgs[Math.floor(Math.random() * orgs.length)],
      user_id: users[Math.floor(Math.random() * users.length)],
      phone_last4: String(Math.floor(1000 + Math.random() * 9000)),
      reason: type === "invalid_detected" ? reasons[Math.floor(Math.random() * reasons.length)] : null,
      carrier: type !== "invalid_detected" ? carriers[Math.floor(Math.random() * carriers.length)] : null,
      previous_status: type === "phone_updated" ? (Math.random() < 0.7 ? "invalid" : "landline") : null,
      timestamp: date.toISOString(),
    });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const ALL_EVENTS = generateMockData();

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: { label: string; value: number | string; sub?: string; color: string; icon: string }) {
  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e5e7eb",
      borderRadius: 14, padding: "20px 24px",
      borderLeft: `4px solid ${color}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: 0 }}>{label}</p>
          <p style={{ color: "#7c3aed", fontSize: 32, fontWeight: 800, margin: "6px 0 0", lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ color, fontSize: 12, margin: "4px 0 0" }}>{sub}</p>}
        </div>
        <span style={{ fontSize: 28, opacity: 0.5 }}>{icon}</span>
      </div>
    </div>
  );
}

// ── Event type badge ───────────────────────────────────────────────────────
function EventBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    invalid_detected: { bg: "#fef2f2", color: "#dc2626", label: "✕ Invalid" },
    valid_sms:        { bg: "#f0fdf4", color: "#16a34a", label: "✓ Valid SMS" },
    valid_landline:   { bg: "#eff6ff", color: "#2563eb", label: "☎ Landline" },
    phone_updated:    { bg: "#faf5ff", color: "#7c3aed", label: "✎ Updated" },
  };
  const s = map[type] || { bg: "#f9fafb", color: "#6b7280", label: type };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 20, whiteSpace: "nowrap" as const,
    }}>
      {s.label}
    </span>
  );
}

// ── Mini bar chart ─────────────────────────────────────────────────────────
function MiniBar({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, background: color,
          height: `${(v / max) * 100}%`,
          borderRadius: "2px 2px 0 0", minHeight: 3,
          opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.5,
        }} />
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function TrueReachDashboard() {
  const [events] = useState(ALL_EVENTS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const invalid  = events.filter(e => e.event_type === "invalid_detected");
  const validSms = events.filter(e => e.event_type === "valid_sms");
  const landline = events.filter(e => e.event_type === "valid_landline");
  const updated  = events.filter(e => e.event_type === "phone_updated");
  const fixRate  = updated.length > 0 ? Math.round((updated.filter(e => e.previous_status === "invalid").length / invalid.length) * 100) : 0;

  // Last 7 days invalid counts
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return invalid.filter(e => new Date(e.timestamp).toDateString() === d.toDateString()).length;
  });

  const filtered = events
    .filter(e => filter === "all" || e.event_type === filter)
    .filter(e => !search || e.org.toLowerCase().includes(search.toLowerCase()) || e.user_id.toLowerCase().includes(search.toLowerCase()) || e.phone_last4.includes(search));

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', system-ui, sans-serif", padding: 28 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        button:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #f3f4f6; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📡</div>
              <h1 style={{ color: "#1f2937", fontWeight: 800, fontSize: 22, margin: 0 }}>TrueReach Dashboard</h1>
            </div>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>Phone validation activity across all embedded deployments</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 16px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#6b7280", fontSize: 12 }}>Live · {events.length} events tracked</span>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard label="Invalid Flagged"   value={invalid.length}  sub="Numbers flagged"          color="#ef4444" icon="🚩" />
          <StatCard label="Valid & SMS-ready" value={validSms.length} sub="SMS reminders enabled"    color="#22c55e" icon="📱" />
          <StatCard label="Landline Only"     value={landline.length} sub="Voice calls only"         color="#3b82f6" icon="☎️" />
          <StatCard label="Corrections Made"  value={updated.length}  sub={`${fixRate}% fix rate`}   color="#7c3aed" icon="✏️" />
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>

          {/* Invalid trend */}
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 12px" }}>Invalid — Last 7 Days</p>
            <MiniBar data={last7} color="#ef4444" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <span key={i} style={{ color: "#d1d5db", fontSize: 10 }}>{d}</span>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 14px" }}>Validation Breakdown</p>
            {[
              { label: "Valid SMS",  count: validSms.length, color: "#22c55e" },
              { label: "Landline",   count: landline.length, color: "#3b82f6" },
              { label: "Invalid",    count: invalid.length,  color: "#ef4444" },
            ].map(({ label, count, color }) => {
              const pct = Math.round((count / events.length) * 100);
              return (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#6b7280", fontSize: 12 }}>{label}</span>
                    <span style={{ color, fontSize: 12, fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6 }}>
                    <div style={{ background: color, width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top orgs */}
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 14px" }}>Top Active Orgs</p>
            {Object.entries(
              events.reduce((acc, e) => { acc[e.org] = (acc[e.org] || 0) + 1; return acc; }, {} as Record<string, number>)
            ).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([org, count]) => (
              <div key={org} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "#6b7280", fontSize: 12 }}>{org}</span>
                <span style={{ background: "#f5f3ff", color: "#7c3aed", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Event log table */}
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {/* Table header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
            <span style={{ color: "#1f2937", fontWeight: 700, fontSize: 14 }}>📋 Event Log</span>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
              {[
                { key: "all",              label: "All" },
                { key: "invalid_detected", label: "Invalid" },
                { key: "valid_sms",        label: "SMS" },
                { key: "valid_landline",   label: "Landline" },
                { key: "phone_updated",    label: "Updated" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setFilter(key); setPage(0); }}
                  style={{
                    background: filter === key ? "#7c3aed" : "#f3f4f6",
                    border: filter === key ? "none" : "1px solid #e5e7eb",
                    borderRadius: 6,
                    color: filter === key ? "#fff" : "#6b7280",
                    fontSize: 12, fontWeight: 600,
                    padding: "4px 12px", cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search org, user, last 4…"
              style={{
                marginLeft: "auto", background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 8, color: "#1f2937", fontSize: 12, padding: "6px 12px",
                outline: "none", width: 200,
              }}
            />
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  {["Timestamp", "Event", "Organization", "User", "Phone (last 4)", "Details"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left" as const, color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", whiteSpace: "nowrap" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#f9fafb" : "#ffffff" }}>
                    <td style={{ padding: "10px 16px", color: "#9ca3af", fontSize: 12, fontFamily: "JetBrains Mono", whiteSpace: "nowrap" as const }}>
                      {new Date(e.timestamp).toLocaleDateString()} {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "10px 16px" }}><EventBadge type={e.event_type} /></td>
                    <td style={{ padding: "10px 16px", color: "#4b5563", fontSize: 13 }}>{e.org}</td>
                    <td style={{ padding: "10px 16px", color: "#4b5563", fontSize: 13 }}>{e.user_id}</td>
                    <td style={{ padding: "10px 16px", color: "#4b5563", fontSize: 13, fontFamily: "JetBrains Mono" }}>···· {e.phone_last4}</td>
                    <td style={{ padding: "10px 16px", color: "#9ca3af", fontSize: 12 }}>
                      {e.reason || e.carrier || (e.previous_status ? `Was: ${e.previous_status}` : "—")}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center" as const, color: "#d1d5db" }}>No events match your filter</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#9ca3af", fontSize: 12 }}>
              Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, color: page === 0 ? "#d1d5db" : "#6b7280", padding: "4px 12px", cursor: page === 0 ? "not-allowed" : "pointer", fontSize: 12 }}>
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, color: page >= totalPages - 1 ? "#d1d5db" : "#6b7280", padding: "4px 12px", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", fontSize: 12 }}>
                Next →
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center" as const, color: "#d1d5db", fontSize: 11, marginTop: 20 }}>
          TrueReach Analytics · All data encrypted · © 2026 TrueReach Health
        </p>
      </div>
    </div>
  );
}
