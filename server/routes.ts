import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { RateLimiterPostgres, RateLimiterMemory } from "rate-limiter-flexible";
import pg from "pg";
import { validationResponseSchema } from "@shared/schema";
import { analyzeInvalidPhone, isValidNANPFormat, getNANPSuggestion, type PhoneSuggestion } from "./phoneAnalyzer";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { recordValidationAggregates } from "./analyticsService";
import { db } from "./db";
import { validationSummaries, carrierSummaries, orgBaselines } from "@shared/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";

let apiLimiter: RateLimiterPostgres | RateLimiterMemory;
let strictLimiter: RateLimiterPostgres | RateLimiterMemory;
let orgDailyLimiter: RateLimiterPostgres | RateLimiterMemory;

import { KNOWN_MOBILE_CARRIERS, isKnownMobileCarrier } from "./carriers";

// Per-org daily validation cap (default 10,000 validations/day)
const ORG_DAILY_LIMIT = parseInt(process.env.ORG_DAILY_VALIDATION_LIMIT || '10000');

if (process.env.DATABASE_URL) {
  const rateLimitPool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  const apiLimiterReady = new RateLimiterPostgres({
    storeClient: rateLimitPool,
    tableName: 'rate_limit_api',
    points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000,
  });

  const strictLimiterReady = new RateLimiterPostgres({
    storeClient: rateLimitPool,
    tableName: 'rate_limit_strict',
    points: 10,
    duration: 60,
  });

  orgDailyLimiter = new RateLimiterPostgres({
    storeClient: rateLimitPool,
    tableName: 'rate_limit_org_daily',
    points: ORG_DAILY_LIMIT,
    duration: 86400, // 24 hours
  });

  apiLimiter = apiLimiterReady;
  strictLimiter = strictLimiterReady;
} else {
  apiLimiter = new RateLimiterMemory({
    points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000,
  });

  strictLimiter = new RateLimiterMemory({
    points: 10,
    duration: 60,
  });

  orgDailyLimiter = new RateLimiterMemory({
    points: ORG_DAILY_LIMIT,
    duration: 86400,
  });
}
// Use req.ip which respects the 'trust proxy' setting and cannot be spoofed
function getClientIp(req: any): string {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

// PayPal integration - conditionally import based on environment variables
let paypalModule: any = null;
const paypalEnabled = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
if (paypalEnabled) {
  import("./paypal").then(mod => {
    paypalModule = mod;
  }).catch(err => {
    console.warn("PayPal module not loaded:", err.message);
  });
}

const upload = multer({ storage: multer.memoryStorage() });

interface VeriphoneResponse {
  phone_valid?: boolean;
  phone_type?: string;
  carrier?: string;
  status?: string;
  international_number?: string;
  local_format?: string;
  country_code?: string;
}

const VERIPHONE_TIMEOUT_MS = 10_000;
const TWILIO_TIMEOUT_MS = 8_000;

interface TwilioLookupResult {
  line_type: string; // 'mobile' | 'landline' | 'fixedVoip' | 'nonFixedVoip'
  carrier_name: string;
}

// Twilio Lookup v2 — used as fallback for fixed_line numbers to detect text-enabled landlines
async function twilioLookup(phone: string): Promise<TwilioLookupResult | null> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    console.log('[Twilio] Missing credentials — ACCOUNT_SID:', !!accountSid, 'AUTH_TOKEN:', !!authToken);
    return null;
  }

  try {
    // Normalize to E.164
    let digits = phone.replace(/\D/g, '');
    while (digits.length > 10 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    const e164 = '%2B1' + digits;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TWILIO_TIMEOUT_MS);

    const credentials = Buffer.from(accountSid.trim() + ':' + authToken.trim()).toString('base64');
    const url = 'https://lookups.twilio.com/v2/PhoneNumbers/' + e164 + '?Fields=line_type_intelligence';
    console.log('[Twilio] Looking up:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Basic ' + credentials
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Twilio] HTTP', response.status, errorBody);
      return null;
    }

    const data = await response.json();
    const lti = data.line_type_intelligence;
    if (!lti) {
      console.error('[Twilio] No line_type_intelligence in response:', JSON.stringify(data));
      return null;
    }

    console.log('[Twilio] Result:', lti.type, '- carrier:', lti.carrier_name);
    return {
      line_type: (lti.type || 'unknown').toLowerCase(),
      carrier_name: lti.carrier_name || ''
    };
  } catch (err) {
    console.error('[Twilio] Lookup error:', err instanceof Error ? err.message : err);
    return null;
  }
}

