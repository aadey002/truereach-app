import { CheckCircle, XCircle, Smartphone, Phone, Wifi, Copy, Lightbulb, AlertTriangle, Download } from "lucide-react";
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
  confidence?: number; // 0-100 percentage
  details?: string; // Additional context like "Digits 2-1 transposed"
}

export interface PhoneValidationResult {
  phone: string;
  valid: boolean;
  phone_type: string;
  can_receive_sms: boolean;
  carrier: string;
  is_duplicate?: boolean;
  suggestions?: PhoneSuggestion[];
  name?: string;
  firstName?: string;
  lastName?: string;
  patientId?: string;
  email?: string;
  dob?: string;
}

export interface ValidationResultsProps {
  results: PhoneValidationResult[];
  mobileCount: number;
  landlineCount: number;
  voipCount: number;
  invalidCount: number;
  duplicateCount?: number;
  uniqueCount?: number;
}

export default function ValidationResults({
  results,
  mobileCount,
  landlineCount,
  voipCount,
  invalidCount,
  duplicateCount,
  uniqueCount,
}: ValidationResultsProps) {
  const showDuplicateStats = duplicateCount !== undefined && duplicateCount > 0;
  const { toast } = useToast();
  
  const resultsWithSuggestions = results.filter(r => r.suggestions && r.suggestions.length > 0);
  const hasSuggestions = resultsWithSuggestions.length > 0;

  // Helper: Convert confidence score to tier label
  const getConfidenceTier = (confidence?: number): string => {
    if (!confidence) return 'MEDIUM';
    if (confidence >= 80) return 'HIGH';
    if (confidence >= 50) return 'MEDIUM';
    return 'LOW';
  };

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
          
          row['Issue Detected'] = topSuggestion.message;
          
          // Add up to 3 suggestions with confidence tiers
          if (topSuggestion.suggestedNumbers && topSuggestion.suggestedNumbers.length > 0) {
            row['Suggestion 1'] = topSuggestion.suggestedNumbers[0];
            row['Confidence Tier 1'] = getConfidenceTier(topSuggestion.confidence);
            
            if (topSuggestion.suggestedNumbers.length > 1) {
              row['Suggestion 2'] = topSuggestion.suggestedNumbers[1];
              row['Confidence Tier 2'] = getConfidenceTier(topSuggestion.confidence);
            } else {
              row['Suggestion 2'] = '';
              row['Confidence Tier 2'] = '';
            }
            
            if (topSuggestion.suggestedNumbers.length > 2) {
              row['Suggestion 3'] = topSuggestion.suggestedNumbers[2];
              row['Confidence Tier 3'] = getConfidenceTier(topSuggestion.confidence);
            } else {
              row['Suggestion 3'] = '';
              row['Confidence Tier 3'] = '';
            }
          } else {
            row['Suggestion 1'] = 'N/A - See Action Required';
            row['Confidence Tier 1'] = '';
            row['Suggestion 2'] = '';
            row['Confidence Tier 2'] = '';
            row['Suggestion 3'] = '';
            row['Confidence Tier 3'] = '';
          }
          
          row['Action Required'] = topSuggestion.action || 'Verify with patient';
          row['Severity'] = topSuggestion.severity.toUpperCase();
          row['Verification Required'] = 'YES';
          
          // Add details if available (e.g., "Digits 2-1 transposed")
          if (topSuggestion.details) {
            row['Notes'] = topSuggestion.details;
          } else {
            row['Notes'] = '';
          }
        } else {
          row['Issue Detected'] = result.valid ? 'None' : 'Invalid number - no automated suggestions available';
          row['Suggestion 1'] = result.valid ? result.phone : 'Unable to determine';
          row['Confidence Tier 1'] = result.valid ? 'HIGH' : '';
          row['Suggestion 2'] = '';
          row['Confidence Tier 2'] = '';
          row['Suggestion 3'] = '';
          row['Confidence Tier 3'] = '';
          row['Action Required'] = 'Verify complete number with patient';
          row['Severity'] = 'HIGH';
          row['Verification Required'] = 'YES';
          row['Notes'] = '';
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
    <div className="space-y-4 md:space-y-8" data-testid="validation-results">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="p-2 md:p-6 border-l-2 md:border-l-4 border-l-green-500">
          <div className="flex flex-col items-center text-center gap-1 md:gap-3">
            <Smartphone className="w-6 h-6 md:w-10 md:h-10 text-green-500" />
            <div>
              <h3 className="text-xl md:text-3xl font-bold" data-testid="text-mobile-count">{mobileCount}</h3>
              <p className="text-[10px] md:text-xs font-semibold text-green-600 mt-0.5">Active Mobile</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground">Voice & Text</p>
            </div>
          </div>
        </Card>

        <Card className="p-2 md:p-6 border-l-2 md:border-l-4 border-l-orange-500">
          <div className="flex flex-col items-center text-center gap-1 md:gap-3">
            <Phone className="w-6 h-6 md:w-10 md:h-10 text-orange-500" />
            <div>
              <h3 className="text-xl md:text-3xl font-bold" data-testid="text-landline-count">{landlineCount}</h3>
              <p className="text-[10px] md:text-xs font-semibold text-orange-600 mt-0.5">Landline</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground">Voice Only</p>
            </div>
          </div>
        </Card>

        <Card className="p-2 md:p-6 border-l-2 md:border-l-4 border-l-violet-500">
          <div className="flex flex-col items-center text-center gap-1 md:gap-3">
            <Wifi className="w-6 h-6 md:w-10 md:h-10 text-violet-500" />
            <div>
              <h3 className="text-xl md:text-3xl font-bold" data-testid="text-voip-count">{voipCount}</h3>
              <p className="text-[10px] md:text-xs font-semibold text-violet-600 mt-0.5">VoIP</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground">May Be Textable</p>
            </div>
          </div>
        </Card>

        <Card className="p-2 md:p-6 border-l-2 md:border-l-4 border-l-red-500">
          <div className="flex flex-col items-center text-center gap-1 md:gap-3">
            <XCircle className="w-6 h-6 md:w-10 md:h-10 text-red-500" />
            <div>
              <h3 className="text-xl md:text-3xl font-bold" data-testid="text-invalid-count">{invalidCount}</h3>
              <p className="text-[10px] md:text-xs font-semibold text-red-600 mt-0.5">Invalid</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground">Does Not Exist</p>
            </div>
          </div>
        </Card>
      </div>

      {showDuplicateStats && (
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <Card className="p-2 md:p-6 border-l-2 md:border-l-4 border-l-purple-500">
            <div className="flex flex-col items-center text-center gap-1 md:gap-3">
              <CheckCircle className="w-6 h-6 md:w-10 md:h-10 text-purple-500" />
              <div>
                <h3 className="text-xl md:text-3xl font-bold" data-testid="text-unique-count">{uniqueCount}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Unique</p>
              </div>
            </div>
          </Card>

          <Card className="p-2 md:p-6 border-l-2 md:border-l-4 border-l-yellow-500">
            <div className="flex flex-col items-center text-center gap-1 md:gap-3">
              <Copy className="w-6 h-6 md:w-10 md:h-10 text-yellow-600" />
              <div>
                <h3 className="text-xl md:text-3xl font-bold" data-testid="text-duplicate-count">{duplicateCount}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Dupes</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {hasSuggestions && (
        <Card className="p-3 md:p-6 bg-yellow-50/50 dark:bg-yellow-950/20 border-l-2 md:border-l-4 border-l-yellow-500">
          <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
            <div className="flex items-start gap-2 md:gap-3 flex-1">
              <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-1">Issue Analysis Available</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-2">
                  Found {resultsWithSuggestions.length} phone number{resultsWithSuggestions.length === 1 ? '' : 's'} with detected issues.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 px-2 md:px-3 py-1 md:py-1.5 rounded-md inline-flex">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span className="hidden sm:inline">Suggestions are for guidance only - always verify with patient</span>
                    <span className="sm:hidden">Verify with patient</span>
                  </div>
                </div>
              </div>
            </div>
            <Button 
              onClick={exportCorrectedNumbers}
              className="gap-2 whitespace-nowrap w-full md:w-auto text-xs md:text-sm"
              size="sm"
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
                {results.some(r => r.patientId || r.name) && (
                  <TableHead className="text-primary-foreground font-semibold">Patient</TableHead>
                )}
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
                  {results.some(r => r.patientId || r.name) && (
                    <TableCell>
                      <div className="flex flex-col">
                        {result.name && <span className="font-medium">{result.name}</span>}
                        {result.patientId && <span className="text-xs text-muted-foreground">ID: {result.patientId}</span>}
                        {!result.name && !result.patientId && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                  )}
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
                  <TableCell>
                    {result.phone_type === 'mobile' ? (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0">Mobile</Badge>
                    ) : result.phone_type === 'fixed_line' ? (
                      <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-0">Landline</Badge>
                    ) : result.phone_type === 'voip' ? (
                      <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-0">VoIP</Badge>
                    ) : (
                      <Badge variant="secondary" className="capitalize">{result.phone_type}</Badge>
                    )}
                  </TableCell>
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
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium">{suggestion.message}</p>
                                      {suggestion.confidence !== undefined && (
                                        <Badge 
                                          variant="secondary"
                                          className={`text-xs ${
                                            getConfidenceTier(suggestion.confidence) === 'HIGH' 
                                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                              : getConfidenceTier(suggestion.confidence) === 'MEDIUM'
                                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                          }`}
                                          title="Confidence tier based on pattern strength - not an accuracy guarantee"
                                        >
                                          {getConfidenceTier(suggestion.confidence)} Confidence
                                        </Badge>
                                      )}
                                    </div>
                                    {suggestion.details && (
                                      <p className="text-xs text-muted-foreground italic mb-1">{suggestion.details}</p>
                                    )}
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
