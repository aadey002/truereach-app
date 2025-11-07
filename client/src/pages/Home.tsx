import { useState } from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FileUpload from "@/components/FileUpload";
import ValidationResults, { PhoneValidationResult } from "@/components/ValidationResults";
import LoadingState from "@/components/LoadingState";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<PhoneValidationResult[] | null>(null);
  const [stats, setStats] = useState<{ valid: number; invalid: number; sms: number } | null>(null);

  // todo: remove mock functionality - replace with actual API call
  const handleValidation = () => {
    if (!selectedFile) return;

    setIsValidating(true);
    setResults(null);

    // Simulate API call
    setTimeout(() => {
      const mockResults: PhoneValidationResult[] = [
        {
          phone: '555-123-4567',
          valid: true,
          phone_type: 'mobile',
          can_receive_sms: true,
          carrier: 'Verizon'
        },
        {
          phone: '(555) 234-5678',
          valid: true,
          phone_type: 'landline',
          can_receive_sms: false,
          carrier: 'AT&T'
        },
        {
          phone: '555-345-6789',
          valid: false,
          phone_type: 'unknown',
          can_receive_sms: false,
          carrier: 'Unknown'
        },
        {
          phone: '+1-555-456-7890',
          valid: true,
          phone_type: 'mobile',
          can_receive_sms: true,
          carrier: 'T-Mobile'
        },
        {
          phone: '555.567.8901',
          valid: true,
          phone_type: 'mobile',
          can_receive_sms: true,
          carrier: 'Sprint'
        },
        {
          phone: '555-678-9012',
          valid: true,
          phone_type: 'voip',
          can_receive_sms: false,
          carrier: 'Google Voice'
        },
        {
          phone: 'invalid',
          valid: false,
          phone_type: 'error',
          can_receive_sms: false,
          carrier: 'Error'
        }
      ];

      const validCount = mockResults.filter(r => r.valid).length;
      const smsCount = mockResults.filter(r => r.can_receive_sms).length;

      setResults(mockResults);
      setStats({
        valid: validCount,
        invalid: mockResults.length - validCount,
        sms: smsCount
      });
      setIsValidating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-primary/5 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="p-8 mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Patient Phone Validator</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Validate phone numbers and identify SMS-capable contacts
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
            <LoadingState 
              message="Validating phone numbers..."
              progress="Processing your file..."
            />
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
    </div>
  );
}