async function validatePhoneNumber(phone: string, apiKey: string): Promise<{
  phone: string;
  valid: boolean;
  phone_type: string;
  can_receive_sms: boolean;
  carrier: string;
  suggestions?: PhoneSuggestion[];
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), VERIPHONE_TIMEOUT_MS);
    const response = await fetch(
      `https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(phone)}&key=${apiKey}&default_country=US`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: VeriphoneResponse = await response.json();

    // CRITICAL: Apply NANP validation with proper digit normalization
    let digits = phone.replace(/\D/g, '');
    // Normalize: Remove leading "1" (country code) whenever present and length > 10
    while (digits.length > 10 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    
    const isApiValid = data.phone_valid || false;
    const isNANPValid = digits.length === 10 && isValidNANPFormat(digits);
    
    // CRITICAL: NANP validation is DECISIVE - reject if NANP fails regardless of Veriphone
    // A number is only truly valid if BOTH Veriphone AND NANP validation pass
    let isValid: boolean;
    if (!isNANPValid) {
      // NANP validation failed - ALWAYS mark as invalid, ignore Veriphone
      isValid = false;
    } else if (!isApiValid) {
      // Veriphone validation failed - mark as invalid
      isValid = false;
    } else {
      // Both passed - mark as valid
      isValid = true;
    }
    
    let suggestions: PhoneSuggestion[] | undefined;

    // Generate suggestions for invalid numbers (including NANP violations)
    if (!isValid) {
      // CRITICAL: ALWAYS run full analysis to get all suggestions (placeholder, transposed, etc.)
      // Pass ORIGINAL phone string to preserve format issue detection (extensions, punctuation, etc.)
      const standardSuggestions = analyzeInvalidPhone(phone, data.status);
      
      // If NANP validation failed, ADD specific NANP guidance at the beginning (highest priority)
      if (!isNANPValid && digits.length === 10) {
        const nanpSuggestion = getNANPSuggestion(digits);
        if (nanpSuggestion) {
          // Prepend NANP suggestion - it should be shown first as highest confidence
          suggestions = [nanpSuggestion, ...standardSuggestions];
        } else {
          suggestions = standardSuggestions;
        }
      } else {
        suggestions = standardSuggestions;
      }
    }

    const batchPhoneType = (data.phone_type || 'unknown').toLowerCase();
    const batchCarrier = data.carrier || 'Unknown';
    let finalPhoneType = batchPhoneType;
    let canSms = false;
    let finalCarrier = batchCarrier;

    // Twilio is primary line type source for all valid numbers
    if (isValid) {
      const twilio = await twilioLookup(phone);
      if (twilio) {
        if (twilio.line_type === 'mobile' || twilio.line_type === 'fixedvoip') {
          finalPhoneType = 'mobile';
          canSms = true;
        } else if (twilio.line_type === 'nonfixedvoip') {
          finalPhoneType = 'voip';
        } else if (twilio.line_type === 'landline') {
          finalPhoneType = 'fixed_line';
        }
        if (twilio.carrier_name) {
          finalCarrier = twilio.carrier_name;
        }
      } else {
        // Twilio unavailable — fall back to Veriphone + MVNO correction
        const batchIsMobile = isKnownMobileCarrier(batchCarrier);
        finalPhoneType = (batchIsMobile && batchPhoneType !== 'mobile') ? 'mobile' : batchPhoneType;
        canSms = batchPhoneType === 'mobile' || batchIsMobile;
      }
    }

    return {
      phone,
      valid: isValid,
      phone_type: finalPhoneType,
      can_receive_sms: canSms,
      carrier: finalCarrier,
      suggestions
    };
  } catch (error) {
    console.error(`Error validating phone ${phone}:`, error);
    // Fallback: use NANP-only validation when Veriphone is unavailable
    let digits = phone.replace(/\D/g, '');
    while (digits.length > 10 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    const isNANPValid = digits.length === 10 && isValidNANPFormat(digits);
    const suggestions = analyzeInvalidPhone(phone);
    return {
      phone,
      valid: isNANPValid,
      phone_type: isNANPValid ? 'unknown' : 'error',
      can_receive_sms: false,
      carrier: isNANPValid ? 'Unknown (offline validation)' : 'Error',
      suggestions: isNANPValid ? undefined : suggestions
    };
  }
}

interface PatientData {
  phone: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  id?: string;
  email?: string;
  dob?: string;
}

function findColumn(keys: string[], patterns: string[]): string | undefined {
  return keys.find(key => {
    const lower = key.toLowerCase();
    return patterns.some(p => lower.includes(p));
  });
}

function extractName(row: Record<string, any>, keys: string[]): { name?: string; firstName?: string; lastName?: string } {
  // Check for separate first/last name columns (common FQHC/clinic variations)
  const firstNameCol = findColumn(keys, ['first_name', 'firstname', 'first name', 'fname', 'first', 'pt first', 'patient first']);
  const lastNameCol = findColumn(keys, ['last_name', 'lastname', 'last name', 'lname', 'last', 'pt last', 'patient last']);
  
  if (firstNameCol && lastNameCol) {
    const firstName = row[firstNameCol] ? String(row[firstNameCol]).trim() : undefined;
    const lastName = row[lastNameCol] ? String(row[lastNameCol]).trim() : undefined;
    return { firstName, lastName, name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName };
  }
  
  // Check for combined name column
  const nameCol = findColumn(keys, ['name', 'patient_name', 'patient name', 'full_name', 'fullname']);
  if (nameCol && row[nameCol]) {
    const fullName = String(row[nameCol]).trim();
    // Check if format is "Last, First"
    if (fullName.includes(',')) {
      const parts = fullName.split(',').map(s => s.trim());
      return { name: `${parts[1]} ${parts[0]}`, firstName: parts[1], lastName: parts[0] };
    }
    // Assume "First Last" format
    const parts = fullName.split(/\s+/);
    if (parts.length >= 2) {
      return { name: fullName, firstName: parts[0], lastName: parts.slice(1).join(' ') };
    }
    return { name: fullName, firstName: fullName };
  }
  
  return {};
}

function parsePatientData(fileBuffer: Buffer, filename: string): PatientData[] {
  const patients: PatientData[] = [];

  try {
    let data: Record<string, any>[] = [];
    
    if (filename.endsWith('.csv')) {
      const text = fileBuffer.toString('utf-8');
      const parsed = Papa.parse(text, { header: true });
      data = parsed.data as Record<string, any>[];
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
    }

    if (data && data.length > 0) {
      const firstRow = data[0];
      const keys = Object.keys(firstRow);
      
      // Find phone column
      const phoneCol = findColumn(keys, ['phone', 'mobile', 'cell', 'telephone', 'tel']) || keys[0];
      
      // Find other columns
      const idCol = findColumn(keys, ['id', 'patient_id', 'patientid', 'patient id', 'mrn', 'record']);
      const emailCol = findColumn(keys, ['email', 'e-mail', 'mail']);
      const dobCol = findColumn(keys, ['dob', 'date_of_birth', 'dateofbirth', 'birth', 'birthday', 'birthdate']);

      data.forEach((row: Record<string, any>) => {
        const phoneValue = row[phoneCol];
        if (phoneValue && String(phoneValue).trim() && String(phoneValue).toLowerCase() !== 'nan') {
          const nameData = extractName(row, keys);
          
          patients.push({
            phone: String(phoneValue).trim(),
            ...nameData,
            id: idCol && row[idCol] ? String(row[idCol]).trim() : undefined,
            email: emailCol && row[emailCol] ? String(row[emailCol]).trim() : undefined,
            dob: dobCol && row[dobCol] ? String(row[dobCol]).trim() : undefined,
          });
        }
      });
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error('Failed to parse file');
  }

  return patients;
}

// Auth middleware: requires either a valid session or X-API-Key header
function requireApiAuth(req: any, res: any, next: any) {
  // Allow authenticated sessions (Replit Auth)
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  // Allow valid API key header
  const apiKeyHeader = req.headers['x-api-key'];
  const validApiKeys = (process.env.TRUEREACH_API_KEYS || '').split(',').filter(Boolean);
  if (apiKeyHeader && validApiKeys.includes(apiKeyHeader)) {
    return next();
  }
  // In development, allow unauthenticated access for testing
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required. Provide a session or X-API-Key header.' });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth BEFORE other routes
  await setupAuth(app);
  registerAuthRoutes(app);

  // Developer password verification endpoint
  app.post('/api/verify-dev-password', (req, res) => {
    const { password } = req.body;
    const devPassword = process.env.DEV_DOCS_PASSWORD;
    
    if (!devPassword) {
      // If no password is set, allow access (for initial setup)
      return res.json({ valid: true });
    }
    
    const isValid = password === devPassword;
    res.json({ valid: isValid });
  });

  // PayPal routes (only if configured)
  if (paypalEnabled) {
    app.get("/paypal/setup", async (req, res) => {
      if (paypalModule) {
        await paypalModule.loadPaypalDefault(req, res);
      } else {
        res.status(503).json({ error: "PayPal is initializing, please try again" });
      }
    });

    app.post("/paypal/order", async (req, res) => {
      if (paypalModule) {
        await paypalModule.createPaypalOrder(req, res);
      } else {
        res.status(503).json({ error: "PayPal is initializing, please try again" });
      }
    });

    app.post("/paypal/order/:orderID/capture", async (req, res) => {
      if (paypalModule) {
        await paypalModule.capturePaypalOrder(req, res);
      } else {
        res.status(503).json({ error: "PayPal is initializing, please try again" });
      }
    });
  }

  // CORS for widget integration — use allowed origins, not wildcard
  app.use('/api/validate-realtime', (req, res, next) => {
    const origin = req.headers.origin;
    const widgetOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
    const defaults = ['http://localhost:5000', 'http://localhost:3000', 'https://true-reach.app', 'https://www.true-reach.app'];
    const allowed = Array.from(new Set(defaults.concat(widgetOrigins)));
    if (origin && allowed.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  });

  // Real-time validation endpoint for single phone numbers
  app.post('/api/validate-realtime', async (req, res) => {
    try {
      await apiLimiter.consume(getClientIp(req));

      const { phone, country = 'US', org_id } = req.body;

      // Per-org daily validation cap
      if (org_id) {
        try {
          await orgDailyLimiter.consume('org:' + org_id);
        } catch (orgErr: any) {
          if (orgErr?.msBeforeNext !== undefined) {
            return res.status(429).json({ error: 'Organization daily validation limit reached', valid: false });
          }
        }
      }

      if (!phone) {
        return res.status(400).json({ error: 'Phone number required' });
      }

      const apiKey = process.env.VERIPHONE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), VERIPHONE_TIMEOUT_MS);
      let data: VeriphoneResponse;
      try {
        const response = await fetch(
          `https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(phone)}&key=${apiKey}&default_country=${country}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            },
            signal: controller.signal
          }
        );
        clearTimeout(timeout);

        if (!response.ok) {
          if (response.status === 402) {
            throw new Error('API quota exceeded - please check your Veriphone API plan');
          }
          throw new Error(`API request failed: ${response.status}`);
        }

        data = await response.json();
      } catch (fetchError) {
        clearTimeout(timeout);
        // Fallback: NANP-only validation when Veriphone is unavailable
        let fallbackDigits = phone.replace(/\D/g, '');
        while (fallbackDigits.length > 10 && fallbackDigits.startsWith('1')) {
          fallbackDigits = fallbackDigits.slice(1);
        }
        const nanpValid = fallbackDigits.length === 10 && isValidNANPFormat(fallbackDigits);
        const suggestions = nanpValid ? undefined : analyzeInvalidPhone(phone);
        return res.json({
          valid: nanpValid,
          phone_type: nanpValid ? 'unknown' : 'error',
          can_receive_sms: false,
          carrier: nanpValid ? 'Unknown (offline validation)' : 'Error',
          formatted: phone,
          local_format: '',
          country,
          warnings: [nanpValid ? 'Validated offline — carrier info unavailable' : 'Invalid phone number'],
          suggestions
        });
      }

      // CRITICAL: Apply NANP validation with proper digit normalization
      let digits = phone.replace(/\D/g, '');
      // Normalize: Remove leading "1" (country code) whenever present and length > 10
      while (digits.length > 10 && digits.startsWith('1')) {
        digits = digits.slice(1);
      }
      
      const isApiValid = data.phone_valid || false;
      const isNANPValid = digits.length === 10 && isValidNANPFormat(digits);
      
      // CRITICAL: NANP validation is DECISIVE - reject if NANP fails regardless of Veriphone
      // A number is only truly valid if BOTH Veriphone AND NANP validation pass
      let isValid: boolean;
      if (!isNANPValid) {
        // NANP validation failed - ALWAYS mark as invalid, ignore Veriphone
        isValid = false;
      } else if (!isApiValid) {
        // Veriphone validation failed - mark as invalid
        isValid = false;
      } else {
        // Both passed - mark as valid
        isValid = true;
      }
      
      // Twilio is primary line type source for all valid numbers
      const apiPhoneType = (data.phone_type || 'unknown').toLowerCase();
      const veriCarrier = data.carrier || 'Unknown';
      let correctedPhoneType = apiPhoneType;
      let canReceiveSms = false;
      let carrierName = veriCarrier;

      if (isValid) {
        const twilio = await twilioLookup(phone);
        if (twilio) {
          if (twilio.line_type === 'mobile' || twilio.line_type === 'fixedvoip') {
            correctedPhoneType = 'mobile';
            canReceiveSms = true;
          } else if (twilio.line_type === 'nonfixedvoip') {
            correctedPhoneType = 'voip';
          } else if (twilio.line_type === 'landline') {
            correctedPhoneType = 'fixed_line';
          }
          if (twilio.carrier_name) {
            carrierName = twilio.carrier_name;
          }
        } else {
          // Twilio unavailable — fall back to Veriphone + MVNO correction
          const isMobileByCarrier = isKnownMobileCarrier(veriCarrier);
          correctedPhoneType = (isMobileByCarrier && apiPhoneType !== 'mobile') ? 'mobile' : apiPhoneType;
          canReceiveSms = apiPhoneType === 'mobile' || isMobileByCarrier;
        }
      }

      const result = {
        valid: isValid,
        phone_type: correctedPhoneType,
        can_receive_sms: canReceiveSms,
        carrier: carrierName,
        formatted: data.international_number || phone,
        local_format: data.local_format || '',
        country: data.country_code || country,
        warnings: [] as string[],
        suggestions: undefined as PhoneSuggestion[] | undefined
      };

      // Add warnings and suggestions
      if (!result.valid) {
        // CRITICAL: ALWAYS run full analysis to get all suggestions (placeholder, transposed, etc.)
        // Pass ORIGINAL phone string to preserve format issue detection (extensions, punctuation, etc.)
        const standardSuggestions = analyzeInvalidPhone(phone, data.status);

        // If NANP validation failed, ADD specific NANP guidance and warning
        if (!isNANPValid && digits.length === 10) {
          const nanpSuggestion = getNANPSuggestion(digits);
          if (nanpSuggestion) {
            // Add NANP-specific warning
            result.warnings.push(`Invalid NANP format - ${nanpSuggestion.message}`);
            // Prepend NANP suggestion - it should be shown first as highest confidence
            result.suggestions = [nanpSuggestion, ...standardSuggestions];
          } else {
            result.warnings.push('Invalid NANP format');
            result.suggestions = standardSuggestions;
          }
        } else {
          result.warnings.push('Invalid phone number');
          result.suggestions = standardSuggestions;
        }
      } else if (result.phone_type === 'fixed_line') {
        result.warnings.push('Landline — voice only, not textable');
      } else if (result.phone_type === 'voip') {
        result.warnings.push('VoIP — may be textable');
      }

      // Fire-and-forget analytics aggregation
      if (org_id) {
        recordValidationAggregates(org_id, [{
          valid: result.valid,
          phone_type: result.phone_type,
          can_receive_sms: result.can_receive_sms,
          carrier: result.carrier,
        }], 'realtime').catch(err =>
          console.error('[Analytics] realtime aggregate error:', err.message)
        );
      }

      res.json(result);
    } catch (error: any) {
      if (error?.msBeforeNext !== undefined) {
        res.set('Retry-After', String(Math.ceil(error.msBeforeNext / 1000)));
        return res.status(429).json({ error: 'Too many requests', valid: false });
      }
      console.error('Real-time validation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Validation failed',
        valid: false
      });
    }
  });

  // Temporary debug endpoint — remove after Twilio is confirmed working
  app.get('/api/debug-twilio', async (req, res) => {
    const phone = (req.query.phone as string) || '7708829000';
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      return res.json({ error: 'Missing Twilio credentials', sid_set: !!sid, token_set: !!token });
    }
    try {
      let digits = phone.replace(/\D/g, '');
      while (digits.length > 10 && digits.startsWith('1')) digits = digits.slice(1);
      const credentials = Buffer.from(sid.trim() + ':' + token.trim()).toString('base64');
      const url = 'https://lookups.twilio.com/v2/PhoneNumbers/%2B1' + digits + '?Fields=line_type_intelligence';
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json', 'Authorization': 'Basic ' + credentials }
      });
      const data = await response.json();
      res.json({ status: response.status, twilio_response: data });
    } catch (err: any) {
      res.json({ error: err.message });
    }
  });

  app.post('/api/validate', requireApiAuth, upload.single('file'), async (req, res) => {
    try {
      await strictLimiter.consume(getClientIp(req));

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const apiKey = process.env.VERIPHONE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      const patients = parsePatientData(req.file.buffer, req.file.originalname);

      if (patients.length === 0) {
        return res.status(400).json({ error: 'No phone numbers found in file' });
      }

      const results = [];

      for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        const validationResult = await validatePhoneNumber(patient.phone, apiKey);
        
        // Merge patient data with validation result
        results.push({
          ...validationResult,
          name: patient.name,
          firstName: patient.firstName,
          lastName: patient.lastName,
          patientId: patient.id,
          email: patient.email,
          dob: patient.dob
        });
        
        // Rate limiting - wait 300ms between requests
        if (i < patients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      const validCount = results.filter(r => r.valid).length;
      const smsCount = results.filter(r => r.can_receive_sms).length;

      const response = {
        details: results,
        valid_count: validCount,
        invalid_count: results.length - validCount,
        sms_count: smsCount
      };

      // Fire-and-forget analytics aggregation
      const batchOrgId = req.body?.org_id || req.headers['x-org-id'] as string || 'unknown';
      recordValidationAggregates(batchOrgId, results.map(r => ({
        valid: r.valid,
        phone_type: r.phone_type,
        can_receive_sms: r.can_receive_sms,
        carrier: r.carrier,
      })), 'batch').catch(err =>
        console.error('[Analytics] batch aggregate error:', err.message)
      );

      res.json(response);
    } catch (error: any) {
      if (error?.msBeforeNext !== undefined) {
        res.set('Retry-After', String(Math.ceil(error.msBeforeNext / 1000)));
        return res.status(429).json({ error: 'Too many requests. Please wait before uploading again.' });
      }
      console.error('Validation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An error occurred during validation' 
      });
    }
  });

  // ── Contact Hygiene Report Endpoints ──────────────────────────────────

  // Full hygiene report for an org
  app.get('/api/reports/hygiene', requireApiAuth, async (req, res) => {
    try {
      const orgId = req.query.org_id as string;
      if (!orgId) return res.status(400).json({ error: 'org_id required' });

      // Aggregate all-time totals for this org
      const summaries = await db
        .select()
        .from(validationSummaries)
        .where(eq(validationSummaries.orgId, orgId));

      const totals = summaries.reduce(
        (acc, row) => {
          acc.total += row.totalValidated;
          acc.mobile += row.mobileCount;
          acc.fixedLine += row.fixedLineCount;
          acc.voip += row.voipCount;
          acc.invalid += row.invalidCount;
          acc.smsCap += row.smsCapableCount;
          acc.mvno += row.mvnoDetectedCount;
          return acc;
        },
        { total: 0, mobile: 0, fixedLine: 0, voip: 0, invalid: 0, smsCap: 0, mvno: 0 }
      );

      const pct = (n: number) => totals.total > 0 ? Math.round((n / totals.total) * 1000) / 10 : 0;
      const invalidPct = pct(totals.invalid);
      const grade = invalidPct < 5 ? 'A' : invalidPct < 15 ? 'B' : invalidPct < 30 ? 'C' : invalidPct < 50 ? 'D' : 'F';

      // Carrier distribution
      const carriers = await db
        .select()
        .from(carrierSummaries)
        .where(eq(carrierSummaries.orgId, orgId));

      const carrierTotals = new Map<string, { total: number; byType: Record<string, number>; isMvno: boolean }>();
      for (const c of carriers) {
        const existing = carrierTotals.get(c.carrierName) || { total: 0, byType: {}, isMvno: c.isMvno };
        existing.total += c.count;
        existing.byType[c.lineType] = (existing.byType[c.lineType] || 0) + c.count;
        carrierTotals.set(c.carrierName, existing);
      }

      const topCarriers = Array.from(carrierTotals.entries())
        .map(([carrier, data]) => ({
          carrier,
          count: data.total,
          pct: totals.total > 0 ? Math.round((data.total / totals.total) * 1000) / 10 : 0,
          is_mvno: data.isMvno,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      const carrierByType: Record<string, { carrier: string; count: number }[]> = { mobile: [], fixed_line: [], voip: [] };
      for (const [carrier, data] of carrierTotals) {
        for (const [type, count] of Object.entries(data.byType)) {
          if (carrierByType[type]) {
            carrierByType[type].push({ carrier, count });
          }
        }
      }
      for (const type of Object.keys(carrierByType)) {
        carrierByType[type].sort((a, b) => b.count - a.count);
        carrierByType[type] = carrierByType[type].slice(0, 10);
      }

      const mvnoTotal = Array.from(carrierTotals.values()).filter(d => d.isMvno).reduce((s, d) => s + d.total, 0);

      // Weekly trends (last 12 weeks)
      const weeklyMap = new Map<string, { total: number; mobile: number; invalid: number }>();
      for (const s of summaries) {
        const d = new Date(s.periodDate);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const weekKey = weekStart.toISOString().slice(0, 10);
        const existing = weeklyMap.get(weekKey) || { total: 0, mobile: 0, invalid: 0 };
        existing.total += s.totalValidated;
        existing.mobile += s.mobileCount;
        existing.invalid += s.invalidCount;
        weeklyMap.set(weekKey, existing);
      }
      const weekly = Array.from(weeklyMap.entries())
        .map(([week, data]) => ({
          week,
          total: data.total,
          mobile_pct: data.total > 0 ? Math.round((data.mobile / data.total) * 1000) / 10 : 0,
          invalid_pct: data.total > 0 ? Math.round((data.invalid / data.total) * 1000) / 10 : 0,
        }))
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-12);

      // Monthly trends (last 6 months)
      const monthlyMap = new Map<string, { total: number; mobile: number; invalid: number }>();
      for (const s of summaries) {
        const monthKey = s.periodDate.slice(0, 7);
        const existing = monthlyMap.get(monthKey) || { total: 0, mobile: 0, invalid: 0 };
        existing.total += s.totalValidated;
        existing.mobile += s.mobileCount;
        existing.invalid += s.invalidCount;
        monthlyMap.set(monthKey, existing);
      }
      const monthly = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          total: data.total,
          mobile_pct: data.total > 0 ? Math.round((data.mobile / data.total) * 1000) / 10 : 0,
          invalid_pct: data.total > 0 ? Math.round((data.invalid / data.total) * 1000) / 10 : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);

      // ROI summary from baseline
      const baseline = await db
        .select()
        .from(orgBaselines)
        .where(eq(orgBaselines.orgId, orgId))
        .limit(1);

      const roi = baseline.length > 0
        ? {
            baseline_date: baseline[0].baselineDate,
            baseline_invalid_pct: baseline[0].invalidPct,
            current_invalid_pct: invalidPct,
            improvement_pct: baseline[0].invalidPct > 0
              ? Math.round(((baseline[0].invalidPct - invalidPct) / baseline[0].invalidPct) * 1000) / 10
              : 0,
            baseline_grade: baseline[0].dataQualityGrade,
            current_grade: grade,
          }
        : null;

      res.json({
        org_id: orgId,
        report_date: new Date().toISOString().slice(0, 10),
        contact_quality_snapshot: {
          total_validated: totals.total,
          mobile_pct: pct(totals.mobile),
          fixed_line_pct: pct(totals.fixedLine),
          voip_pct: pct(totals.voip),
          invalid_pct: invalidPct,
          sms_capable_pct: pct(totals.smsCap),
          mvno_detected_count: totals.mvno,
          data_quality_grade: grade,
        },
        carrier_distribution: {
          top_carriers: topCarriers,
          carrier_by_line_type: carrierByType,
          mvno_detection_rate: totals.total > 0 ? Math.round((mvnoTotal / totals.total) * 1000) / 10 : 0,
        },
        trends: { weekly, monthly },
        roi_summary: roi,
      });
    } catch (error) {
      console.error('[Reports] hygiene error:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });

  // Carrier drill-down
  app.get('/api/reports/carriers', requireApiAuth, async (req, res) => {
    try {
      const orgId = req.query.org_id as string;
      const period = (req.query.period as string) || '30d';
      if (!orgId) return res.status(400).json({ error: 'org_id required' });

      const days = period === '7d' ? 7 : period === '90d' ? 90 : period === 'all' ? 3650 : 30;
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);
      const sinceDateStr = sinceDate.toISOString().slice(0, 10);

      const carriers = await db
        .select()
        .from(carrierSummaries)
        .where(and(
          eq(carrierSummaries.orgId, orgId),
          gte(carrierSummaries.periodDate, sinceDateStr)
        ));

      const carrierMap = new Map<string, { total: number; byType: Record<string, number>; isMvno: boolean }>();
      for (const c of carriers) {
        const existing = carrierMap.get(c.carrierName) || { total: 0, byType: {}, isMvno: c.isMvno };
        existing.total += c.count;
        existing.byType[c.lineType] = (existing.byType[c.lineType] || 0) + c.count;
        carrierMap.set(c.carrierName, existing);
      }

      const grandTotal = Array.from(carrierMap.values()).reduce((s, d) => s + d.total, 0);
      const result = Array.from(carrierMap.entries())
        .map(([carrier, data]) => ({
          carrier,
          count: data.total,
          pct: grandTotal > 0 ? Math.round((data.total / grandTotal) * 1000) / 10 : 0,
          line_types: data.byType,
          is_mvno: data.isMvno,
        }))
        .sort((a, b) => b.count - a.count);

      res.json({ org_id: orgId, period, total: grandTotal, carriers: result });
    } catch (error) {
      console.error('[Reports] carriers error:', error);
      res.status(500).json({ error: 'Failed to generate carrier report' });
    }
  });

  // Time series trends
  app.get('/api/reports/trends', requireApiAuth, async (req, res) => {
    try {
      const orgId = req.query.org_id as string;
      const granularity = (req.query.granularity as string) || 'week';
      if (!orgId) return res.status(400).json({ error: 'org_id required' });

      const summaries = await db
        .select()
        .from(validationSummaries)
        .where(eq(validationSummaries.orgId, orgId));

      const bucketMap = new Map<string, { total: number; mobile: number; fixedLine: number; voip: number; invalid: number; smsCap: number }>();

      for (const s of summaries) {
        let key: string;
        if (granularity === 'day') {
          key = s.periodDate;
        } else if (granularity === 'month') {
          key = s.periodDate.slice(0, 7);
        } else {
          const d = new Date(s.periodDate);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          key = weekStart.toISOString().slice(0, 10);
        }

        const existing = bucketMap.get(key) || { total: 0, mobile: 0, fixedLine: 0, voip: 0, invalid: 0, smsCap: 0 };
        existing.total += s.totalValidated;
        existing.mobile += s.mobileCount;
        existing.fixedLine += s.fixedLineCount;
        existing.voip += s.voipCount;
        existing.invalid += s.invalidCount;
        existing.smsCap += s.smsCapableCount;
        bucketMap.set(key, existing);
      }

      const trends = Array.from(bucketMap.entries())
        .map(([period, data]) => ({
          period,
          total: data.total,
          mobile_pct: data.total > 0 ? Math.round((data.mobile / data.total) * 1000) / 10 : 0,
          fixed_line_pct: data.total > 0 ? Math.round((data.fixedLine / data.total) * 1000) / 10 : 0,
          voip_pct: data.total > 0 ? Math.round((data.voip / data.total) * 1000) / 10 : 0,
          invalid_pct: data.total > 0 ? Math.round((data.invalid / data.total) * 1000) / 10 : 0,
          sms_capable_pct: data.total > 0 ? Math.round((data.smsCap / data.total) * 1000) / 10 : 0,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      res.json({ org_id: orgId, granularity, data: trends });
    } catch (error) {
      console.error('[Reports] trends error:', error);
      res.status(500).json({ error: 'Failed to generate trends' });
    }
  });

  // Contact form endpoint - proxies to Web3Forms to avoid domain blocking
  app.post('/api/contact', async (req, res) => {
    try {
      await strictLimiter.consume(getClientIp(req));

      const { name, email, organization, phone, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
      }

      // Use URLSearchParams (form-urlencoded) format which Web3Forms accepts better
      const formData = new URLSearchParams();
      const web3formsKey = process.env.WEB3FORMS_ACCESS_KEY;
      if (!web3formsKey) {
        return res.status(500).json({ success: false, message: 'Contact form not configured' });
      }
      formData.append('access_key', web3formsKey);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('organization', organization || 'Not provided');
      formData.append('phone', phone || 'Not provided');
      formData.append('message', message);
      formData.append('subject', `TrueReach Demo Request from ${name}`);
      formData.append('from_name', 'TrueReach');

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
      });

      const text = await response.text();
      try {
        const result = JSON.parse(text);
        res.json(result);
      } catch {
        console.error('Web3Forms returned non-JSON:', text.substring(0, 200));
        res.status(500).json({ success: false, message: 'Form service unavailable. Please try again later.' });
      }
    } catch (error: any) {
      if (error?.msBeforeNext !== undefined) {
        res.set('Retry-After', String(Math.ceil(error.msBeforeNext / 1000)));
        return res.status(429).json({ success: false, message: 'Too many requests. Please wait before submitting again.' });
      }
      console.error('Contact form error:', error);
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
