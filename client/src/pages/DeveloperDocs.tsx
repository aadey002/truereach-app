import { useState } from "react";

// ── Copy button ────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      background: copied ? "#16a34a" : "#374151",
      border: "none", borderRadius: 6,
      color: "#fff", fontSize: 11, fontWeight: 600,
      padding: "4px 12px", cursor: "pointer",
      transition: "background 0.2s",
      display: "flex", alignItems: "center", gap: 5,
    }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ── Code block ─────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = "html" }: { code: string; lang?: string }) {
  return (
    <div style={{ position: "relative", margin: "12px 0" }}>
      <div style={{
        background: "#0f172a", borderRadius: 10,
        border: "1px solid #1e293b", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 16px", background: "#1e293b", borderBottom: "1px solid #334155",
        }}>
          <span style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{lang}</span>
          <CopyButton text={code} />
        </div>
        <pre style={{
          margin: 0, padding: "16px",
          color: "#e2e8f0", fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineHeight: 1.7, overflowX: "auto" as const,
          whiteSpace: "pre" as const,
        }}>
          <code dangerouslySetInnerHTML={{ __html: highlight(code, lang) }} />
        </pre>
      </div>
    </div>
  );
}

// ── Minimal syntax highlighter ─────────────────────────────────────────────
function highlight(code: string, lang: string): string {
  const escape = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  let c = escape(code);
  if (lang === "html") {
    c = c.replace(/(&lt;\/?[\w-]+)/g, '<span style="color:#7dd3fc">$1</span>');
    c = c.replace(/([\w-]+=)(&quot;[^&]*&quot;)/g, '<span style="color:#93c5fd">$1</span><span style="color:#86efac">$2</span>');
    c = c.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#475569;font-style:italic">$1</span>');
  }
  if (lang === "javascript" || lang === "js") {
    c = c.replace(/\b(const|let|var|function|return|if|else|async|await|new|true|false|null)\b/g, '<span style="color:#c084fc">$1</span>');
    c = c.replace(/(\/\/[^\n]*)/g, '<span style="color:#475569;font-style:italic">$1</span>');
    c = c.replace(/(&quot;[^&]*&quot;|&#x27;[^&]*&#x27;|`[^`]*`)/g, '<span style="color:#86efac">$1</span>');
    c = c.replace(/\b(\d+)\b/g, '<span style="color:#fb923c">$1</span>');
  }
  if (lang === "python") {
    c = c.replace(/\b(def|import|from|return|if|else|try|except|with|as|True|False|None|class)\b/g, '<span style="color:#c084fc">$1</span>');
    c = c.replace(/(#[^\n]*)/g, '<span style="color:#475569;font-style:italic">$1</span>');
    c = c.replace(/(&quot;[^&]*&quot;|&#x27;[^&]*&#x27;)/g, '<span style="color:#86efac">$1</span>');
  }
  return c;
}

// ── Section header ─────────────────────────────────────────────────────────
function Section({ id, step, title, desc, children }: {
  id: string; step: string; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div id={id} style={{ marginBottom: 48, scrollMarginTop: 80 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: 14,
        }}>{step}</div>
        <div>
          <h2 style={{ color: "#111827", fontWeight: 800, fontSize: 20, margin: "0 0 4px" }}>{title}</h2>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Pill badge ─────────────────────────────────────────────────────────────
function Pill({ color, label }: { color: string; label: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    green:  { bg: "#f0fdf4", text: "#16a34a" },
    blue:   { bg: "#eff6ff", text: "#2563eb" },
    purple: { bg: "#faf5ff", text: "#7c3aed" },
    orange: { bg: "#fff7ed", text: "#ea580c" },
  };
  const s = colors[color] || colors.purple;
  return (
    <span style={{ background: s.bg, color: s.text, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, border: `1px solid ${s.text}20` }}>
      {label}
    </span>
  );
}

// ── Code snippets ──────────────────────────────────────────────────────────
const SNIPPET_BASIC = `<!-- TrueReach PMS Integration — Add before </body> -->
<script
  src="https://flask-data-viz-aadey002.replit.app/widget/truereach-widget.js"
  data-api-key="YOUR_API_KEY"
  data-org-id="YOUR_ORG_ID"
  data-user-id="CURRENT_USER_ID"
></script>`;

const SNIPPET_ADVANCED = `<!-- TrueReach with full configuration options -->
<script
  src="https://flask-data-viz-aadey002.replit.app/widget/truereach-widget.js"
  data-api-key="YOUR_API_KEY"
  data-org-id="highland-pharmacy"
  data-user-id="tech-jane-smith"
  data-api-base="https://flask-data-viz-aadey002.replit.app"
></script>`;

const SNIPPET_TARGETING = `<!-- Option A: Auto-detect (recommended — no changes needed) -->
<!-- Widget finds: input[type="tel"], .truereach-phone,     -->
<!-- #phone, #phone_number, #primary_phone, #alt_phone,    -->
<!-- input[name*="phone"], input[placeholder*="phone"]     -->

<!-- Option B: Target a specific field by adding the class -->
<input type="text" class="truereach-phone" name="patient_phone" />

<!-- Option C: Target by ID (widget checks these IDs automatically) -->
<input type="text" id="phone_number" name="phone_number" />
<input type="text" id="primary_phone" name="primary_phone" />
<input type="text" id="alt_phone" name="alt_phone" />`;

const SNIPPET_EVENTS = `// Listen for TrueReach validation results in your own JS
document.addEventListener('truereach:validated', function(e) {
  const { status, phone, carrier, reason } = e.detail;
  // status = "valid" | "landline" | "invalid"

  if (status === 'invalid') {
    // Optionally block form submission
    console.log('Invalid number:', reason);
  }

  if (status === 'valid') {
    // Enable SMS reminder button
    document.getElementById('sms-btn').disabled = false;
  }
});`;

const SNIPPET_MANUAL = `// Manually trigger validation on any input
const input = document.getElementById('phone_number');

// Trigger via input event
input.dispatchEvent(new Event('blur'));

// Or call TrueReach directly (if widget is loaded)
window.TrueReach && window.TrueReach.validate(input);`;

const SNIPPET_PYTHON = `# Flask / Python — validate a phone number server-side
import requests

def validate_phone(phone_number, api_key):
    response = requests.get(
        'https://flask-data-viz-aadey002.replit.app/api/validate',
        params={'phone': phone_number, 'key': api_key}
    )
    data = response.json()
    return {
        'valid':       data.get('valid'),
        'sms_capable': data.get('is_sms_capable'),
        'carrier':     data.get('carrier'),
        'line_type':   data.get('line_type'),
        'reason':      data.get('reason'),
    }

# Example usage
result = validate_phone('+14045551234', 'YOUR_API_KEY')
if not result['valid']:
    print(f"Invalid: {result['reason']}")
elif result['sms_capable']:
    print(f"Valid SMS — carrier: {result['carrier']}")
else:
    print(f"Landline: {result['carrier']}")`;

const SNIPPET_RESPONSE = `// API Response format
{
  "valid": true,
  "is_sms_capable": true,
  "line_type": "mobile",       // "mobile" | "landline" | "voip" | "invalid"
  "carrier": "T-Mobile",
  "country_code": "US",
  "formatted": "+1 (404) 555-1234",
  "reason": null               // populated if valid: false
}`;

// ── Nav items ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "quickstart",  label: "Quick Start" },
  { id: "targeting",   label: "Field Targeting" },
  { id: "events",      label: "JS Events" },
  { id: "api",         label: "REST API" },
  { id: "response",    label: "Response Format" },
  { id: "systems",     label: "Tested Systems" },
];

// ── Main component ─────────────────────────────────────────────────────────
export default function DeveloperDocs() {
  const [activeNav, setActiveNav] = useState("quickstart");

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        a { color: #7c3aed; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 32px", display: "flex", alignItems: "center", gap: 12, position: "sticky" as const, top: 0, zIndex: 100 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📡</div>
        <span style={{ color: "#111827", fontWeight: 700, fontSize: 16 }}>TrueReach</span>
        <span style={{ color: "#d1d5db" }}>·</span>
        <span style={{ color: "#6b7280", fontSize: 14 }}>Developer Documentation</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Pill color="green" label="v1.0 Stable" />
          <Pill color="blue"  label="REST + Widget" />
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto", padding: "32px 24px", gap: 40 }}>

        {/* Sidebar nav */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ position: "sticky" as const, top: 80 }}>
            <p style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 12px" }}>On this page</p>
            {NAV_ITEMS.map(({ id, label }) => (
              <a key={id} href={`#${id}`} onClick={() => setActiveNav(id)} style={{
                display: "block", padding: "6px 12px", borderRadius: 6, marginBottom: 2,
                background: activeNav === id ? "#f3e8ff" : "transparent",
                color: activeNav === id ? "#7c3aed" : "#6b7280",
                fontSize: 13, fontWeight: activeNav === id ? 600 : 400,
                textDecoration: "none", borderLeft: `2px solid ${activeNav === id ? "#7c3aed" : "transparent"}`,
              }}>
                {label}
              </a>
            ))}

            {/* API Key box */}
            <div style={{ marginTop: 28, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "14px" }}>
              <p style={{ color: "#7c3aed", fontSize: 11, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Your API Key</p>
              <code style={{ color: "#4c1d95", fontSize: 11, fontFamily: "JetBrains Mono", background: "#ede9fe", padding: "4px 8px", borderRadius: 4, display: "block", wordBreak: "break-all" as const }}>
                YOUR_API_KEY
              </code>
              <p style={{ color: "#9ca3af", fontSize: 11, margin: "8px 0 0" }}>Contact support to get your production key</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Hero */}
          <div style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderRadius: 16, padding: "32px", marginBottom: 48, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>⚡</span>
              <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 24, margin: 0 }}>2-Line Integration</h1>
            </div>
            <p style={{ color: "#a5b4fc", fontSize: 15, margin: "0 0 20px", lineHeight: 1.6 }}>
              Drop TrueReach into any EHR or Pharmacy Management System in under 5 minutes. No backend changes. No framework dependencies. Works on any platform.
            </p>
            <div style={{ background: "#0f0a2e", borderRadius: 10, padding: "16px", fontFamily: "JetBrains Mono", fontSize: 13, color: "#86efac", lineHeight: 1.8 }}>
              <span style={{ color: "#64748b" }}>&lt;!-- Paste before &lt;/body&gt; --&gt;</span><br />
              <span style={{ color: "#7dd3fc" }}>&lt;script</span> <span style={{ color: "#93c5fd" }}>src=</span><span style={{ color: "#86efac" }}>"…/truereach-widget.js"</span><br />
              {"  "}<span style={{ color: "#93c5fd" }}>data-api-key=</span><span style={{ color: "#86efac" }}>"YOUR_KEY"</span><span style={{ color: "#7dd3fc" }}>&gt;&lt;/script&gt;</span>
            </div>
          </div>

          {/* Quick Start */}
          <Section id="quickstart" step="1" title="Quick Start" desc="Add the widget script to your PMS HTML template — that's it.">
            <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
              Paste this snippet before the closing <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>&lt;/body&gt;</code> tag in your PMS HTML template. Replace the three <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontSize: 13 }}>data-*</code> attributes with your actual values.
            </p>
            <CodeBlock code={SNIPPET_BASIC} lang="html" />

            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 16px", marginTop: 16 }}>
              <p style={{ color: "#15803d", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>✓ What happens automatically</p>
              <ul style={{ color: "#166534", fontSize: 13, margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                <li>Scans the page for phone fields on load</li>
                <li>Validates any existing number immediately</li>
                <li>Applies green / blue / red border based on result</li>
                <li>Re-validates whenever a tech edits the field</li>
                <li>Shows tooltip with reason on hover</li>
                <li>Logs every event to your TrueReach dashboard</li>
              </ul>
            </div>

            <div style={{ marginTop: 20 }}>
              <p style={{ color: "#374151", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Advanced — with all config options:</p>
              <CodeBlock code={SNIPPET_ADVANCED} lang="html" />
            </div>
          </Section>

          <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", marginBottom: 48 }} />

          {/* Field Targeting */}
          <Section id="targeting" step="2" title="Field Targeting" desc="The widget uses 5 fallback strategies to find phone fields on any platform.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { priority: "1st", selector: 'input[type="tel"]',          desc: "Standard HTML tel inputs" },
                { priority: "2nd", selector: ".truereach-phone",            desc: "Add this class to any field" },
                { priority: "3rd", selector: "#phone, #primary_phone…",     desc: "Common EHR field IDs" },
                { priority: "4th", selector: 'input[name*="phone"]',        desc: "Name attribute matching" },
                { priority: "5th", selector: 'input[placeholder*="phone"]', desc: "Placeholder text matching" },
              ].map(({ priority, selector, desc }) => (
                <div key={priority} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ background: "#f3e8ff", color: "#7c3aed", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10 }}>{priority}</span>
                    <code style={{ color: "#1f2937", fontSize: 12, fontFamily: "JetBrains Mono" }}>{selector}</code>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
            <CodeBlock code={SNIPPET_TARGETING} lang="html" />
          </Section>

          <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", marginBottom: 48 }} />

          {/* JS Events */}
          <Section id="events" step="3" title="JavaScript Events" desc="Listen for validation results to trigger custom logic in your PMS.">
            <CodeBlock code={SNIPPET_EVENTS} lang="javascript" />
            <div style={{ marginTop: 16 }}>
              <p style={{ color: "#374151", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Manual trigger:</p>
              <CodeBlock code={SNIPPET_MANUAL} lang="javascript" />
            </div>
          </Section>

          <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", marginBottom: 48 }} />

          {/* REST API */}
          <Section id="api" step="4" title="REST API" desc="Call the validation API directly from your backend for server-side validation.">
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
              {[
                { method: "GET", endpoint: "/api/validate", desc: "Validate a single number" },
                { method: "POST", endpoint: "/api/truereach/log", desc: "Log a validation event" },
                { method: "GET", endpoint: "/api/truereach/events", desc: "Fetch event log" },
                { method: "GET", endpoint: "/api/truereach/stats", desc: "Fetch summary stats" },
              ].map(({ method, endpoint, desc }) => (
                <div key={endpoint} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", flex: "1 1 200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ background: method === "GET" ? "#eff6ff" : "#faf5ff", color: method === "GET" ? "#2563eb" : "#7c3aed", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 4, fontFamily: "JetBrains Mono" }}>{method}</span>
                    <code style={{ color: "#1f2937", fontSize: 12, fontFamily: "JetBrains Mono" }}>{endpoint}</code>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
            <CodeBlock code={SNIPPET_PYTHON} lang="python" />
          </Section>

          <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", marginBottom: 48 }} />

          {/* Response format */}
          <Section id="response" step="5" title="Response Format" desc="Every validation returns a consistent JSON object.">
            <CodeBlock code={SNIPPET_RESPONSE} lang="javascript" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
              {[
                { field: "valid",         type: "boolean", desc: "True if number is real and reachable" },
                { field: "is_sms_capable",type: "boolean", desc: "True if SMS texts can be delivered" },
                { field: "line_type",     type: "string",  desc: "mobile / landline / voip / invalid" },
                { field: "carrier",       type: "string",  desc: "Carrier name (T-Mobile, Verizon…)" },
                { field: "formatted",     type: "string",  desc: "Standardized E.164 format" },
                { field: "reason",        type: "string",  desc: "Error reason if valid is false" },
              ].map(({ field, type, desc }) => (
                <div key={field} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <code style={{ color: "#7c3aed", fontSize: 13, fontFamily: "JetBrains Mono", fontWeight: 600 }}>{field}</code>
                    <span style={{ color: "#d1d5db", fontSize: 11 }}>{type}</span>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", marginBottom: 48 }} />

          {/* Tested systems */}
          <Section id="systems" step="6" title="Tested Systems" desc="TrueReach has been validated on the following healthcare platforms.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { name: "QS/1 NRx",          status: "Verified",     type: "Pharmacy" },
                { name: "PioneerRx",          status: "Verified",     type: "Pharmacy" },
                { name: "Epic EHR",           status: "Verified",     type: "EHR" },
                { name: "PointClickCare",     status: "Verified",     type: "LTC" },
                { name: "Cerner",             status: "Verified",     type: "EHR" },
                { name: "RxDispense",         status: "Verified",     type: "Pharmacy" },
                { name: "CareTracker",        status: "In testing",   type: "Practice Mgmt" },
                { name: "Custom HTML/JS PMS", status: "Verified",     type: "Any platform" },
                { name: "React / Vue SPAs",   status: "Verified",     type: "SPA support" },
              ].map(({ name, status, type }) => (
                <div key={name} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ color: "#111827", fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>{name}</p>
                    <p style={{ color: "#9ca3af", fontSize: 11, margin: 0 }}>{type}</p>
                  </div>
                  <Pill color={status === "Verified" ? "green" : "orange"} label={status} />
                </div>
              ))}
            </div>
          </Section>

          {/* Support footer */}
          <div style={{ background: "linear-gradient(135deg,#f3e8ff,#ede9fe)", border: "1px solid #e9d5ff", borderRadius: 16, padding: "28px 32px", textAlign: "center" as const }}>
            <h3 style={{ color: "#4c1d95", fontWeight: 800, fontSize: 18, margin: "0 0 8px" }}>Need help integrating?</h3>
            <p style={{ color: "#6d28d9", fontSize: 14, margin: "0 0 16px" }}>Our team can walk you through integration in a 30-minute call.</p>
            <a href="/#contact" style={{
              display: "inline-block",
              background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
              color: "#fff", fontWeight: 700, fontSize: 14,
              padding: "10px 28px", borderRadius: 8,
              textDecoration: "none",
            }}>
              Request Integration Support →
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
