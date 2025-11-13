import { CheckCircle, XCircle, Smartphone, Copy, Lightbulb, AlertTriangle, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export interface PhoneSuggestion {
  type: 'missing_digits' | 'transposed' | 'invalid_area_code' | 'format_issue' | 'placeholder' | 'sequential';
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestedNumbers?: string[];
  action?: string;
}

export interface PhoneValidationResult {
  phone: string;
  valid: boolean;
  phone_type: string;
  can_receive_sms: boolean;
  carrier: string;
  is_duplicate?: boolean;
  suggestions?: PhoneSuggestion[];
}

export interface ValidationResultsProps {
  results: PhoneValidationResult[];
  validCount: number;
  invalidCount: number;
  smsCount: number;
  duplicateCount?: number;
  uniqueCount?: number;
}

export default function ValidationResults({
  results,
  validCount,
  invalidCount,
  smsCount,
  duplicateCount,
  uniqueCount,
}: ValidationResultsProps) {
  const showDuplicateStats = duplicateCount !== undefined && duplicateCount > 0;
  const { toast } = useToast();
  
  const resultsWithSuggestions = results.filter(r => r.suggestions && r.suggestions.length > 0);
  const hasSuggestions = resultsWithSuggestions.length > 0;

  const exportCorrectedNumbers = () => {
    try {
      const correctedData: any[] = [];
      
      results.forEach((result) => {
        const row: any = {
          'Original Phone': result.phone,
          'Status': result.valid ? 'Valid' : 'Invalid',
          'Type': result.phone_type,
          'SMS Capable': result.can_receive_sms ? 'Yes' : 'No',
          'Carrier': result.carrier,
        };

        if (result.suggestions && result.suggestions.length > 0) {
          const topSuggestion = result.suggestions[0];
          
          // Only include as "Possible Fix" if there are suggested numbers
          // Otherwise, it's just guidance (e.g., verify with patient)
          if (topSuggestion.suggestedNumbers && topSuggestion.suggestedNumbers.length > 0) {
            row['Possible Fix (VERIFY FIRST)'] = topSuggestion.suggestedNumbers[0];
            
            // Add alternatives if available
            if (topSuggestion.suggestedNumbers.length > 1) {
              row['Alternative Option 1'] = topSuggestion.suggestedNumbers[1] || '';
            }
            if (topSuggestion.suggestedNumbers.length > 2) {
              row['Alternative Option 2'] = topSuggestion.suggestedNumbers[2] || '';
            }
          } else {
            row['Possible Fix (VERIFY FIRST)'] = 'N/A - See Action Required';
          }
          
          row['Issue Detected'] = topSuggestion.message;
          row['Action Required'] = topSuggestion.action || 'Verify with patient';
          row['Severity'] = topSuggestion.severity.toUpperCase();
        } else {
          row['Possible Fix (VERIFY FIRST)'] = result.valid ? result.phone : 'Unable to determine';
          row['Issue Detected'] = result.valid ? 'None' : 'Invalid number - no automated suggestions available';
          row['Action Required'] = 'Verify complete number with patient';
          row['Severity'] = 'HIGH';
        }

        correctedData.push(row);
      });

      // Convert to CSV
      const headers = Object.keys(correctedData[0]);
      const csvContent = [
        headers.join(','),
        ...correctedData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes
            if (value.toString().includes(',') || value.toString().includes('"')) {
              return `"${value.toString().replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `phone-corrections-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${correctedData.length} numbers with correction suggestions for manual review.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export corrections. Please try again.",
      });
    }
  };
  
  return (
    <div className="space-y-8" data-testid="validation-results">
      <div className={`grid grid-cols-1 ${showDuplicateStats ? 'md:grid-cols-5' : 'md:grid-cols-3'} gap-6`}>
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex flex-col items-center text-center gap-3">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <div>
              <h3 className="text-4xl font-bold" data-testid="text-valid-count">{validCount}</h3>
              <p className="text-muted-foreground mt-1">Valid Numbers</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex flex-col items-center text-center gap-3">
            <XCircle className="w-12 h-12 text-red-500" />
            <div>
              <h3 className="text-4xl font-bold" data-testid="text-invalid-count">{invalidCount}</h3>
              <p className="text-muted-foreground mt-1">Invalid Numbers</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex flex-col items-center text-center gap-3">
            <Smartphone className="w-12 h-12 text-blue-500" />
            <div>
              <h3 className="text-4xl font-bold" data-testid="text-sms-count">{smsCount}</h3>
              <p className="text-muted-foreground mt-1">Can Receive SMS</p>
            </div>
          </div>
        </Card>

        {showDuplicateStats && (
          <>
            <Card className="p-6 border-l-4 border-l-purple-500">
              <div className="flex flex-col items-center text-center gap-3">
                <CheckCircle className="w-12 h-12 text-purple-500" />
                <div>
                  <h3 className="text-4xl font-bold" data-testid="text-unique-count">{uniqueCount}</h3>
                  <p className="text-muted-foreground mt-1">Unique Numbers</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-yellow-500">
              <div className="flex flex-col items-center text-center gap-3">
                <Copy className="w-12 h-12 text-yellow-600" />
                <div>
                  <h3 className="text-4xl font-bold" data-testid="text-duplicate-count">{duplicateCount}</h3>
                  <p className="text-muted-foreground mt-1">Duplicates Skipped</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {hasSuggestions && (
        <Card className="p-6 bg-yellow-50/50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Lightbulb className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Issue Analysis Available</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Found {resultsWithSuggestions.length} phone number{resultsWithSuggestions.length === 1 ? '' : 's'} with detected issues. 
                  Export a CSV file with issue analysis and guidance for manual verification.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 rounded-md inline-flex">
                    <AlertTriangle className="w-3 h-3" />
                    Suggestions are for guidance only - always verify with patient
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Do not use suggested numbers without patient verification. Automated suggestions may be incorrect.
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={exportCorrectedNumbers}
              className="gap-2 whitespace-nowrap"
              data-testid="button-export-corrections"
            >
              <Download className="w-4 h-4" />
              Export Analysis
            </Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="text-primary-foreground font-semibold">Phone Number</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Status</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Type</TableHead>
                <TableHead className="text-primary-foreground font-semibold">SMS</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Carrier</TableHead>
                {showDuplicateStats && (
                  <TableHead className="text-primary-foreground font-semibold">Duplicate</TableHead>
                )}
                <TableHead className="text-primary-foreground font-semibold">Suggestions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow 
                  key={index} 
                  data-testid={`row-result-${index}`}
                  className={result.is_duplicate ? 'bg-yellow-50/50 dark:bg-yellow-950/20' : ''}
                >
                  <TableCell className="font-medium">{result.phone}</TableCell>
                  <TableCell>
                    {result.is_duplicate ? (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        Duplicate
                      </Badge>
                    ) : result.valid ? (
                      <span className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Valid
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-4 h-4" />
                        Invalid
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{result.phone_type}</TableCell>
                  <TableCell>
                    {result.can_receive_sms ? (
                      <span className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-4 h-4" />
                        No
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{result.carrier}</TableCell>
                  {showDuplicateStats && (
                    <TableCell>
                      {result.is_duplicate ? (
                        <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {result.suggestions && result.suggestions.length > 0 ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            data-testid={`button-suggestions-${index}`}
                          >
                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                            {result.suggestions.length} {result.suggestions.length === 1 ? 'Suggestion' : 'Suggestions'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96" data-testid={`popover-suggestions-${index}`}>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="w-5 h-5 text-yellow-600" />
                              <h4 className="font-semibold">Issue Analysis & Guidance</h4>
                            </div>
                            {result.suggestions.map((suggestion, sIndex) => (
                              <div key={sIndex} className="space-y-2 border-l-2 border-l-yellow-500 pl-3">
                                <div className="flex items-start gap-2">
                                  {suggestion.severity === 'high' ? (
                                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                                  ) : (
                                    <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{suggestion.message}</p>
                                    {suggestion.action && (
                                      <p className="text-xs text-muted-foreground mt-1">{suggestion.action}</p>
                                    )}
                                    {suggestion.suggestedNumbers && suggestion.suggestedNumbers.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                          Possible options (verify with patient):
                                        </p>
                                        {suggestion.suggestedNumbers.map((num, nIndex) => (
                                          <div key={nIndex} className="flex items-center gap-2">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                              {num}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="pt-2 border-t bg-red-50/50 dark:bg-red-950/20 -mx-4 px-4 py-3">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                                  DO NOT use suggested numbers without patient verification. Always confirm the correct number directly with the patient.
                                </p>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : result.valid ? (
                      <span className="text-muted-foreground text-sm">-</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">No suggestions</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
