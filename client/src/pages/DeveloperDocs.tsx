import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Code,
  FileJson,
  Settings,
  Zap,
  Lock,
  CheckCircle,
  LogIn,
  Key,
  Code2,
  Smartphone,
  AlertCircle,
  FileText,
  BookOpen,
  Shield,
  Terminal,
  XCircle,
} from "lucide-react";

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
              API documentation and integration guides are available to
              registered developers.
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
              Welcome, {user?.firstName || "Developer"}! Please enter your
              developer access code to view the documentation.
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
          <h1 className="text-2xl md:text-3xl font-bold">
            Developer Documentation
          </h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground">
          Welcome, {user?.firstName || user?.email || "Developer"}! Technical
          documentation for integrating TrueReach phone validation.
        </p>
      </div>

      <Tabs defaultValue="api" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto">
          <TabsTrigger
            value="api"
            data-testid="tab-api"
            className="text-xs md:text-sm py-2"
          >
            <FileJson className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">API Reference</span>
            <span className="sm:hidden">API</span>
          </TabsTrigger>
          <TabsTrigger
            value="widget"
            data-testid="tab-widget"
            className="text-xs md:text-sm py-2"
          >
            <Code2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Widget
          </TabsTrigger>
          <TabsTrigger
            value="frameworks"
            data-testid="tab-frameworks"
            className="text-xs md:text-sm py-2"
          >
            <Zap className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Frameworks</span>
            <span className="sm:hidden">Code</span>
          </TabsTrigger>
          <TabsTrigger
            value="runbook"
            data-testid="tab-runbook"
            className="text-xs md:text-sm py-2"
          >
            <BookOpen className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Run Book</span>
            <span className="sm:hidden">Ops</span>
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            data-testid="tab-specs"
            className="text-xs md:text-sm py-2"
          >
            <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Technical Specs</span>
            <span className="sm:hidden">Specs</span>
          </TabsTrigger>
        </TabsList>

        {/* ===================== API REFERENCE TAB ===================== */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Real-Time Validation Endpoint
                <Badge variant="secondary">POST</Badge>
              </CardTitle>
              <CardDescription>
                https://true-reach.app/api/validate-realtime
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "phone": "+15551234567",
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
                <h4 className="font-semibold mb-2">
                  Response (Invalid Number)
                </h4>
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
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Rate Limit:</strong> 100 requests per 15 minutes per
                  client IP. Exceeding the limit returns HTTP 429 with a{" "}
                  <code className="bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded">
                    Retry-After
                  </code>{" "}
                  header.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Batch Validation Endpoint
                <Badge variant="secondary">POST</Badge>
              </CardTitle>
              <CardDescription>
                https://true-reach.app/api/validate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Request</h4>
                <p className="text-muted-foreground mb-2">
                  Multipart form data with a CSV or Excel file containing phone
                  numbers.
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
    }
  ]
}`}
                </pre>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Rate Limit:</strong> 10 uploads per minute per client
                  IP. 300ms delay between individual number validations within a
                  batch.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                External Dependencies
                <Badge variant="outline">Required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                The deployment environment must allow outbound HTTPS access to
                these services:
              </p>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 p-3 border rounded-lg">
                  <span className="font-medium text-sm">Widget Script:</span>
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    https://true-reach.app/phone-validator-widget.js
                  </code>
                </div>
                <div className="flex flex-wrap items-center gap-2 p-3 border rounded-lg">
                  <span className="font-medium text-sm">Validation API:</span>
                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    https://true-reach.app/api/validate-realtime
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== WIDGET TAB ===================== */}
        <TabsContent value="widget" className="space-y-6">
          <Card className="p-6 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">
                EHR/Pharmacy Management Widget
              </h2>
              <p className="text-muted-foreground">
                Drop-in JavaScript widget for real-time phone validation in any
                healthcare system
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">3-Minute Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Just 2 lines of JavaScript
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">HIPAA Ready</h3>
                <p className="text-sm text-muted-foreground">No PHI stored</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Settings className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Customizable</h3>
                <p className="text-sm text-muted-foreground">
                  Match your EHR's style
                </p>
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
                The TrueReach Widget is a lightweight JavaScript library that
                adds real-time phone validation to any web-based healthcare
                system. When a staff member enters a phone number, the widget
                instantly validates it against our NANP-compliant database and
                the Veriphone carrier network.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <h4 className="font-semibold mb-2">What You Get</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>- Instant valid/invalid feedback</li>
                    <li>- Phone type detection (mobile, landline, VoIP)</li>
                    <li>- SMS capability check</li>
                    <li>- Carrier identification</li>
                    <li>- Smart correction suggestions</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <h4 className="font-semibold mb-2">Validation Flow</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>1. User enters a phone number</li>
                    <li>2. Application waits briefly (debounce)</li>
                    <li>3. Number is checked via TrueReach API</li>
                    <li>4. Validation result is returned</li>
                    <li>5. User sees valid or invalid feedback</li>
                    <li>6. Form submission blocked if invalid</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="text-primary" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">
                  Step 1: Include the Widget
                </h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`<script src="https://true-reach.app/phone-validator-widget.js"></script>`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Step 2: Initialize</h4>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {`PhoneValidatorWidget.init({
  apiUrl: 'https://true-reach.app',
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
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="text-primary" />
                Widget API Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <h4 className="font-mono font-semibold mb-2">
                  PhoneValidatorWidget.init(options)
                </h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      apiUrl
                    </code>{" "}
                    - Base URL of validation API (required)
                  </li>
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      country
                    </code>{" "}
                    - Default country code (default: 'US')
                  </li>
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      debounceMs
                    </code>{" "}
                    - Debounce delay (default: 500)
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <h4 className="font-mono font-semibold mb-2">
                  PhoneValidatorWidget.validate(phone)
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Returns Promise with validation result:
                </p>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      valid
                    </code>{" "}
                    - boolean
                  </li>
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      phoneType
                    </code>{" "}
                    - 'mobile', 'fixed_line', 'voip'
                  </li>
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      canReceiveSms
                    </code>{" "}
                    - boolean
                  </li>
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      carrier
                    </code>{" "}
                    - carrier name
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <h4 className="font-mono font-semibold mb-2">
                  PhoneValidatorWidget.attach(selector, options)
                </h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      validateOnBlur
                    </code>{" "}
                    - Validate when field loses focus (default: true)
                  </li>
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      validateOnType
                    </code>{" "}
                    - Validate while typing (default: false)
                  </li>
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      showInline
                    </code>{" "}
                    - Show inline validation UI (default: true)
                  </li>
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      onValidate
                    </code>{" "}
                    - Callback function (result, element)
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <h4 className="font-mono font-semibold mb-2">
                  PhoneValidatorWidget.validateBatch(phones, onProgress)
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Validate multiple numbers with progress callback:
                </p>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      phones
                    </code>{" "}
                    - Array of phone number strings
                  </li>
                  <li>
                    <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                      onProgress
                    </code>{" "}
                    - Callback function (completed, total)
                  </li>
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
                <h4 className="font-semibold mb-2">
                  Electronic Health Records (EHR):
                </h4>
                <ul className="space-y-1 text-sm ml-4 list-disc">
                  <li>
                    <strong>Epic:</strong> Add to SmartForms or custom web
                    components
                  </li>
                  <li>
                    <strong>Cerner:</strong> Inject into PowerForms via CCL
                    script
                  </li>
                  <li>
                    <strong>eClinicalWorks:</strong> Use custom form fields with
                    JS validation
                  </li>
                  <li>
                    <strong>Allscripts:</strong> Add to TouchWorks forms via
                    form designer
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Pharmacy Management Systems:
                </h4>
                <ul className="space-y-1 text-sm ml-4 list-disc">
                  <li>
                    <strong>PioneerRx, Rx30, PrimeRx:</strong> Custom HTML/JS in
                    patient profile forms
                  </li>
                  <li>
                    <strong>ScriptPro, EnterpriseRx:</strong> Web-based patient
                    intake screens
                  </li>
                  <li>
                    <strong>BestRx, Liberty:</strong> Custom form fields in
                    patient demographics
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== FRAMEWORKS TAB ===================== */}
        <TabsContent value="frameworks" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Framework Integration Guides</CardTitle>
              <CardDescription>
                Step-by-step integration patterns for popular frontend
                frameworks. All approaches follow the same core behavior:
                debounced HTTPS POST to the TrueReach API, local state
                management for results, and form submission control.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <h4 className="font-semibold mb-2">Common Technical Pattern</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    - Use an HTTPS POST request to{" "}
                    <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      https://true-reach.app/api/validate-realtime
                    </code>
                  </li>
                  <li>
                    - Send request body with{" "}
                    <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      phone
                    </code>{" "}
                    and{" "}
                    <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      country
                    </code>
                  </li>
                  <li>- Trigger validation after a 300-500ms debounce delay</li>
                  <li>
                    - Store validation result in local form/component state
                  </li>
                  <li>
                    - Use the result to show feedback and control form
                    submission
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Angular</Badge>
                Angular Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Recommended steps:
                </p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>
                    Add the TrueReach validation service to the shared services
                    layer
                  </li>
                  <li>Add the phone field to a reactive form</li>
                  <li>
                    Trigger validation from the phone field value change event
                    after a short delay
                  </li>
                  <li>Show a simple valid or invalid message in the form</li>
                  <li>
                    Prevent submission when a valid phone number is required
                  </li>
                </ol>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`// phone-validation.service.ts
@Injectable({ providedIn: 'root' })
export class PhoneValidationService {
  private apiUrl = 'https://true-reach.app/api/validate-realtime';

  validatePhone(phone: string): Observable<any> {
    return this.http.post(this.apiUrl, { phone, country: 'US' });
  }
}

// registration.component.ts
this.phoneControl.valueChanges.pipe(
  debounceTime(400),
  distinctUntilChanged(),
  switchMap(value => this.phoneService.validatePhone(value))
).subscribe(result => {
  this.phoneIsValid = result.valid;
  this.phoneMessage = result.valid ? 'Valid number' : 'Invalid number';
});`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">React</Badge>
                React Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Recommended steps:
                </p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Create a reusable phone input component</li>
                  <li>Store the phone number in component state</li>
                  <li>
                    Trigger validation after input changes using a debounce
                  </li>
                  <li>Call the TrueReach API from a shared API layer</li>
                  <li>
                    Show validation feedback and block submit when required
                  </li>
                </ol>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`function PhoneInput({ onValidation }) {
  const [phone, setPhone] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (phone.length < 10) return;
    const timer = setTimeout(async () => {
      const res = await fetch('https://true-reach.app/api/validate-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, country: 'US' })
      });
      const result = await res.json();
      setIsValid(result.valid);
      setMessage(result.valid ? 'Valid number' : 'Invalid number');
      onValidation?.(result);
    }, 400);
    return () => clearTimeout(timer);
  }, [phone]);

  return (
    <div>
      <input type="tel" value={phone}
        onChange={e => setPhone(e.target.value)} />
      {message && <span>{message}</span>}
    </div>
  );
}`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Vue.js</Badge>
                Vue.js Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Recommended steps:
                </p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Add the phone field to a Vue component using v-model</li>
                  <li>
                    Watch the phone value and trigger validation after a delay
                  </li>
                  <li>Call the TrueReach API through a service layer</li>
                  <li>Show validation feedback in the template</li>
                  <li>
                    Prevent submission when a valid phone number is required
                  </li>
                </ol>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`<script setup>
import { ref, watch } from 'vue';

const phone = ref('');
const isValid = ref(null);
const message = ref('');
let debounceTimer = null;

watch(phone, (newVal) => {
  clearTimeout(debounceTimer);
  if (newVal.length < 10) return;
  debounceTimer = setTimeout(async () => {
    const res = await fetch('https://true-reach.app/api/validate-realtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: newVal, country: 'US' })
    });
    const result = await res.json();
    isValid.value = result.valid;
    message.value = result.valid ? 'Valid number' : 'Invalid number';
  }, 400);
});
</script>

<template>
  <input v-model="phone" type="tel" />
  <span v-if="message">{{ message }}</span>
</template>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">JavaScript</Badge>
                Vanilla JavaScript Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Recommended steps:
                </p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Add a phone input field to your HTML</li>
                  <li>Capture the input value using an event listener</li>
                  <li>Apply a 300-500ms debounce before sending validation</li>
                  <li>Call the TrueReach API using fetch</li>
                  <li>Show feedback and control form submission</li>
                </ol>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`const phoneInput = document.getElementById('phone');
const feedback = document.getElementById('phone-feedback');
const submitBtn = document.getElementById('submit');
let debounceTimer;

phoneInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  const phone = e.target.value;
  if (phone.length < 10) return;
  
  debounceTimer = setTimeout(async () => {
    const res = await fetch('https://true-reach.app/api/validate-realtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, country: 'US' })
    });
    const result = await res.json();
    
    feedback.textContent = result.valid ? 'Valid number' : 'Invalid number';
    feedback.style.color = result.valid ? 'green' : 'red';
    submitBtn.disabled = !result.valid;
  }, 400);
});`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">HTML</Badge>
                HTML + Script Tag Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The simplest integration. Add the TrueReach widget script to
                your HTML page and it handles everything automatically.
              </p>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                {`<!DOCTYPE html>
