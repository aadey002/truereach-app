import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://flask-data-viz-aadey002.replit.app";

interface ValidationEvent {
  id: number;
  api_key: string;
  org_id: string;
  user_id: string;
  event_type: string;
  phone_last4: string;
  reason: string | null;
  carrier: string | null;
  previous_status: string | null;
  page_url: string | null;
  timestamp: string;
  created_at: string;
}

interface Stats {
  total: number;
  invalid: number;
  valid_sms: number;
  valid_landline: number;
  updated: number;
  fix_rate: number;
}

function StatCard({ label, value, sub, color, icon, loading }: {
  label: string; value: number | string; sub?: string;
  color: string; icon: string; loading?: boolean;
}) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", borderLeft: `4px solid ${color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: 0 }}>{label}</p>
          <p style={{ color: loading ? "#d1d5db" : "#1f2937", fontSize: 32, fontWeight: 800, margin: "6px 0 0", lineHeight: 1 }}>{loading ? "—" : value}</p>
          {sub && <p style={{ color, fontSize: 12, margin: "4px 0 0" }}>{sub}</p>}
        </div>
        <span style={{ fontSize: 28, opacity: 0.5 }}>{icon}</span>
      </div>
    </div>
  );
}

function EventBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    invalid_detected: { bg: "#fef2f2", color: "#dc2626", label: "✕ Invalid" },
    valid_sms:        { bg: "#f0fdf4", color: "#16a34a", label: "✓ Valid SMS" },
    valid_landline:   { bg: "#eff6ff", color: "#2563eb", label: "☎ Landline" },
    phone_updated:    { bg: "#faf5ff", color: "#7c3aed", label: "✎ Updated" },
  };
  const s = map[type] || { bg: "#f9fafb", color: "#6b7280", label: type };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}20`, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
      {s.label}
    </span>
  );
}

function MiniBar({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, background: color, height: `${(v / max) * 100}%`, borderRadius: "2px 2px 0 0", minHeight: 3, opacity: i === data.length - 1 ? 1 : 0.3 + (i / data.length) * 0.6 }} />
      ))}
    </div>
  );
}

function Skeleton({ width = "100%", height = 16 }: { width?: string | number; height?: number }) {
  return <div style={{ width, height, borderRadius: 6, background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />;
}

export default function TrueReachDashboard() {
  const [events, setEvents]           = useState<ValidationEvent[]>([]);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [filter, setFilter]           = useState("all");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [eventsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/truereach/events?limit=500`),
        fetch(`${API_BASE}/api/truereach/stats`),
      ]);
      if (!eventsRes.ok || !statsRes.ok) throw new Error("API error");
      const eventsData = await eventsRes.json();
      const statsData  = await statsRes.json();
      setEvents(eventsData.events || []);
      setStats(statsData);
      setLastRefresh(new Date());
    } catch (err) {
      setError("Could not connect to TrueReach API. Make sure your Flask server is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return events.filter(e => e.event_type === "invalid_detected" && new Date(e.created_at).toDateString() === d.toDateString()).length;
  });

  const filtered = events
    .filter(e => filter === "all" || e.event_type === filter)
    .filter(e => { if (!search) return true; const s = search.toLowerCase(); return (e.org_id||"").toLowerCase().includes(s)||(e.user_id||"").toLowerCase().includes(s)||(e.phone_last4||"").includes(s); });

  const paginated  = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const orgCounts  = events.reduce((acc, e) => { acc[e.org_id] = (acc[e.org_id] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', system-ui, sans-serif", padding: 28 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes shimmer { to { background-position: -200% 0; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        button:hover { opacity: 0.85; }
        tr:hover td { background: #f9fafb !important; transition: background 0.15s; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📡</div>
              <h1 style={{ color: "#111827", fontWeight: 800, fontSize: 22, margin: 0 }}>TrueReach Dashboard</h1>
            </div>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Phone validation activity across all embedded deployments</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#9ca3af", fontSize: 11 }}>Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <button onClick={fetchData} style={{ background: "#7c3aed", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, padding: "7px 14px", cursor: "pointer" }}>↻ Refresh</button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: error ? "#ef4444" : "#22c55e", animation: "pulse 2s infinite" }} />
              <span style={{ color: "#6b7280", fontSize: 12 }}>{error ? "Disconnected" : "Live"}</span>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <span>⚠️</span>
            <span style={{ color: "#dc2626", fontSize: 13 }}>{error}</span>
            <button onClick={fetchData} style={{ marginLeft: "auto", background: "#dc2626", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, padding: "4px 12px", cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard loading={loading} label="Invalid Flagged"   value={stats?.invalid ?? 0}        sub="Numbers flagged"       color="#ef4444" icon="🚩" />
          <StatCard loading={loading} label="Valid & SMS-ready" value={stats?.valid_sms ?? 0}      sub="SMS reminders enabled" color="#7c3aed" icon="📱" />
          <StatCard loading={loading} label="Non-Mobile"        value={stats?.valid_landline ?? 0} sub="Verify SMS capability"  color="#3b82f6" icon="☎️" />
          <StatCard loading={loading} label="Corrections Made"  value={stats?.updated ?? 0}        sub={`${stats?.fix_rate ?? 0}% fix rate`} color="#16a34a" icon="✏️" />
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <p style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 12px" }}>Invalid — Last 7 Days</p>
            {loading ? <Skeleton height={40} /> : <MiniBar data={last7} color="#ef4444" />}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {["M","T","W","T","F","S","S"].map((d, i) => <span key={i} style={{ color: "#d1d5db", fontSize: 10 }}>{d}</span>)}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <p style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 14px" }}>Validation Breakdown</p>
            {loading ? <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}><Skeleton height={12} /><Skeleton height={12} /><Skeleton height={12} /></div> : (
              [
                { label: "Valid SMS", count: stats?.valid_sms ?? 0, color: "#7c3aed" },
                { label: "Landline",  count: stats?.valid_landline ?? 0, color: "#3b82f6" },
                { label: "Invalid",   count: stats?.invalid ?? 0, color: "#ef4444" },
              ].map(({ label, count, color }) => {
                const pct = Math.round((count / (stats?.total || 1)) * 100);
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
              })
            )}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <p style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", margin: "0 0 14px" }}>Top Active Orgs</p>
            {loading ? <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}><Skeleton height={14} /><Skeleton height={14} /><Skeleton height={14} /></div>
              : Object.entries(orgCounts).length === 0
              ? <p style={{ color: "#d1d5db", fontSize: 12, textAlign: "center" as const, padding: "16px 0" }}>No org data yet</p>
              : Object.entries(orgCounts).sort((a,b) => b[1]-a[1]).slice(0,4).map(([org, count]) => (
                <div key={org} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ color: "#374151", fontSize: 13 }}>{org}</span>
                  <span style={{ background: "#f3e8ff", color: "#7c3aed", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10 }}>{count}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Event log */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
            <span style={{ color: "#111827", fontWeight: 700, fontSize: 14 }}>📋 Event Log</span>
            <span style={{ background: "#f3e8ff", color: "#7c3aed", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>{filtered.length} events</span>
            <div style={{ display: "flex", gap: 6, marginLeft: 4 }}>
              {[["all","All"],["invalid_detected","Invalid"],["valid_sms","SMS"],["valid_landline","Landline"],["phone_updated","Updated"]].map(([key, label]) => (
                <button key={key} onClick={() => { setFilter(key); setPage(0); }} style={{ background: filter === key ? "#7c3aed" : "#f9fafb", border: `1px solid ${filter === key ? "#7c3aed" : "#e5e7eb"}`, borderRadius: 6, color: filter === key ? "#fff" : "#6b7280", fontSize: 12, fontWeight: 600, padding: "4px 12px", cursor: "pointer" }}>{label}</button>
              ))}
            </div>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search org, user, last 4…" style={{ marginLeft: "auto", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, color: "#111827", fontSize: 12, padding: "6px 12px", outline: "none", width: 200 }} />
          </div>

          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
                  {["Timestamp","Event","Organization","User","Phone (last 4)","Details"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left" as const, color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", whiteSpace: "nowrap" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:6}).map((_,i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                    {Array.from({length:6}).map((_,j) => <td key={j} style={{ padding: "12px 16px" }}><Skeleton height={12} width={j===0?120:j===4?60:"80%"} /></td>)}
                  </tr>
                )) : paginated.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center" as const, color: "#d1d5db" }}>
                    {events.length === 0 ? "No validation events yet — embed the widget to start capturing data" : "No events match your filter"}
                  </td></tr>
                ) : paginated.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "11px 16px", color: "#9ca3af", fontSize: 12, fontFamily: "JetBrains Mono", whiteSpace: "nowrap" as const }}>
                      {new Date(e.created_at).toLocaleDateString()} {new Date(e.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                    </td>
                    <td style={{ padding: "11px 16px" }}><EventBadge type={e.event_type} /></td>
                    <td style={{ padding: "11px 16px", color: "#374151", fontSize: 13 }}>{e.org_id||"—"}</td>
                    <td style={{ padding: "11px 16px", color: "#374151", fontSize: 13 }}>{e.user_id||"—"}</td>
                    <td style={{ padding: "11px 16px", color: "#6b7280", fontSize: 13, fontFamily: "JetBrains Mono" }}>{e.phone_last4 ? `···· ${e.phone_last4}` : "—"}</td>
                    <td style={{ padding: "11px 16px", color: "#9ca3af", fontSize: 12 }}>{e.reason||e.carrier||(e.previous_status?`Was: ${e.previous_status}`:"—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#9ca3af", fontSize: 12 }}>
              {filtered.length === 0 ? "0 results" : `Showing ${page*PER_PAGE+1}–${Math.min((page+1)*PER_PAGE,filtered.length)} of ${filtered.length}`}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, color: page===0?"#d1d5db":"#374151", padding: "4px 12px", cursor: page===0?"not-allowed":"pointer", fontSize: 12 }}>← Prev</button>
              <span style={{ color: "#9ca3af", fontSize: 12, padding: "4px 8px" }}>{page+1} / {Math.max(totalPages,1)}</span>
              <button onClick={() => setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, color: page>=totalPages-1?"#d1d5db":"#374151", padding: "4px 12px", cursor: page>=totalPages-1?"not-allowed":"pointer", fontSize: 12 }}>Next →</button>
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
