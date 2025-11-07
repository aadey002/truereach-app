import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { validationResponseSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

interface VeriphoneResponse {
  phone_valid?: boolean;
  phone_type?: string;
  carrier?: string;
  status?: string;
}

async function validatePhoneNumber(phone: string, apiKey: string): Promise<{
  phone: string;
  valid: boolean;
  phone_type: string;
  can_receive_sms: boolean;
  carrier: string;
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

    return {
      phone,
      valid: data.phone_valid || false,
      phone_type: data.phone_type || 'unknown',
      can_receive_sms: (data.phone_type || '').toLowerCase() === 'mobile',
      carrier: data.carrier || 'Unknown'
    };
  } catch (error) {
    console.error(`Error validating phone ${phone}:`, error);
    return {
      phone,
      valid: false,
      phone_type: 'error',
      can_receive_sms: false,
      carrier: 'Error'
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