<html>
<head>
  <script src="https://true-reach.app/phone-validator-widget.js"></script>
</head>
<body>
  <form id="registration-form">
    <label for="phone">Phone Number</label>
    <input type="tel" id="phone" name="phone" />
    <span id="phone-status"></span>
    <button type="submit" id="submit-btn">Submit</button>
  </form>

  <script>
    PhoneValidatorWidget.init({
      apiUrl: 'https://true-reach.app',
      mode: 'blur'
    });
    PhoneValidatorWidget.attach('#phone', {
      validateOnBlur: true,
      showInline: true,
      onValidate: function(result) {
        document.getElementById('submit-btn').disabled = !result.valid;
      }
    });
  </script>
</body>
</html>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Implementation Guidance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Best Practices
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>- Validate after a 300-500ms debounce delay</li>
                      <li>- Keep API calls in a reusable service layer</li>
                      <li>- Show clear valid/invalid feedback to user</li>
                      <li>- Prevent invalid numbers from form submission</li>
                      <li>- Confirm outbound HTTPS access to TrueReach</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Response Handling
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>
                        - <strong>Success:</strong> Valid number, workflow
                        continues
                      </li>
                      <li>
                        - <strong>Validation failure:</strong> Show invalid
                        message
                      </li>
                      <li>
                        - <strong>Service failure:</strong> Show temporary
                        error, handle submit safely
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== RUN BOOK TAB ===================== */}
        <TabsContent value="runbook" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="text-primary" />
                Deployment Readiness Checklist
              </CardTitle>
              <CardDescription>
                Confirm before production release
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "Registration workflow loads correctly in the target environment",
                  "TrueReach endpoints are reachable (widget URL and validation API)",
                  "Phone validation occurs as expected after debounce delay",
                  "Invalid phone numbers are blocked where required",
                  "Valid phone numbers allow workflow completion",
                  "No browser console or network errors appear during validation",
                  "Outbound HTTPS access to true-reach.app is permitted",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className="w-5 h-5 border-2 border-muted-foreground/30 rounded flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="text-primary" />
                Functional Validation Procedure
              </CardTitle>
              <CardDescription>
                Use after deployment or during QA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    step: "Open the registration form or any phone-enabled form",
                    expected: "",
                  },
                  {
                    step: "Enter a very short number (e.g., 123)",
                    expected: "Validation should not trigger immediately",
                  },
                  {
                    step: "Enter a complete phone number",
                    expected:
                      "Validation should run after the configured delay (300-500ms)",
                  },
                  {
                    step: "Confirm the application shows validation feedback",
                    expected:
                      "Valid or invalid indicator appears near the phone field",
                  },
                  {
                    step: "Enter an invalid number and attempt to submit",
                    expected: "Submission is blocked when blocking is required",
                  },
                  {
                    step: "Enter a valid number and submit",
                    expected: "Process continues normally",
                  },
                ].map((item, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{item.step}</p>
                        {item.expected && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Expected: {item.expected}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="text-destructive" />
                Troubleshooting Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Widget does not load</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4 list-disc">
                  <li>
                    Check reachability of{" "}
                    <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      https://true-reach.app/phone-validator-widget.js
                    </code>
                  </li>
                  <li>
                    Check firewall or proxy restrictions blocking outbound HTTPS
                  </li>
                  <li>Check browser security policy (CSP) restrictions</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Validation requests fail</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4 list-disc">
                  <li>
                    Check reachability of{" "}
                    <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      https://true-reach.app/api/validate-realtime
                    </code>
                  </li>
                  <li>Verify outbound HTTPS access from the environment</li>
                  <li>
                    Verify the request body includes{" "}
                    <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      phone
                    </code>{" "}
                    field
                  </li>
                  <li>Check browser network tab for error details</li>
                  <li>
                    If receiving HTTP 429: rate limit exceeded, wait and retry
                  </li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">
                  Validation does not trigger
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4 list-disc">
                  <li>
                    Confirm the phone field is mapped correctly in the form
                  </li>
                  <li>
                    Check that validation event setup (blur, input) is active
                  </li>
                  <li>Verify debounce trigger conditions and delay rules</li>
                  <li>Check service integration wiring in the component</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">
                  Shared component unavailable in another module
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4 list-disc">
                  <li>
                    Verify shared module inclusion in the target feature module
                  </li>
                  <li>Check shared component export configuration</li>
                  <li>Confirm feature module import configuration</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reuse Model for Future Expansion</CardTitle>
              <CardDescription>
                How to extend TrueReach to other forms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The delivered implementation is reusable. Future rollout can be
                achieved with controlled incremental effort rather than a new
                design exercise.
              </p>
              <div className="space-y-2">
                {[
                  "Add the shared TrueReach-enabled component to the target feature",
                  "Add the phone field to the form",
                  "Validate the field after a short delay (not on every keystroke)",
                  "Show a clear success or failure message to the user",
                  "Block submission when the business process requires a valid phone number",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <h4 className="font-semibold mb-2">Applicable Areas</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    "User Management",
                    "Profile Maintenance",
                    "Shipper Onboarding",
                    "Carrier Onboarding",
                    "Patient Registration",
                    "Contact Forms",
                  ].map((area) => (
                    <div
                      key={area}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Future Improvements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  "Move TrueReach endpoint values into managed environment settings",
                  "Improve typed response handling for stronger type safety",
                  "Expand automated testing coverage for validation flows",
                  "Add monitoring and alerting for validation failures",
                  "Extend the same pattern to other onboarding and profile workflows",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== TECHNICAL SPECS TAB ===================== */}
        <TabsContent value="specs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>NANP Validation Rules</CardTitle>
              <CardDescription>
                North American Numbering Plan enforcement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Area Code Validation</h4>
                    <p className="text-sm text-muted-foreground">
                      Validates against all assigned US/Canada area codes.
                      Rejects invalid codes like 123, 999.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Exchange Code Rules</h4>
                    <p className="text-sm text-muted-foreground">
                      Cannot start with 0 or 1. Reserved codes (555, 911, 000)
                      are rejected.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">N11 Service Codes</h4>
                    <p className="text-sm text-muted-foreground">
                      Detects N11 codes (211, 311, 411, 511, 611, 711, 811, 911)
                      as invalid phone numbers.
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
              <CardDescription>
                Suggestion confidence scoring system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Badge className="bg-green-500">HIGH</Badge>
                  <div>
                    <p className="font-medium">90-100% confidence</p>
                    <p className="text-sm text-muted-foreground">
                      NANP violations, definitive format issues
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Badge className="bg-yellow-500">MEDIUM</Badge>
                  <div>
                    <p className="font-medium">75-89% confidence</p>
                    <p className="text-sm text-muted-foreground">
                      Placeholder patterns, transposed digits
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Badge className="bg-gray-500">LOW</Badge>
                  <div>
                    <p className="font-medium">Below 75% confidence</p>
                    <p className="text-sm text-muted-foreground">
                      Speculative suggestions, less certain patterns
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
              <CardDescription>
                API usage limits enforced per client IP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 border rounded-lg">
                  <span className="text-sm">Real-time validation</span>
                  <Badge variant="outline">100 requests / 15 minutes</Badge>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 border rounded-lg">
                  <span className="text-sm">Batch file upload</span>
                  <Badge variant="outline">10 uploads / minute</Badge>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 border rounded-lg">
                  <span className="text-sm">Batch inter-number delay</span>
                  <Badge variant="outline">300ms between validations</Badge>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 border rounded-lg">
                  <span className="text-sm">Widget debounce</span>
                  <Badge variant="outline">500ms typing debounce</Badge>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mt-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Rate limit exceeded?</strong> The API returns HTTP
                    429 with a{" "}
                    <code className="bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded">
                      Retry-After
                    </code>{" "}
                    header indicating seconds to wait. Rate limits are tracked
                    per client IP using PostgreSQL for consistency across all
                    service instances.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Enterprise security measures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 border rounded-lg">
                  <span className="text-sm">Security Headers</span>
                  <Badge variant="outline">
                    Helmet.js (HSTS, X-Frame, XSS, MIME)
                  </Badge>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 border rounded-lg">
                  <span className="text-sm">CORS</span>
                  <Badge variant="outline">Widget: open / API: allowlist</Badge>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 border rounded-lg">
                  <span className="text-sm">Compression</span>
                  <Badge variant="outline">gzip/brotli (~60% reduction)</Badge>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 border rounded-lg">
                  <span className="text-sm">Request Size Limit</span>
                  <Badge variant="outline">10MB maximum</Badge>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 border rounded-lg">
                  <span className="text-sm">Data Retention</span>
                  <Badge variant="outline">HIPAA auto-expire: 30 minutes</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
