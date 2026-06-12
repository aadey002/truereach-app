import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Smartphone, Phone, Loader2 } from "lucide-react";

interface ValidationResult {
  status: 'valid' | 'invalid' | 'error';
  valid: boolean;
  phone_type: string;
  can_receive_sms: boolean;
  carrier: string;
  formatted?: string;
  local_format?: string;
  warnings?: string[];
  error?: string;
}

export default function WidgetDemo() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const validatePhone = async () => {
    if (!phoneNumber.trim()) {
      setResult(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/validate-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, country: 'US' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Validation service unavailable');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      data.status = !data.valid ? 'invalid' : data.can_receive_sms ? 'valid' : 'landline';
      setResult(data);
    } catch (error) {
      console.error('Validation error:', error);
      setResult({
        status: 'error',
        valid: false,
        phone_type: 'error',
        can_receive_sms: false,
        carrier: 'Unknown',
        error: error instanceof Error ? error.message : 'Validation service unavailable'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validatePhone();
    }
  };

  const resetDemo = () => {
    setPhoneNumber("");
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Phone className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Try Phone Validation</CardTitle>
          <CardDescription className="text-lg">
            Enter any phone number to see instant validation results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-3">
            <Input
              type="tel"
              placeholder="Enter phone number..."
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-lg h-12"
              data-testid="input-phone-demo"
            />
            <Button 
              onClick={validatePhone} 
              disabled={loading || !phoneNumber.trim()}
              className="h-12 px-6"
              data-testid="button-validate"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Validate"
              )}
            </Button>
          </div>

          {result && (
            <div className={`p-6 rounded-lg border-2 transition-all ${
              result.status === 'error'
                ? 'bg-orange-50 border-orange-400 dark:bg-orange-950/20 dark:border-orange-600'
                : result.status === 'landline'
                  ? 'bg-blue-50 border-blue-400 dark:bg-blue-950/20 dark:border-blue-600'
                  : result.valid
                    ? 'bg-green-50 border-green-400 dark:bg-green-950/20 dark:border-green-600'
                    : 'bg-red-50 border-red-400 dark:bg-red-950/20 dark:border-red-600'
            }`}>
              {result.status === 'error' ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <AlertTriangle className="w-12 h-12 text-orange-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                      Service Error
                    </h3>
                    <p className="text-orange-700 dark:text-orange-400 mt-1">
                      {result.error}
                    </p>
                  </div>
                </div>
              ) : result.status === 'landline' ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <Phone className="w-12 h-12 text-blue-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                      Valid — Non-Mobile · Verify SMS
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-sm">
                        {result.phone_type === 'fixed_line' ? 'Landline' :
                         result.phone_type === 'voip' ? 'VoIP' :
                         result.phone_type}
                      </Badge>
                      <Badge className="bg-blue-500 hover:bg-blue-600 text-sm">
                        ☎ No SMS
                      </Badge>
                    </div>
                    {result.carrier && result.carrier !== 'Unknown' && (
                      <p className="text-muted-foreground mt-2">
                        Carrier: {result.carrier}
                      </p>
                    )}
                    {result.formatted && (
                      <p className="text-muted-foreground text-sm mt-1">
                        Formatted: {result.formatted}
                      </p>
                    )}
                  </div>
                </div>
              ) : result.valid ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                      Valid & Textable
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-sm">
                        {result.phone_type === 'mobile' ? 'Mobile' : 
                         result.phone_type === 'fixed_line' ? 'Landline' : 
                         result.phone_type === 'voip' ? 'VoIP' : 
                         result.phone_type}
                      </Badge>
                      {result.can_receive_sms && (
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-sm">
                          <Smartphone className="w-3 h-3 mr-1" />
                          SMS Capable
                        </Badge>
                      )}
                    </div>
                    {result.carrier && result.carrier !== 'Unknown' && (
                      <p className="text-muted-foreground mt-2">
                        Carrier: {result.carrier}
                      </p>
                    )}
                    {result.formatted && (
                      <p className="text-muted-foreground text-sm mt-1">
                        Formatted: {result.formatted}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-3">
                  <XCircle className="w-12 h-12 text-red-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
                      Invalid Phone Number
                    </h3>
                    {result.warnings && result.warnings.length > 0 && (
                      <p className="text-red-700 dark:text-red-400 mt-1 text-sm">
                        {result.warnings[0]}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={resetDemo} data-testid="button-try-another">
                Try Another Number
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">What This Demo Shows</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Instant validation of US phone numbers</span>
            </li>
            <li className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>SMS capability detection for patient outreach</span>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span>Phone type identification (mobile, landline, VoIP)</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <span>Smart detection of test and placeholder numbers</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
