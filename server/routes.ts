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

let apiLimiter: RateLimiterPostgres | RateLimiterMemory;
let strictLimiter: RateLimiterPostgres | RateLimiterMemory;

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

async function validatePhoneNumber(phone: string, apiKey: string): Promise<{
  phone: string;
  valid: boolean;
  phone_type: string;
  can_receive_sms: boolean;
  carrier: string;
  suggestions?: PhoneSuggestion[];
}> {
  try {
    const response = await fetch(
      `https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(phone)}&key=${apiKey}&default_country=US`,
      { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

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

    return {
      phone,
      valid: isValid,
      phone_type: data.phone_type || 'unknown',
      can_receive_sms: (data.phone_type || '').toLowerCase() === 'mobile',
      carrier: data.carrier || 'Unknown',
      suggestions
    };
  } catch (error) {
    console.error(`Error validating phone ${phone}:`, error);
    const suggestions = analyzeInvalidPhone(phone);
    return {
      phone,
      valid: false,
      phone_type: 'error',
      can_receive_sms: false,
      carrier: 'Error',
      suggestions
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

  // Enable CORS for widget integration
  app.use('/api/validate-realtime', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });

  // Real-time validation endpoint for single phone numbers
  app.post('/api/validate-realtime', async (req, res) => {
    try {
      await apiLimiter.consume(req.ip || 'unknown');

      const { phone, country = 'US' } = req.body;

      if (!phone) {
        return res.status(400).json({ error: 'Phone number required' });
      }

      const apiKey = process.env.VERIPHONE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      const response = await fetch(
        `https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(phone)}&key=${apiKey}&default_country=${country}`,
        { 
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('API quota exceeded - please check your Veriphone API plan');
        }
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
      
      const result = {
        valid: isValid,
        phone_type: data.phone_type || 'unknown',
        can_receive_sms: (data.phone_type || '').toLowerCase() === 'mobile',
        carrier: data.carrier || 'Unknown',
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
        result.warnings.push('Landline - cannot receive SMS');
      } else if (result.phone_type === 'voip') {
        result.warnings.push('VOIP number - SMS delivery may be unreliable');
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

  app.post('/api/validate', upload.single('file'), async (req, res) => {
    try {
      await strictLimiter.consume(req.ip || 'unknown');

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

  // Contact form endpoint - proxies to Web3Forms to avoid domain blocking
  app.post('/api/contact', async (req, res) => {
    try {
      await strictLimiter.consume(req.ip || 'unknown');

      const { name, email, organization, phone, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
      }

      // Use URLSearchParams (form-urlencoded) format which Web3Forms accepts better
      const formData = new URLSearchParams();
      formData.append('access_key', '2603658f-9610-45e5-8d3c-0ae67ef63013');
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
