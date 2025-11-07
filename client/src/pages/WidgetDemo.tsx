import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Smartphone } from "lucide-react";

interface ValidationResult {
  valid: boolean;
  phone_type: string;
  can_receive_sms: boolean;
  carrier: string;
  formatted?: string;
  local_format?: string;
  warnings?: string[];
}

export default function WidgetDemo() {
  const [patientPhone, setPatientPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [patientResult, setPatientResult] = useState<ValidationResult | null>(null);
  const [emergencyResult, setEmergencyResult] = useState<ValidationResult | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  const validatePhone = async (phone: string, setResult: (result: ValidationResult | null) => void, setLoading: (loading: boolean) => void) => {
    if (!phone.trim()) {
      setResult(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/validate-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, country: 'US' })
      });

      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      setResult({
        valid: false,
        phone_type: 'error',
        can_receive_sms: false,
        carrier: 'Error',
        warnings: ['Validation failed']
      });
    } finally {
      setLoading(false);
    }
  };

  const ValidationDisplay = ({ result, loading }: { result: ValidationResult | null; loading: boolean }) => {
    if (loading) {
      return (
        <div className="mt-3 p-3 rounded-lg bg-muted text-muted-foreground text-sm italic">
          Validating...
        </div>
      );
    }

    if (!result) return null;

    return (
      <div className={`mt-3 p-4 rounded-lg border-2 ${result.valid ? 'bg-green-50 border-green-500 dark:bg-green-950/20' : 'bg-red-50 border-red-500 dark:bg-red-950/20'}`}>
        <div className="flex items-center gap-2">
          {result.valid ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 dark:text-green-300 font-medium">
                Valid {result.phone_type}
              </span>
              {result.can_receive_sms && (
                <Badge className="bg-blue-500 hover:bg-blue-600">
                  <Smartphone className="w-3 h-3 mr-1" />
                  SMS OK
                </Badge>
              )}
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 dark:text-red-300 font-medium">Invalid phone number</span>
            </>
          )}
        </div>
        
        {result.valid && (
          <div className="mt-2 text-sm text-muted-foreground">
            Carrier: {result.carrier}
          </div>
        )}

        {result.warnings && result.warnings.length > 0 && (
          <div className="mt-3 space-y-2">
            {result.warnings.map((warning, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-300 dark:border-orange-800 rounded text-sm">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-orange-800 dark:text-orange-300">{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-primary/5 to-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Real-Time Phone Validator Demo</h1>
              <p className="text-muted-foreground mt-2">
                This demonstrates how the phone validator works in real-time as you type.
                Perfect for integrating into patient registration forms!
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Try It Out</h2>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="patient-phone" className="text-base font-semibold">
                Patient Phone Number
              </Label>
              <Input
                id="patient-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                onBlur={() => validatePhone(patientPhone, setPatientResult, setPatientLoading)}
                className="mt-2"
                data-testid="input-patient-phone"
              />
              <ValidationDisplay result={patientResult} loading={patientLoading} />
            </div>

            <div>
              <Label htmlFor="emergency-phone" className="text-base font-semibold">
                Emergency Contact
              </Label>
              <Input
                id="emergency-phone"
                type="tel"
                placeholder="555-234-5678"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                onBlur={() => validatePhone(emergencyPhone, setEmergencyResult, setEmergencyLoading)}
                className="mt-2"
                data-testid="input-emergency-phone"
              />
              <ValidationDisplay result={emergencyResult} loading={emergencyLoading} />
            </div>
          </div>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">How to Integrate This</h2>
          <p className="text-muted-foreground mb-4">
            Add this JavaScript to any webpage to enable real-time validation:
          </p>

          <div className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`async function validatePhone(phone) {
  const response = await fetch('/api/validate-realtime', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phone, country: 'US' })
  });
  
  const result = await response.json();
  
  if (result.valid) {
    console.log('✓ Valid', result.phone_type);
    if (result.can_receive_sms) {
      console.log('SMS OK');
    }
  } else {
    console.log('✗ Invalid phone number');
  }
}`}
            </pre>
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-4">Value Proposition</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border hover-elevate">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Batch Upload</h3>
                <p className="text-muted-foreground mt-1">Clean existing database</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">$79/month</div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border hover-elevate">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Real-Time API</h3>
                <p className="text-muted-foreground mt-1">Validate as you enter data</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">$199/month</div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border hover-elevate">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Full Integration</h3>
                <p className="text-muted-foreground mt-1">Embedded in your EMR</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">$399/month</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
