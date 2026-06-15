import { useState, useEffect } from "react";
import { Activity, AlertCircle, Info, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";
import ValidationResults, { PhoneValidationResult } from "@/components/ValidationResults";
import Papa from "papaparse";
import ExcelJS from "exceljs";
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
  const [stats, setStats] = useState<{ mobile: number; landline: number; voip: number; invalid: number; duplicates?: number; unique?: number } | null>(null);
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

  const downloadResultsAsExcel = async () => {
    if (!results || !stats) return;

    const workbook = new ExcelJS.Workbook();

    // Calculate additional stats for summary
    const mobileCount = results.filter(r => r.valid && r.phone_type === 'mobile').length;
    const landlineCount = results.filter(r => r.valid && r.phone_type === 'fixed_line').length;
    const voipCount = results.filter(r => r.valid && r.phone_type === 'voip').length;
    const duplicateCount = results.filter(r => r.is_duplicate).length;
    const hasPatientData = results.some(r => r.name || r.patientId);
    const validationDate = new Date().toLocaleString();

    // Create Summary Sheet
    const validTotal = stats.mobile + stats.landline + stats.voip;
    const totalNumbers = validTotal + stats.invalid;
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [{ width: 30 }, { width: 20 }];
    const summaryRows = [
      ['TRUEREACH VALIDATION REPORT'],
      [''],
      ['Report Generated:', validationDate],
      [''],
      ['VALIDATION SUMMARY'],
      [''],
      ['Total Phone Numbers:', totalNumbers],
      ['Valid Numbers:', validTotal],
      ['Invalid Numbers:', stats.invalid],
      ['Validation Rate:', totalNumbers > 0 ? Math.round((validTotal / totalNumbers) * 100) + '%' : '0%'],
      [''],
      ['LINE TYPE BREAKDOWN'],
      [''],
      ['Active Mobile (Voice & Text):', stats.mobile],
      ['Landline (Voice Only):', stats.landline],
      ['VoIP (May Be Textable):', stats.voip],
      ['Invalid (Does Not Exist):', stats.invalid],
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
    summaryRows.forEach(row => summarySheet.addRow(row));

    // Create Data Sheet
    const dataSheet = workbook.addWorksheet('Validation Results');
    dataSheet.columns = [
      { header: 'Patient ID', key: 'patientId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Date of Birth', key: 'dob', width: 12 },
      { header: 'Phone Number', key: 'phone', width: 18 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Phone Type', key: 'phoneType', width: 12 },
      { header: 'Can Receive SMS', key: 'sms', width: 15 },
      { header: 'Carrier', key: 'carrier', width: 20 },
      { header: 'Is Duplicate', key: 'duplicate', width: 12 },
      { header: 'Suggested Fix (VERIFY FIRST)', key: 'suggestion', width: 40 }
    ];
    results.forEach(r => {
      dataSheet.addRow({
        patientId: r.patientId || '',
        name: r.name || '',
        email: r.email || '',
        dob: r.dob || '',
        phone: r.phone,
        status: r.valid ? 'Valid' : 'Invalid',
        phoneType: r.phone_type === 'mobile' ? 'Active Mobile' : r.phone_type === 'fixed_line' ? 'Landline' : r.phone_type === 'voip' ? 'VoIP' : r.phone_type || 'Unknown',
        sms: r.can_receive_sms ? 'Yes' : 'No',
        carrier: r.carrier || 'Unknown',
        duplicate: r.is_duplicate ? 'Yes' : 'No',
        suggestion: r.suggestions && r.suggestions.length > 0
          ? r.suggestions.slice(0, 3).map(s =>
              s.suggestedNumbers && s.suggestedNumbers.length > 0
                ? s.suggestedNumbers[0] + ' (' + (s.confidence || 0) + '%)'
                : s.message
            ).join('; ')
          : ''
      });
    });

    const fileName = 'TrueReach_Validation_' + new Date().toISOString().split('T')[0] + '.xlsx';
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

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
            const wb = new ExcelJS.Workbook();
            await wb.xlsx.load(data);
            const worksheet = wb.worksheets[0];
            const headers: string[] = [];
            worksheet.getRow(1).eachCell((cell, colNum) => {
              headers[colNum - 1] = String(cell.value || '');
            });
            const jsonData: Record<string, any>[] = [];
            worksheet.eachRow((row, rowNum) => {
              if (rowNum === 1) return;
              const obj: Record<string, any> = {};
              row.eachCell((cell, colNum) => {
                obj[headers[colNum - 1]] = cell.value;
              });
              jsonData.push(obj);
            });

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

      // Validate phones (unique if duplicates removed, all if keeping)
      for (let i = 0; i < phonesToValidate.length; i++) {
        try {
          const result = await validateSinglePhone(phonesToValidate[i]);
          const normalized = normalizePhone(phonesToValidate[i]);
          validationMap.set(normalized, result);

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
      
      const mobileCount = validationResults.filter(r => r.valid && r.phone_type === 'mobile' && !r.is_duplicate).length;
      const landlineCount = validationResults.filter(r => r.valid && r.phone_type === 'fixed_line' && !r.is_duplicate).length;
      const voipCount = validationResults.filter(r => r.valid && r.phone_type === 'voip' && !r.is_duplicate).length;

      setStats({
        mobile: mobileCount,
        landline: landlineCount,
        voip: voipCount,
        invalid: validationResults.filter(r => !r.valid && !r.is_duplicate).length,
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
    <div className="max-w-7xl mx-auto px-2 sm:px-4">
      <Card className="p-4 md:p-8 mb-4 md:mb-8 text-center">
          <div className="flex flex-col items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">Batch Phone Validation</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Upload CSV or Excel files to validate phone numbers and identify SMS-capable contacts
          </p>
        </Card>

        <div className="space-y-4 md:space-y-8">
          <FileUpload 
            onFileSelect={handleFileSelect} 
            disabled={isValidating}
          />

          {showDuplicateChoice && !isValidating && !results && (
            <Card className="p-4 md:p-6 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20" data-testid="duplicate-summary-card">
              <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                    Duplicate Numbers Detected
                  </h3>
                  <div className="grid grid-cols-2 gap-2 md:gap-4 mb-3 md:mb-4">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Total Numbers</p>
                      <p className="text-xl md:text-2xl font-bold text-foreground" data-testid="text-total-numbers">
                        {allPhones.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Unique Numbers</p>
                      <p className="text-xl md:text-2xl font-bold text-primary" data-testid="text-unique-numbers">
                        {allPhones.length - duplicates.reduce((sum, d) => sum + (d.count - 1), 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Duplicate Groups</p>
                      <p className="text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-500" data-testid="text-duplicate-groups">
                        {duplicates.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Total Duplicates</p>
                      <p className="text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-500" data-testid="text-total-duplicates">
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

                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <Button 
                      size="default" 
                      onClick={() => handleValidation(true)}
                      className="gap-2 flex-1 text-xs md:text-sm"
                      data-testid="button-remove-duplicates"
                    >
                      <Activity className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="hidden sm:inline">Remove Duplicates & Validate</span>
                      <span className="sm:hidden">Remove & Validate</span>
                    </Button>
                    <Button 
                      size="default" 
                      variant="outline"
                      onClick={() => handleValidation(false)}
                      className="gap-2 flex-1 text-xs md:text-sm"
                      data-testid="button-keep-all"
                    >
                      <Activity className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="hidden sm:inline">Keep All & Validate</span>
                      <span className="sm:hidden">Keep & Validate</span>
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
            <div className="space-y-3 md:space-y-4" data-testid="progress-container">
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-[10px] h-[24px] md:h-[30px] overflow-hidden">
                <div
                  className="h-full transition-all duration-300 ease-out flex items-center justify-center"
                  style={{
                    width: `${progress.percentage}%`,
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  }}
                  data-testid="progress-bar-fill"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 drop-shadow-sm" data-testid="progress-text">
                    {progress.total > 0 
                      ? `${progress.current}/${progress.total} (${progress.percentage}%)`
                      : 'Preparing...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {results && stats && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-2">
                <h2 className="text-xl md:text-2xl font-semibold">Validation Results</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="default"
                    onClick={downloadResultsAsExcel}
                    data-testid="button-download-excel"
                    className="flex-1 sm:flex-none text-xs md:text-sm"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Download Excel</span>
                    <span className="sm:hidden">Excel</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setResults(null);
                      setStats(null);
                      setSelectedFile(null);
                    }}
                    data-testid="button-new-validation"
                    className="flex-1 sm:flex-none text-xs md:text-sm"
                    size="sm"
                  >
                    New Validation
                  </Button>
                </div>
              </div>
              <ValidationResults
                results={results}
                mobileCount={stats.mobile}
                landlineCount={stats.landline}
                voipCount={stats.voip}
                invalidCount={stats.invalid}
                duplicateCount={stats.duplicates}
                uniqueCount={stats.unique}
              />
            </div>
          )}
        </div>
    </div>
  );
}
