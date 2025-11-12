import { useState } from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";
import ValidationResults, { PhoneValidationResult } from "@/components/ValidationResults";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface ValidationResponse {
  details: PhoneValidationResult[];
  valid_count: number;
  invalid_count: number;
  sms_count: number;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<PhoneValidationResult[] | null>(null);
  const [stats, setStats] = useState<{ valid: number; invalid: number; sms: number } | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const { toast } = useToast();

  const parsePhoneNumbers = async (file: File): Promise<string[]> => {
    const phones: string[] = [];

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;

          if (file.name.endsWith('.csv')) {
            const text = data as string;
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
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData && jsonData.length > 0) {
              const firstRow = jsonData[0] as Record<string, any>;
              const phoneColumn = Object.keys(firstRow).find(key =>
                key.toLowerCase().includes('phone')
              ) || Object.keys(firstRow)[0];

              jsonData.forEach((row: any) => {
                const phoneValue = row[phoneColumn];
                if (phoneValue && String(phoneValue).trim() && String(phoneValue).toLowerCase() !== 'nan') {
                  phones.push(String(phoneValue).trim());
                }
              });
            }
          }

          resolve(phones);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const validateSinglePhone = async (phone: string): Promise<PhoneValidationResult> => {
    const response = await fetch('/api/validate-realtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      throw new Error('Validation failed');
    }

    const data = await response.json();
    
    return {
      phone,
      valid: data.valid,
      phone_type: data.phone_type,
      can_receive_sms: data.can_receive_sms,
      carrier: data.carrier,
    };
  };

  const handleValidation = async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    setResults(null);
    setProgress({ current: 0, total: 0, percentage: 0 });

    try {
      const phones = await parsePhoneNumbers(selectedFile);

      if (phones.length === 0) {
        throw new Error('No phone numbers found in file');
      }

      setProgress({ current: 0, total: phones.length, percentage: 0 });

      const validationResults: PhoneValidationResult[] = [];
      let validCount = 0;
      let smsCount = 0;

      for (let i = 0; i < phones.length; i++) {
        try {
          const result = await validateSinglePhone(phones[i]);
          validationResults.push(result);

          if (result.valid) validCount++;
          if (result.can_receive_sms) smsCount++;

          const current = i + 1;
          const percentage = Math.round((current / phones.length) * 100);
          setProgress({ current, total: phones.length, percentage });

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error validating ${phones[i]}:`, error);
          validationResults.push({
            phone: phones[i],
            valid: false,
            phone_type: 'error',
            can_receive_sms: false,
            carrier: 'Error'
          });
        }
      }

      setResults(validationResults);
      setStats({
        valid: validCount,
        invalid: validationResults.length - validCount,
        sms: smsCount
      });

      toast({
        title: "Validation Complete",
        description: `Validated ${validationResults.length} phone numbers successfully.`,
      });
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "An error occurred during validation",
      });
    } finally {
      setIsValidating(false);
      setProgress({ current: 0, total: 0, percentage: 0 });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Card className="p-8 mb-8 text-center">
          <div className="flex flex-col items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-foreground">Batch Phone Validation</h1>
          </div>
          <p className="text-muted-foreground">
            Upload CSV or Excel files to validate phone numbers and identify SMS-capable contacts
          </p>
        </Card>

        <div className="space-y-8">
          <FileUpload 
            onFileSelect={setSelectedFile} 
            disabled={isValidating}
          />

          {selectedFile && !isValidating && !results && (
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={handleValidation}
                className="gap-2"
                data-testid="button-start-validation"
              >
                <Activity className="w-5 h-5" />
                Start Validation
              </Button>
            </div>
          )}

          {isValidating && (
            <div className="space-y-4" data-testid="progress-container">
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-[10px] h-[30px] overflow-hidden">
                <div
                  className="h-full transition-all duration-300 ease-out flex items-center justify-center"
                  style={{
                    width: `${progress.percentage}%`,
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  }}
                  data-testid="progress-bar-fill"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 drop-shadow-sm" data-testid="progress-text">
                    {progress.total > 0 
                      ? `Validating: ${progress.current} of ${progress.total} numbers (${progress.percentage}%)`
                      : 'Preparing validation...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {results && stats && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Validation Results</h2>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setResults(null);
                    setStats(null);
                    setSelectedFile(null);
                  }}
                  data-testid="button-new-validation"
                >
                  New Validation
                </Button>
              </div>
              <ValidationResults
                results={results}
                validCount={stats.valid}
                invalidCount={stats.invalid}
                smsCount={stats.sms}
              />
            </div>
          )}
        </div>
    </div>
  );
}
