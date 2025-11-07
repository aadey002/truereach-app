import { useState } from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";
import ValidationResults, { PhoneValidationResult } from "@/components/ValidationResults";
import LoadingState from "@/components/LoadingState";

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
  const { toast } = useToast();

  const handleValidation = async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/validate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Validation failed');
      }

      const data: ValidationResponse = await response.json();

      setResults(data.details);
      setStats({
        valid: data.valid_count,
        invalid: data.invalid_count,
        sms: data.sms_count
      });

      toast({
        title: "Validation Complete",
        description: `Validated ${data.details.length} phone numbers successfully.`,
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
  );
}
