import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code, FileJson, Settings, Zap, Lock, CheckCircle, LogIn, Key, Code2, Smartphone, AlertCircle, FileText } from "lucide-react";

export default function DeveloperDocs() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [showContent, setShowContent] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setShowContent(true);
      } else {
        setShowContent(false);
        setPasswordVerified(false);
      }
    }
  }, [isAuthenticated, isLoading]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    
    try {
      const response = await fetch("/api/verify-dev-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setPasswordVerified(true);
        toast({
          title: "Access Granted",
          description: "Welcome to the Developer Documentation.",
        });
      } else {
        toast({
          title: "Invalid Password",
          description: "Please check your developer access code and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Unable to verify password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

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

  if (!passwordVerified) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Key className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle>Developer Access Code</CardTitle>
            <CardDescription className="mt-2">
              Welcome, {user?.firstName || 'Developer'}! Please enter your developer access code to view the documentation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dev-password">Access Code</Label>
                <Input
                  id="dev-password"
                  type="password"
                  placeholder="Enter developer access code"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-dev-password"
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={verifying || !password}
                data-testid="button-verify-password"
              >
                {verifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Access Documentation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-8 px-2 sm:px-4">
      <div className="mb-4 md:mb-8">
        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <Code className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Developer Documentation</h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground">
          Welcome, {user?.firstName || user?.email || 'Developer'}! Technical documentation for integrating TrueReach.
        </p>
      </div>

      <Tabs defaultValue="api" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="api" data-testid="tab-api" className="text-xs md:text-sm py-2">
            <FileJson className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">API Reference</span>
            <span className="sm:hidden">API</span>
          </TabsTrigger>
          <TabsTrigger value="widget" data-testid="tab-widget" className="text-xs md:text-sm py-2">
            <Code2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Widget
          </TabsTrigger>
          <TabsTrigger value="integration" data-testid="tab-integration" className="text-xs md:text-sm py-2">
            <Zap className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Integration Guide</span>
            <span className="sm:hidden">Guide</span>
          </TabsTrigger>
          <TabsTrigger value="specs" data-testid="tab-specs" className="text-xs md:text-sm py-2">
            <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Technical Specs</span>
            <span className="sm:hidden">Specs</span>
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

        <TabsContent value="widget" className="space-y-6">
          <Card className="p-6 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">EHR/Pharmacy Management Widget</h2>
              <p className="text-muted-foreground">
                Drop-in JavaScript widget for real-time phone validation in any healthcare system
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">3-Minute Setup</h3>
                <p className="text-sm text-muted-foreground">Just 2 lines of JavaScript</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">HIPAA Ready</h3>
                <p className="text-sm text-muted-foreground">No PHI stored</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Settings className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Customizable</h3>
                <p className="text-sm text-muted-foreground">Match your EHR's style</p>
              </div>
            </div>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The TrueReach Widget is a lightweight JavaScript library that adds real-time phone validation 
                to any web-based healthcare system. When a staff member enters a phone number, the widget 
                instantly validates it against our NANP-compliant database and the Veriphone carrier network.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <h4 className="font-semibold mb-2">What You Get</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Instant valid/invalid feedback</li>
                    <li>• Phone type detection (mobile, landline, VoIP)</li>
                    <li>• SMS capability check</li>
                    <li>• Carrier identification</li>
                    <li>• Smart correction suggestions</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <h4 className="font-semibold mb-2">Integration Process</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>1. Add our script tag to your page</li>
                    <li>2. Initialize with your API credentials</li>
                    <li>3. Attach to phone input fields</li>
                    <li>4. Validation happens automatically</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="text-primary" />
                How to Get Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Widget access is available to healthcare organizations with an active TrueReach subscription. 
                To get started:
              </p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <span><strong>Contact our team</strong> — Email <a href="mailto:support@true-reach.app" className="text-primary hover:underline">support@true-reach.app</a> with your organization name and EHR/pharmacy system.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span><strong>Receive API credentials</strong> — We'll provision your unique API key and widget access.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                  <span><strong>Implementation support</strong> — Our team can assist with integration into your specific system.</span>
                </li>
              </ol>
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> Widget integration requires technical access to add JavaScript to your EHR/pharmacy system. 
                  Some systems may require IT department involvement.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="text-primary" />
                Widget API Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <h4 className="font-mono font-semibold mb-2">PhoneValidatorWidget.init(options)</h4>
                <ul className="space-y-1 text-sm">
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">apiUrl</code> - Base URL of validation API (required)</li>
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">country</code> - Default country code (default: 'US')</li>
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">debounceMs</code> - Debounce delay (default: 500)</li>
                </ul>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <h4 className="font-mono font-semibold mb-2">PhoneValidatorWidget.validate(phone)</h4>
                <p className="text-sm text-muted-foreground mb-2">Returns Promise with validation result:</p>
                <ul className="space-y-1 text-sm">
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">valid</code> - boolean</li>
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">phoneType</code> - 'mobile', 'fixed_line', 'voip'</li>
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">canReceiveSms</code> - boolean</li>
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">carrier</code> - carrier name</li>
                </ul>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <h4 className="font-mono font-semibold mb-2">PhoneValidatorWidget.attach(selector, options)</h4>
                <ul className="space-y-1 text-sm">
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">validateOnBlur</code> - Validate when field loses focus (default: true)</li>
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">validateOnType</code> - Validate while typing (default: false)</li>
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">showInline</code> - Show inline validation UI (default: true)</li>
                  <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">onValidate</code> - Callback function (result, element)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="text-orange-600" />
                System-Specific Integration Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Electronic Health Records (EHR):</h4>
                <ul className="space-y-1 text-sm ml-4 list-disc">
                  <li><strong>Epic:</strong> Add to SmartForms or custom web components</li>
                  <li><strong>Cerner:</strong> Inject into PowerForms via CCL script</li>
                  <li><strong>eClinicalWorks:</strong> Use custom form fields with JS validation</li>
                  <li><strong>Allscripts:</strong> Add to TouchWorks forms via form designer</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Pharmacy Management Systems:</h4>
                <ul className="space-y-1 text-sm ml-4 list-disc">
                  <li><strong>PioneerRx, Rx30, PrimeRx:</strong> Custom HTML/JS in patient profile forms</li>
                  <li><strong>ScriptPro, EnterpriseRx:</strong> Web-based patient intake screens</li>
                  <li><strong>BestRx, Liberty:</strong> Custom form fields in patient demographics</li>
                </ul>
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
