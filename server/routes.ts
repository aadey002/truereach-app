import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { validationResponseSchema } from "@shared/schema";
import { analyzeInvalidPhone, isValidNANPFormat, getNANPSuggestion, type PhoneSuggestion } from "./phoneAnalyzer";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

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

function parsePhoneNumbers(fileBuffer: Buffer, filename: string): string[] {
  const phones: string[] = [];

  try {
    if (filename.endsWith('.csv')) {
      const text = fileBuffer.toString('utf-8');
      const parsed = Papa.parse(text, { header: true });
      
      if (parsed.data && parsed.data.length > 0) {
        const firstRow = parsed.data[0] as Record<string, any>;
        const phoneColumn = Object.keys(firstRow).find(key => 
          key.toLowerCase().includes('phone')
        ) || Object.keys(firstRow)[0];

        parsed.data.forEach((row: any) => {
          const phoneValue = row[phoneColumn];
          if (phoneValue && String(phoneValue).trim() && String(phoneValue).toLowerCase() !== 'nan') {
            phones.push(String(phoneValue).trim());
          }
        });
      }
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data && data.length > 0) {
        const firstRow = data[0] as Record<string, any>;
        const phoneColumn = Object.keys(firstRow).find(key => 
          key.toLowerCase().includes('phone')
        ) || Object.keys(firstRow)[0];

        data.forEach((row: any) => {
          const phoneValue = row[phoneColumn];
          if (phoneValue && String(phoneValue).trim() && String(phoneValue).toLowerCase() !== 'nan') {
            phones.push(String(phoneValue).trim());
          }
        });
      }
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error('Failed to parse file');
  }

  return phones;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth BEFORE other routes
  await setupAuth(app);
  registerAuthRoutes(app);

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
    } catch (error) {
      console.error('Real-time validation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Validation failed',
        valid: false
      });
    }
  });

  app.post('/api/validate', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const apiKey = process.env.VERIPHONE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      const phones = parsePhoneNumbers(req.file.buffer, req.file.originalname);

      if (phones.length === 0) {
        return res.status(400).json({ error: 'No phone numbers found in file' });
      }

      const results = [];

      for (let i = 0; i < phones.length; i++) {
        const phone = phones[i];
        const result = await validatePhoneNumber(phone, apiKey);
        results.push(result);
        
        // Rate limiting - wait 300ms between requests
        if (i < phones.length - 1) {
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

      // Validate response with Zod schema
      const validated = validationResponseSchema.parse(response);

      res.json(validated);
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An error occurred during validation' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
