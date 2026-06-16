import { eq, sql, and } from "drizzle-orm";
import { db } from "./db";
import {
  validationSummaries,
  carrierSummaries,
  orgBaselines,
} from "@shared/schema";
import { isKnownMobileCarrier } from "./carriers";

interface ValidationResult {
  valid: boolean;
  phone_type: string;
  can_receive_sms: boolean;
  carrier: string;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// Normalize carrier names for consistent aggregation
function normalizeCarrier(carrier: string): string {
  let name = carrier.trim();
  // Collapse common variants
  const variants: Record<string, string> = {
    "t-mobile usa": "T-Mobile",
    "t-mobile": "T-Mobile",
    "at&t mobility": "AT&T",
    "at&t": "AT&T",
    "new cingular wireless": "AT&T",
    "cingular": "AT&T",
    "verizon wireless": "Verizon Wireless",
    "cellco partnership": "Verizon Wireless",
    "sprint": "Sprint/T-Mobile",
    "sprint spectrum": "Sprint/T-Mobile",
    "vonage america llc": "Vonage",
    "vonage america": "Vonage",
    "google voice": "Google Voice",
    "google (grand central)": "Google Voice",
    "bandwidth.com": "Bandwidth",
    "level 3": "Lumen",
    "centurylink": "Lumen",
  };
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(variants)) {
    if (lower.includes(key)) return val;
  }
  return name;
}

function computeGrade(invalidPct: number): string {
  if (invalidPct < 5) return "A";
  if (invalidPct < 15) return "B";
  if (invalidPct < 30) return "C";
  if (invalidPct < 50) return "D";
  return "F";
}

// Record aggregate validation stats — fire-and-forget, never blocks responses
export async function recordValidationAggregates(
  orgId: string,
  results: ValidationResult[],
  source: "batch" | "realtime"
): Promise<void> {
  if (!orgId || results.length === 0) return;

  const date = todayUTC();

  // Compute counts
  let mobileCount = 0;
  let fixedLineCount = 0;
  let voipCount = 0;
  let invalidCount = 0;
  let smsCapableCount = 0;
  let mvnoDetectedCount = 0;

  const carrierMap = new Map<string, { lineType: string; count: number; isMvno: boolean }>();

  for (const r of results) {
    if (!r.valid) {
      invalidCount++;
      const key = normalizeCarrier(r.carrier || "Unknown") + "|invalid";
      const existing = carrierMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        carrierMap.set(key, { lineType: "invalid", count: 1, isMvno: false });
      }
      continue;
    }

    const carrier = normalizeCarrier(r.carrier || "Unknown");
    const isMvno = isKnownMobileCarrier(r.carrier || "");

    if (r.phone_type === "mobile") mobileCount++;
    else if (r.phone_type === "fixed_line") fixedLineCount++;
    else if (r.phone_type === "voip") voipCount++;

    if (r.can_receive_sms) smsCapableCount++;
    if (isMvno) mvnoDetectedCount++;

    const lineType = r.phone_type || "unknown";
    const key = carrier + "|" + lineType;
    const existing = carrierMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      carrierMap.set(key, { lineType, count: 1, isMvno });
    }
  }

  const total = results.length;

  // Upsert validation summary
  await db
    .insert(validationSummaries)
    .values({
      orgId,
      periodDate: date,
      source,
      totalValidated: total,
      mobileCount,
      fixedLineCount,
      voipCount,
      invalidCount,
      smsCapableCount,
      mvnoDetectedCount,
    })
    .onConflictDoUpdate({
      target: [
        validationSummaries.orgId,
        validationSummaries.periodDate,
        validationSummaries.source,
      ],
      set: {
        totalValidated: sql`${validationSummaries.totalValidated} + ${total}`,
        mobileCount: sql`${validationSummaries.mobileCount} + ${mobileCount}`,
        fixedLineCount: sql`${validationSummaries.fixedLineCount} + ${fixedLineCount}`,
        voipCount: sql`${validationSummaries.voipCount} + ${voipCount}`,
        invalidCount: sql`${validationSummaries.invalidCount} + ${invalidCount}`,
        smsCapableCount: sql`${validationSummaries.smsCapableCount} + ${smsCapableCount}`,
        mvnoDetectedCount: sql`${validationSummaries.mvnoDetectedCount} + ${mvnoDetectedCount}`,
        updatedAt: sql`now()`,
      },
    });

  // Upsert carrier summaries
  for (const [key, data] of carrierMap) {
    const carrierName = key.split("|")[0];
    await db
      .insert(carrierSummaries)
      .values({
        orgId,
        periodDate: date,
        carrierName,
        lineType: data.lineType,
        count: data.count,
        isMvno: data.isMvno,
      })
      .onConflictDoUpdate({
        target: [
          carrierSummaries.orgId,
          carrierSummaries.periodDate,
          carrierSummaries.carrierName,
          carrierSummaries.lineType,
        ],
        set: {
          count: sql`${carrierSummaries.count} + ${data.count}`,
        },
      });
  }

  // Auto-capture baseline on first-ever validation for this org
  const existing = await db
    .select({ id: orgBaselines.id })
    .from(orgBaselines)
    .where(eq(orgBaselines.orgId, orgId))
    .limit(1);

  if (existing.length === 0 && total >= 5) {
    const validTotal = mobileCount + fixedLineCount + voipCount;
    const grandTotal = validTotal + invalidCount;
    if (grandTotal > 0) {
      await db.insert(orgBaselines).values({
        orgId,
        baselineDate: date,
        totalValidated: grandTotal,
        mobilePct: (mobileCount / grandTotal) * 100,
        fixedLinePct: (fixedLineCount / grandTotal) * 100,
        voipPct: (voipCount / grandTotal) * 100,
        invalidPct: (invalidCount / grandTotal) * 100,
        dataQualityGrade: computeGrade((invalidCount / grandTotal) * 100),
      });
    }
  }
}
