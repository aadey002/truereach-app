import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgTable,
  real,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Daily aggregate validation counts per org — no PII, HIPAA-safe
export const validationSummaries = pgTable(
  "validation_summaries",
  {
    id: serial("id").primaryKey(),
    orgId: varchar("org_id").notNull(),
    periodDate: date("period_date").notNull(),
    source: varchar("source").notNull(), // 'batch' | 'realtime'
    totalValidated: integer("total_validated").notNull().default(0),
    mobileCount: integer("mobile_count").notNull().default(0),
    fixedLineCount: integer("fixed_line_count").notNull().default(0),
    voipCount: integer("voip_count").notNull().default(0),
    invalidCount: integer("invalid_count").notNull().default(0),
    smsCapableCount: integer("sms_capable_count").notNull().default(0),
    mvnoDetectedCount: integer("mvno_detected_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_val_summary_org_date_source").on(
      table.orgId,
      table.periodDate,
      table.source
    ),
  ]
);

// Daily carrier breakdown per org — tracks carrier distribution by line type
export const carrierSummaries = pgTable(
  "carrier_summaries",
  {
    id: serial("id").primaryKey(),
    orgId: varchar("org_id").notNull(),
    periodDate: date("period_date").notNull(),
    carrierName: varchar("carrier_name").notNull(),
    lineType: varchar("line_type").notNull(), // 'mobile' | 'fixed_line' | 'voip' | 'invalid'
    count: integer("count").notNull().default(0),
    isMvno: boolean("is_mvno").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_carrier_org_date_carrier_type").on(
      table.orgId,
      table.periodDate,
      table.carrierName,
      table.lineType
    ),
  ]
);

// First-ever validation snapshot per org — used for ROI delta calculation
export const orgBaselines = pgTable("org_baselines", {
  id: serial("id").primaryKey(),
  orgId: varchar("org_id").notNull().unique(),
  baselineDate: date("baseline_date").notNull(),
  totalValidated: integer("total_validated").notNull(),
  mobilePct: real("mobile_pct").notNull(),
  fixedLinePct: real("fixed_line_pct").notNull(),
  voipPct: real("voip_pct").notNull(),
  invalidPct: real("invalid_pct").notNull(),
  dataQualityGrade: varchar("data_quality_grade", { length: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ValidationSummary = typeof validationSummaries.$inferSelect;
export type CarrierSummary = typeof carrierSummaries.$inferSelect;
export type OrgBaseline = typeof orgBaselines.$inferSelect;
