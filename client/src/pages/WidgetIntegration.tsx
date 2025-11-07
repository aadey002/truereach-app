import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Smartphone, CheckCircle, AlertCircle } from "lucide-react";

export default function WidgetIntegration() {
  const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.replit.app';

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="p-8 mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Code2 className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold">EHR/Pharmacy Management Widget Integration</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Verifying connections, providing care
        </p>
        <p className="text-muted-foreground mt-2">
          Drop-in JavaScript widget for real-time phone validation in any healthcare system
        </p>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="font-semibold mb-2">3-Minute Setup</h3>
          <p className="text-sm text-muted-foreground">
            Just 2 lines of JavaScript - no backend changes needed
          </p>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="font-semibold mb-2">HIPAA Ready</h3>
          <p className="text-sm text-muted-foreground">
            No PHI stored, all validation happens in real-time
          </p>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-4xl mb-3">🎨</div>
          <h3 className="font-semibold mb-2">Fully Customizable</h3>
          <p className="text-sm text-muted-foreground">
            Match your EHR's look and feel with custom CSS
          </p>
        </Card>
      </div>

      <Card className="p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <CheckCircle className="text-green-600" />
          Quick Start Guide
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">Step 1: Include the Widget Script</h3>
            <p className="text-muted-foreground mb-3">
              Add this script tag to your HTML page (or your EHR's custom form template):
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`<script src="${currentDomain}/phone-validator-widget.js"></script>`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Step 2: Initialize the Widget</h3>
            <p className="text-muted-foreground mb-3">
              Configure the widget with your API URL:
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`<script>
  PhoneValidatorWidget.init({
    apiUrl: '${currentDomain}',
    country: 'US'  // Default country for validation
  });
</script>`}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Step 3: Attach to Your Phone Input</h3>
            <p className="text-muted-foreground mb-3">
              Automatically validate when users leave the phone field:
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`<script>
  // Option A: Simple attachment (validates on blur)
  PhoneValidatorWidget.attach('#patient-phone');

  // Option B: With custom callback
  PhoneValidatorWidget.attach('#patient-phone', {
    validateOnBlur: true,
    showInline: true,
    onValidate: function(result, inputElement) {
      if (!result.valid) {
        console.log('Invalid phone:', result.error);
        // Optionally prevent form submission
        inputElement.setCustomValidity('Invalid phone number');
      } else {
        console.log('Valid phone:', result.formatted);
        inputElement.setCustomValidity('');
        
        // Update a hidden field with formatted number
        document.getElementById('formatted-phone').value = result.formatted;
      }
    }
  });
</script>`}
              </pre>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-6">Complete Example</h2>
        <p className="text-muted-foreground mb-4">
          Here's a complete HTML form with phone validation:
        </p>
        <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`<!DOCTYPE html>
<html>
<head>
  <title>Patient Registration</title>
</head>
<body>
  <form id="patient-form">
    <label for="patient-name">Patient Name:</label>
    <input type="text" id="patient-name" required>
    
    <label for="patient-phone">Phone Number:</label>
    <input type="tel" id="patient-phone" required>
    <!-- Validation result will appear below this input -->
    
    <button type="submit">Register Patient</button>
  </form>

  <!-- Include the widget -->
  <script src="${currentDomain}/phone-validator-widget.js"></script>
  
  <script>
    // Initialize
    PhoneValidatorWidget.init({
      apiUrl: '${currentDomain}'
    });

    // Attach to phone input
    PhoneValidatorWidget.attach('#patient-phone', {
      onValidate: function(result) {
        if (result.valid && !result.canReceiveSms) {
          alert('Warning: This is a ' + result.phoneType + 
                ' and cannot receive SMS appointment reminders.');
        }
      }
    });

    // Prevent form submission if phone is invalid
    document.getElementById('patient-form').addEventListener('submit', 
      async function(e) {
        e.preventDefault();
        
        const phone = document.getElementById('patient-phone').value;
        const result = await PhoneValidatorWidget.validate(phone);
        
        if (!result.valid) {
          alert('Please enter a valid phone number');
          return;
        }
        
        // Proceed with form submission
        console.log('Form valid, submitting...');
        // this.submit(); // Uncomment to actually submit
      }
    );
  </script>
</body>
</html>`}
          </pre>
        </div>
      </Card>

      <Card className="p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Smartphone className="text-primary" />
          API Reference
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2 font-mono">PhoneValidatorWidget.init(options)</h3>
            <p className="text-muted-foreground mb-3">Initialize the widget with configuration</p>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <p className="font-semibold mb-2">Options:</p>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">apiUrl</code> <Badge>required</Badge> - Base URL of your validation API</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">apiKey</code> <Badge variant="outline">optional</Badge> - API key for authentication</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">country</code> <Badge variant="outline">optional</Badge> - Default country (default: 'US')</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">debounceMs</code> <Badge variant="outline">optional</Badge> - Debounce delay (default: 500)</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 font-mono">PhoneValidatorWidget.validate(phone)</h3>
            <p className="text-muted-foreground mb-3">Manually validate a phone number</p>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <p className="font-semibold mb-2">Returns Promise with:</p>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">valid</code> - boolean</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">phoneType</code> - 'mobile', 'fixed_line', 'voip', etc.</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">canReceiveSms</code> - boolean</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">carrier</code> - carrier name</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">formatted</code> - international format</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">warnings</code> - array of warning messages</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 font-mono">PhoneValidatorWidget.attach(selector, options)</h3>
            <p className="text-muted-foreground mb-3">Attach automatic validation to an input field</p>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <p className="font-semibold mb-2">Options:</p>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">validateOnBlur</code> - Validate when user leaves field (default: true)</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">validateOnType</code> - Validate while typing (default: false)</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">showInline</code> - Show inline validation UI (default: true)</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">onValidate</code> - Callback function (result, element)</li>
                <li><code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">onChange</code> - Callback when input changes</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 mb-8 bg-orange-50 dark:bg-orange-950/20 border-orange-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-2">System-Specific Integration Notes</h3>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm mb-1">Electronic Health Records (EHR):</p>
                <ul className="space-y-1 text-sm ml-4">
                  <li><strong>Epic:</strong> Add widget to SmartForms or custom web components. Use .NET event handlers to call validate().</li>
                  <li><strong>Cerner:</strong> Inject widget into PowerForms via CCL script or custom HTML components.</li>
                  <li><strong>Allscripts:</strong> Add to TouchWorks forms using JavaScript hooks in form designer.</li>
                  <li><strong>eClinicalWorks:</strong> Use custom form fields with JavaScript validation.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Pharmacy Management Systems:</p>
                <ul className="space-y-1 text-sm ml-4">
                  <li><strong>PioneerRx, Rx30, PrimeRx:</strong> Most support custom HTML/JS in patient profile forms.</li>
                  <li><strong>ScriptPro, EnterpriseRx:</strong> Add to web-based patient intake or registration screens.</li>
                  <li><strong>BestRx, Liberty Software:</strong> Integrate via custom form fields in patient demographics.</li>
                  <li><strong>All Systems:</strong> Widget works in any browser-based form - no backend modifications needed.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
        <p className="text-muted-foreground mb-4">
          Our team can help you integrate the widget into your specific EHR or Pharmacy Management system.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">📧 Email Support</h3>
            <p className="text-sm text-muted-foreground">support@phonevalidator.com</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">📞 Integration Support</h3>
            <p className="text-sm text-muted-foreground">1-800-VALIDATE (Mon-Fri 9am-5pm EST)</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
