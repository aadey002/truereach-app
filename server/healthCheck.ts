import nodemailer from "nodemailer";

interface CheckResult {
  name: string;
  status: "PASS" | "FAIL";
  statusCode?: number;
  responseTime: number;
  details?: string;
}

const API_BASE = process.env.HEALTH_CHECK_URL || "http://localhost:" + (process.env.PORT || 5000);
const API_KEY = process.env.TRUEREACH_API_KEYS?.split(",")[0] || "";

async function testEndpoint(
  name: string,
  url: string,
  options?: RequestInit,
  validate?: (data: any) => string | null
): Promise<CheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const elapsed = Date.now() - start;
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return { name, status: "FAIL", statusCode: response.status, responseTime: elapsed, details: "Returned HTML instead of JSON — route not registered or deployment stale" };
    }

    if (!response.ok) {
      const body = await response.text();
      return { name, status: "FAIL", statusCode: response.status, responseTime: elapsed, details: body.slice(0, 200) };
    }

    const data = await response.json();

    if (validate) {
      const error = validate(data);
      if (error) {
        return { name, status: "FAIL", statusCode: response.status, responseTime: elapsed, details: error };
      }
    }

    if (elapsed > 5000) {
      return { name, status: "FAIL", statusCode: response.status, responseTime: elapsed, details: "Response time > 5s — possible timeout or upstream delay" };
    }

    return { name, status: "PASS", statusCode: response.status, responseTime: elapsed };
  } catch (err: any) {
    return { name, status: "FAIL", responseTime: Date.now() - start, details: err.message };
  }
}

export async function runHealthCheck(): Promise<{ overall: "PASS" | "FAIL"; checks: CheckResult[]; timestamp: string }> {
  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  };

  const checks: CheckResult[] = [];

  // 1. App health
  checks.push(await testEndpoint("App Health", API_BASE + "/health"));

  // 2. Validate mobile number (Twilio integration)
  checks.push(
    await testEndpoint(
      "Validate Mobile (770-882-9000)",
      API_BASE + "/api/validate-realtime",
      { method: "POST", headers, body: JSON.stringify({ phone: "7708829000", country: "US" }) },
      (data) => {
        if (!data.valid) return "Number should be valid but returned invalid";
        if (data.phone_type !== "mobile") return "Expected phone_type=mobile, got " + data.phone_type;
        if (!data.can_receive_sms) return "Expected can_receive_sms=true";
        if (!data.carrier?.includes("Verizon")) return "Expected Verizon carrier, got " + data.carrier;
        return null;
      }
    )
  );

  // 3. Validate VoIP number
  checks.push(
    await testEndpoint(
      "Validate VoIP (410-286-1615)",
      API_BASE + "/api/validate-realtime",
      { method: "POST", headers, body: JSON.stringify({ phone: "4102861615", country: "US" }) },
      (data) => {
        if (!data.valid) return "Number should be valid but returned invalid";
        if (data.phone_type !== "voip") return "Expected phone_type=voip, got " + data.phone_type;
        if (!data.carrier?.includes("Vonage")) return "Expected Vonage carrier, got " + data.carrier;
        return null;
      }
    )
  );

  // 4. Validate invalid number
  checks.push(
    await testEndpoint(
      "Validate Invalid (555 number)",
      API_BASE + "/api/validate-realtime",
      { method: "POST", headers, body: JSON.stringify({ phone: "2125551234", country: "US" }) },
      (data) => {
        if (data.valid) return "555 number should be invalid but returned valid";
        return null;
      }
    )
  );

  // 5. Hygiene report
  checks.push(
    await testEndpoint(
      "Report: Hygiene",
      API_BASE + "/api/reports/hygiene?org_id=health_check",
      { headers },
      (data) => {
        if (!data.org_id) return "Missing org_id in response";
        if (!data.contact_quality_snapshot) return "Missing contact_quality_snapshot";
        return null;
      }
    )
  );

  // 6. Carrier report
  checks.push(
    await testEndpoint(
      "Report: Carriers",
      API_BASE + "/api/reports/carriers?org_id=health_check&period=30d",
      { headers },
      (data) => {
        if (!data.org_id) return "Missing org_id in response";
        return null;
      }
    )
  );

  // 7. Trends report
  checks.push(
    await testEndpoint(
      "Report: Trends",
      API_BASE + "/api/reports/trends?org_id=health_check&granularity=week",
      { headers },
      (data) => {
        if (!data.org_id) return "Missing org_id in response";
        return null;
      }
    )
  );

  const overall = checks.every((c) => c.status === "PASS") ? "PASS" : "FAIL";

  return { overall, checks, timestamp: new Date().toISOString() };
}

