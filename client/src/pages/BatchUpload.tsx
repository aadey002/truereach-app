import { useState, useEffect } from "react";
import { Activity, AlertCircle, Info, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";
import ValidationResults, { PhoneValidationResult } from "@/components/ValidationResults";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ValidationResponse {
  details: PhoneValidationResult[];
  valid_count: number;
  invalid_count: number;
  sms_count: number;
}

interface DuplicateInfo {
  phone: string;
  count: number;
  indices: number[];
}

const HIPAA_RETENTION_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<PhoneValidationResult[] | null>(null);
  const [stats, setStats] = useState<{ valid: number; invalid: number; sms: number; duplicates?: number; unique?: number } | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [allPhones, setAllPhones] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [showDuplicateChoice, setShowDuplicateChoice] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [showDuplicateList, setShowDuplicateList] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const { toast } = useToast();

  // HIPAA compliance: Auto-clear results after 30 minutes
  useEffect(() => {
    if (results && results.length > 0) {
      const expiryTime = new Date(Date.now() + HIPAA_RETENTION_MS);
      setSessionExpiry(expiryTime);
      
      const timer = setTimeout(() => {
        setResults(null);
        setStats(null);
        setSelectedFile(null);
        setAllPhones([]);
        setDuplicates([]);
        setSessionExpiry(null);
        toast({
          title: "Session Expired",
          description: "Validation results have been cleared for HIPAA compliance (30-minute retention limit).",
          variant: "default",
        });
      }, HIPAA_RETENTION_MS);

      return () => clearTimeout(timer);
    }
  }, [results]);

  const downloadResultsAsExcel = () => {
    if (!results || !stats) return;

    const workbook = XLSX.utils.book_new();

    // Calculate additional stats for summary
    const mobileCount = results.filter(r => r.valid && r.phone_type === 'mobile').length;
    const landlineCount = results.filter(r => r.valid && r.phone_type === 'fixed_line').length;
    const voipCount = results.filter(r => r.valid && (r.phone_type === 'voip' || r.phone_type === 'unknown')).length;
    const duplicateCount = results.filter(r => r.is_duplicate).length;
    const hasPatientData = results.some(r => r.name || r.patientId);
    const validationDate = new Date().toLocaleString();

    // Create Summary Sheet
    const totalNumbers = stats.valid + stats.invalid;
    const summaryData = [
      ['TRUEREACH VALIDATION REPORT'],
      [''],
      ['Report Generated:', validationDate],
      [''],
      ['VALIDATION SUMMARY'],
      [''],
      ['Total Phone Numbers:', totalNumbers],
      ['Valid Numbers:', stats.valid],
      ['Invalid Numbers:', stats.invalid],
      ['Validation Rate:', `${totalNumbers > 0 ? Math.round((stats.valid / totalNumbers) * 100) : 0}%`],
      [''],
      ['SMS CAPABILITY'],
      [''],
      ['SMS-Capable (Textable):', stats.sms],
      ['Non-SMS (Voice Only):', stats.valid - stats.sms],
      ['SMS Rate:', `${stats.valid > 0 ? Math.round((stats.sms / stats.valid) * 100) : 0}%`],
      [''],
      ['PHONE TYPE BREAKDOWN'],
      [''],
      ['Mobile Phones:', mobileCount],
      ['Landlines:', landlineCount],
      ['VoIP/Other:', voipCount],
      [''],
      ['DATA QUALITY'],
      [''],
      ['Duplicate Numbers Found:', duplicateCount],
      ['Patient Data Included:', hasPatientData ? 'Yes' : 'No'],
      [''],
      [''],
      ['HIPAA NOTICE: This report contains patient contact information.'],
      ['Handle according to your organization\'s privacy policies.'],
      ['Data auto-expires in browser after 30 minutes.']
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Create Data Sheet
    const excelData = results.map(r => ({
      'Patient ID': r.patientId || '',
      'Name': r.name || '',
      'Email': r.email || '',
      'Date of Birth': r.dob || '',
      'Phone Number': r.phone,
      'Status': r.valid ? 'Valid' : 'Invalid',
      'Phone Type': r.phone_type || 'Unknown',
      'Can Receive SMS': r.can_receive_sms ? 'Yes' : 'No',
      'Carrier': r.carrier || 'Unknown',
      'Is Duplicate': r.is_duplicate ? 'Yes' : 'No',
      'Suggested Fix (VERIFY FIRST)': r.suggestions && r.suggestions.length > 0 
        ? r.suggestions.slice(0, 3).map(s => 
            s.suggestedNumbers && s.suggestedNumbers.length > 0 
              ? `${s.suggestedNumbers[0]} (${s.confidence || 0}%)`
              : s.message
          ).join('; ')
        : ''
    }));

    const dataSheet = XLSX.utils.json_to_sheet(excelData);
    const colWidths = [
      { wch: 15 },  // Patient ID
      { wch: 25 },  // Name
      { wch: 25 },  // Email
      { wch: 12 },  // Date of Birth
      { wch: 18 },  // Phone Number
      { wch: 10 },  // Status
      { wch: 12 },  // Phone Type
      { wch: 15 },  // Can Receive SMS
      { wch: 20 },  // Carrier
      { wch: 12 },  // Is Duplicate
      { wch: 40 }   // Suggested Fix
    ];
    dataSheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Validation Results');

    const fileName = `phone_validation_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Download Complete",
      description: `Results saved as ${fileName}`,
    });
  };

  const normalizePhone = (phone: string): string => {
    // Strip all non-digit characters except + at the start
    let normalized = phone.replace(/[^\d+]/g, '');
    // If it starts with +, keep it; otherwise remove it
    if (normalized.startsWith('+')) {
      return normalized;
    }
    return normalized.replace(/\+/g, '');
  };

  const detectDuplicates = (phones: string[]): DuplicateInfo[] => {
    const phoneMap = new Map<string, number[]>();
    
    phones.forEach((phone, index) => {
      const normalized = normalizePhone(phone);
      if (!phoneMap.has(normalized)) {
        phoneMap.set(normalized, []);
      }
      phoneMap.get(normalized)!.push(index);
    });

    const duplicateList: DuplicateInfo[] = [];
    phoneMap.forEach((indices, phone) => {
      if (indices.length > 1) {
        duplicateList.push({
          phone: phones[indices[0]], // Use original formatting
          count: indices.length,
          indices
        });
      }
    });

    return duplicateList;
  };

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

  const handleFileSelect = async (file: File | null) => {
    setSelectedFile(file);
    setResults(null);
    setShowDuplicateChoice(false);
    setAllPhones([]);
    setDuplicates([]);

    if (file) {
      try {
        const phones = await parsePhoneNumbers(file);
        setAllPhones(phones);
        
        const duplicateList = detectDuplicates(phones);
        setDuplicates(duplicateList);
        
        if (duplicateList.length > 0) {
          setShowDuplicateChoice(true);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        toast({
          variant: "destructive",
          title: "Parse Error",
          description: "Failed to parse the file. Please check the format.",
        });
      }
    }
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
      suggestions: data.suggestions, // Include suggestions from API
    };
  };

  const handleValidation = async (shouldRemoveDuplicates: boolean) => {
    setRemoveDuplicates(shouldRemoveDuplicates);
    setIsValidating(true);
    setResults(null);
    setProgress({ current: 0, total: 0, percentage: 0 });
    setShowDuplicateChoice(false);

    try {
      const phones = allPhones.length > 0 ? allPhones : await parsePhoneNumbers(selectedFile!);

      if (phones.length === 0) {
        throw new Error('No phone numbers found in file');
      }

      // Always detect duplicates (regardless of user choice)
      const duplicateIndices = new Set<number>();
      const seenNormalized = new Set<string>();
      const firstOccurrenceMap = new Map<string, number>(); // Maps normalized phone to first occurrence index
      
      phones.forEach((phone, index) => {
        const normalized = normalizePhone(phone);
        if (seenNormalized.has(normalized)) {
          duplicateIndices.add(index);
        } else {
          seenNormalized.add(normalized);
          firstOccurrenceMap.set(normalized, index);
        }
      });

      // Get phones to validate (unique if removing duplicates, all if keeping)
      let phonesToValidate: string[];
      if (shouldRemoveDuplicates) {
        phonesToValidate = Array.from(seenNormalized).map(norm => {
          const firstIndex = firstOccurrenceMap.get(norm)!;
          return phones[firstIndex];
        });
      } else {
        phonesToValidate = phones;
      }

      setProgress({ current: 0, total: phonesToValidate.length, percentage: 0 });

      const validationMap = new Map<string, PhoneValidationResult>();
      let validCount = 0;
      let smsCount = 0;

      // Validate phones (unique if duplicates removed, all if keeping)
      for (let i = 0; i < phonesToValidate.length; i++) {
        try {
          const result = await validateSinglePhone(phonesToValidate[i]);
          const normalized = normalizePhone(phonesToValidate[i]);
          validationMap.set(normalized, result);

          if (result.valid) validCount++;
          if (result.can_receive_sms) smsCount++;

          const current = i + 1;
          const percentage = Math.round((current / phonesToValidate.length) * 100);
          setProgress({ current, total: phonesToValidate.length, percentage });

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error validating ${phonesToValidate[i]}:`, error);
          const normalized = normalizePhone(phonesToValidate[i]);
          validationMap.set(normalized, {
            phone: phonesToValidate[i],
            valid: false,
            phone_type: 'error',
            can_receive_sms: false,
            carrier: 'Error'
          });
        }
      }

      // Build full results array - always mark duplicates
      const validationResults: PhoneValidationResult[] = phones.map((phone, index) => {
        const normalized = normalizePhone(phone);
        const result = validationMap.get(normalized);
        const isDuplicate = duplicateIndices.has(index);
        
        if (result) {
          return {
            ...result,
            phone, // Use original phone from file
            is_duplicate: isDuplicate
          };
        }
        
        return {
          phone,
          valid: false,
          phone_type: 'error',
          can_receive_sms: false,
          carrier: 'Error',
          is_duplicate: isDuplicate
        };
      });

      setResults(validationResults);
      
      // Calculate stats
      const totalDuplicates = duplicateIndices.size;
      const uniqueNumbers = phones.length - totalDuplicates;
      
      setStats({
        valid: validCount,
        invalid: validationResults.filter(r => !r.valid && !r.is_duplicate).length,
        sms: smsCount,
        duplicates: totalDuplicates,
        unique: uniqueNumbers
      });

      toast({
        title: "Validation Complete",
        description: shouldRemoveDuplicates 
          ? `Validated ${uniqueNumbers} unique numbers (skipped ${totalDuplicates} duplicates)`
          : `Validated ${validationResults.length} phone numbers (${totalDuplicates} duplicates detected).`,
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
            onFileSelect={handleFileSelect} 
            disabled={isValidating}
          />

          {showDuplicateChoice && !isValidating && !results && (
            <Card className="p-6 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20" data-testid="duplicate-summary-card">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Duplicate Numbers Detected
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Numbers</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="text-total-numbers">
                        {allPhones.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Numbers</p>
                      <p className="text-2xl font-bold text-primary" data-testid="text-unique-numbers">
                        {allPhones.length - duplicates.reduce((sum, d) => sum + (d.count - 1), 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duplicate Groups</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500" data-testid="text-duplicate-groups">
                        {duplicates.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Duplicates</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500" data-testid="text-total-duplicates">
                        {duplicates.reduce((sum, d) => sum + (d.count - 1), 0)}
                      </p>
                    </div>
                  </div>

                  <Collapsible open={showDuplicateList} onOpenChange={setShowDuplicateList}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-between mb-4"
                        data-testid="button-toggle-duplicates"
                      >
                        <span>View Duplicate Numbers</span>
                        {showDuplicateList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto bg-background/50 p-4 rounded-md" data-testid="duplicate-list">
                        {duplicates.map((dup, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                            <span className="font-mono text-foreground">{dup.phone}</span>
                            <span className="text-muted-foreground">
                              appears {dup.count} times
                            </span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800 mb-4">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Save API Credits:</strong> Removing duplicates means you'll only validate unique numbers, 
                      reducing API costs and processing time.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      size="lg" 
                      onClick={() => handleValidation(true)}
                      className="gap-2 flex-1"
                      data-testid="button-remove-duplicates"
                    >
                      <Activity className="w-5 h-5" />
                      Remove Duplicates & Validate
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => handleValidation(false)}
                      className="gap-2 flex-1"
                      data-testid="button-keep-all"
                    >
                      <Activity className="w-5 h-5" />
                      Keep All & Validate
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {selectedFile && !showDuplicateChoice && !isValidating && !results && (
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={() => handleValidation(false)}
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
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-2xl font-semibold">Validation Results</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="default"
                    onClick={downloadResultsAsExcel}
                    data-testid="button-download-excel"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                  </Button>
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
              </div>
              <ValidationResults
                results={results}
                validCount={stats.valid}
                invalidCount={stats.invalid}
                smsCount={stats.sms}
                duplicateCount={stats.duplicates}
                uniqueCount={stats.unique}
              />
            </div>
          )}
        </div>
    </div>
  );
}
