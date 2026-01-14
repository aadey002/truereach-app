import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, FileJson, Settings, Zap, Lock, CheckCircle, LogIn } from "lucide-react";

export default function DeveloperDocs() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setShowContent(true);
      } else {
        setShowContent(false);
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !showContent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Developer Access Required</CardTitle>
            <CardDescription className="mt-2">
              API documentation and integration guides are available to registered developers.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a href="/api/login">
              <Button data-testid="button-login-docs">
                <LogIn className="w-4 h-4 mr-2" />
                Log In to Access Docs
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Code className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Developer Documentation</h1>
        </div>
        <p className="text-muted-foreground">
          Welcome, {user?.firstName || user?.email || 'Developer'}! Technical documentation for integrating TrueReach.
        </p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api" data-testid="tab-api">
            <FileJson className="w-4 h-4 mr-2" />
            API Reference
          </TabsTrigger>
          <TabsTrigger value="integration" data-testid="tab-integration">
            <Zap className="w-4 h-4 mr-2" />
            Integration Guide
          </TabsTrigger>
          <TabsTrigger value="specs" data-testid="tab-specs">
            <Settings className="w-4 h-4 mr-2" />
            Technical Specs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Real-Time Validation Endpoint
                <Badge variant="secondary">POST</Badge>
              </CardTitle>
              <CardDescription>/api/validate-realtime</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "phone": "4105551234",
  "country": "US"  // optional, defaults to "US"
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Response (Valid Number)</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "valid": true,
  "phone_type": "mobile",
  "can_receive_sms": true,
  "carrier": "Verizon Wireless",
  "formatted": "+14105551234",
  "local_format": "(410) 555-1234",
  "warnings": []
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Response (Invalid Number)</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "valid": false,
  "phone_type": "unknown",
  "can_receive_sms": false,
  "carrier": "Unknown",
  "warnings": ["Invalid NANP format - Reserved exchange code: 555..."],
  "suggestions": [
    {
      "type": "format_issue",
      "severity": "high",
      "message": "Reserved exchange code: 555 is reserved...",
      "action": "Verify with patient...",
      "confidence": 95
    }
  ]
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Batch Validation Endpoint
                <Badge variant="secondary">POST</Badge>
              </CardTitle>
              <CardDescription>/api/validate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Request</h4>
                <p className="text-muted-foreground mb-2">
                  Multipart form data with a CSV or Excel file containing phone numbers.
                </p>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`Content-Type: multipart/form-data
Form field: file (CSV or XLSX file)`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Response</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "valid_count": 45,
  "invalid_count": 5,
  "sms_count": 38,
  "details": [
    {
      "phone": "4105551234",
      "valid": true,
      "phone_type": "mobile",
      "can_receive_sms": true,
      "carrier": "Verizon Wireless"
    },
    // ... more results
  ]
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>JavaScript Widget Integration</CardTitle>
              <CardDescription>Drop-in validation for any web application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Step 1: Include the Widget</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`<script src="https://your-domain.com/phone-validator-widget.js"></script>`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Step 2: Initialize</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`PhoneValidatorWidget.init({
  apiUrl: 'https://your-domain.com',
  mode: 'blur'  // 'blur' or 'typing'
});`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Step 3: Attach to Inputs</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// Attach to all phone inputs
PhoneValidatorWidget.attach('input[type="tel"]');

// Or attach to specific input
PhoneValidatorWidget.attach('#patient-phone');`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Direct API Integration</CardTitle>
              <CardDescription>For custom implementations</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`async function validatePhone(phone) {
  const response = await fetch('/api/validate-realtime', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, country: 'US' })
  });
  
  const result = await response.json();
  
  if (result.valid) {
    console.log('Valid', result.phone_type);
    if (result.can_receive_sms) {
      console.log('SMS capable');
    }
  } else {
    console.log('Invalid:', result.warnings);
    if (result.suggestions) {
      console.log('Suggestions:', result.suggestions);
    }
  }
  
  return result;
}`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>EHR/Pharmacy System Integration</CardTitle>
              <CardDescription>Works with PioneerRx, Rx30, PrimeRx, and more</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>No backend modifications required</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>CORS-enabled API for cross-origin requests</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Inline validation UI with customizable CSS</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Rate limiting and debouncing built-in</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>NANP Validation Rules</CardTitle>
              <CardDescription>North American Numbering Plan enforcement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Area Code Validation</h4>
                    <p className="text-sm text-muted-foreground">
                      Validates against all assigned US/Canada area codes. Rejects invalid codes like 123, 999.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Exchange Code Rules</h4>
                    <p className="text-sm text-muted-foreground">
                      Cannot start with 0 or 1. Reserved codes (555, 911, 000) are rejected.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">N11 Service Codes</h4>
                    <p className="text-sm text-muted-foreground">
                      Detects N11 codes (211, 311, 411, 511, 611, 711, 811, 911) as invalid phone numbers.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Line Number Rules</h4>
                    <p className="text-sm text-muted-foreground">
                      Last 4 digits cannot be 0000.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Confidence Tiers</CardTitle>
              <CardDescription>Suggestion confidence scoring system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Badge className="bg-green-500">HIGH</Badge>
                  <div>
                    <p className="font-medium">90-100% confidence</p>
                    <p className="text-sm text-muted-foreground">NANP violations, definitive format issues</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Badge className="bg-yellow-500">MEDIUM</Badge>
                  <div>
                    <p className="font-medium">75-89% confidence</p>
                    <p className="text-sm text-muted-foreground">Placeholder patterns, transposed digits</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Badge className="bg-gray-500">LOW</Badge>
                  <div>
                    <p className="font-medium">Below 75% confidence</p>
                    <p className="text-sm text-muted-foreground">Speculative suggestions, less certain patterns</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
              <CardDescription>API usage guidelines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span>Real-time validation</span>
                  <Badge variant="outline">No limit (per-request)</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span>Batch validation</span>
                  <Badge variant="outline">300ms delay between numbers</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span>Widget debounce</span>
                  <Badge variant="outline">500ms typing debounce</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