function formatReport(result: { overall: string; checks: CheckResult[]; timestamp: string }): string {
  const lines: string[] = [];
  lines.push("TrueReach Health Check — " + result.overall);
  lines.push("Timestamp: " + result.timestamp);
  lines.push("");

  for (const c of result.checks) {
    const icon = c.status === "PASS" ? "✓" : "✕";
    const time = c.responseTime + "ms";
    lines.push(icon + " " + c.name + " — " + c.status + " (" + time + ")");
    if (c.details) {
      lines.push("  → " + c.details);
    }
  }

  const passed = result.checks.filter((c) => c.status === "PASS").length;
  const total = result.checks.length;
  lines.push("");
  lines.push("Summary: " + passed + "/" + total + " checks passed");

  return lines.join("\n");
}

function formatHtmlReport(result: { overall: string; checks: CheckResult[]; timestamp: string }): string {
  const passed = result.checks.filter((c) => c.status === "PASS").length;
  const total = result.checks.length;
  const overallColor = result.overall === "PASS" ? "#22c55e" : "#ef4444";

  let rows = "";
  for (const c of result.checks) {
    const color = c.status === "PASS" ? "#22c55e" : "#ef4444";
    const icon = c.status === "PASS" ? "✓" : "✕";
    rows += '<tr style="border-bottom:1px solid #e5e7eb">';
    rows += '<td style="padding:8px 12px;font-weight:600;color:' + color + '">' + icon + " " + c.status + "</td>";
    rows += '<td style="padding:8px 12px">' + c.name + "</td>";
    rows += '<td style="padding:8px 12px;text-align:right">' + c.responseTime + "ms</td>";
    rows += '<td style="padding:8px 12px;color:#6b7280;font-size:12px">' + (c.details || "—") + "</td>";
    rows += "</tr>";
  }

  return '<div style="font-family:Inter,system-ui,sans-serif;max-width:640px;margin:0 auto">'
    + '<div style="background:' + overallColor + ';color:#fff;padding:16px 24px;border-radius:10px 10px 0 0">'
    + '<h2 style="margin:0;font-size:18px">TrueReach Health Check — ' + result.overall + "</h2>"
    + '<p style="margin:4px 0 0;font-size:12px;opacity:0.8">' + result.timestamp + "</p>"
    + "</div>"
    + '<div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;overflow:hidden">'
    + '<table style="width:100%;border-collapse:collapse;font-size:14px">'
    + '<thead><tr style="background:#f9fafb">'
    + '<th style="padding:8px 12px;text-align:left">Status</th>'
    + '<th style="padding:8px 12px;text-align:left">Check</th>'
    + '<th style="padding:8px 12px;text-align:right">Time</th>'
    + '<th style="padding:8px 12px;text-align:left">Details</th>'
    + "</tr></thead><tbody>" + rows + "</tbody></table>"
    + '<div style="padding:12px 16px;background:#f9fafb;font-size:13px;color:#6b7280">'
    + passed + "/" + total + " checks passed"
    + "</div></div></div>";
}

export async function sendHealthCheckEmail(result: { overall: string; checks: CheckResult[]; timestamp: string }): Promise<boolean> {
  const smtpUser = process.env.HEALTH_EMAIL_FROM || process.env.GMAIL_USER;
  const smtpPass = process.env.HEALTH_EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const recipient = process.env.HEALTH_EMAIL_TO || "aadey002@gmail.com";

  if (!smtpUser || !smtpPass) {
    console.log("[HealthCheck] Email not configured — set GMAIL_USER and GMAIL_APP_PASSWORD");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: smtpUser, pass: smtpPass },
    });

    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const subject = "TrueReach Health Check — " + result.overall + " — " + date;

    await transporter.sendMail({
      from: smtpUser,
      to: recipient,
      subject,
      text: formatReport(result),
      html: formatHtmlReport(result),
    });

    console.log("[HealthCheck] Email sent to " + recipient);
    return true;
  } catch (err: any) {
    console.error("[HealthCheck] Email failed:", err.message);
    return false;
  }
}

// Run health check, log results, send email if configured
export async function runAndReport(): Promise<void> {
  console.log("[HealthCheck] Running scheduled check...");
  const result = await runHealthCheck();

  console.log("[HealthCheck] " + result.overall + " — " + result.checks.filter(c => c.status === "PASS").length + "/" + result.checks.length + " passed");
  for (const c of result.checks) {
    if (c.status === "FAIL") {
      console.error("[HealthCheck] FAIL: " + c.name + " — " + c.details);
    }
  }

  await sendHealthCheckEmail(result);
}

// Start the recurring health check timer (every 6 hours)
export function startHealthCheckScheduler(): void {
  const intervalMs = 6 * 60 * 60 * 1000; // 6 hours

  // Run first check 30 seconds after startup (let server fully initialize)
  setTimeout(() => {
    runAndReport().catch(err => console.error("[HealthCheck] Error:", err.message));
  }, 30000);

  // Then run every 6 hours
  setInterval(() => {
    runAndReport().catch(err => console.error("[HealthCheck] Error:", err.message));
  }, intervalMs);

  console.log("[HealthCheck] Scheduler started — runs every 6 hours");
}
