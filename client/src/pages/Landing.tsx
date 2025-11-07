import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, Zap, Code2, CheckCircle, ArrowRight } from "lucide-react";
import logoUrl from "@assets/truereach-logo-full.png";

export default function Landing() {
  return (
    <div className="max-w-7xl mx-auto">
      <section className="text-center py-20 mb-16">
        <div className="flex items-center justify-center mb-8">
          <img src={logoUrl} alt="TrueReach Logo" className="h-32" />
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold text-foreground mb-6">
          Stop Missed Appointments. Start True Patient Engagement.
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          The only patient verification tool built to help <strong>FQHCs reduce no-shows by up to 25%</strong> and maximize valuable clinical time.
        </p>

        <a 
          href="#get-started" 
          className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-full shadow-lg transition duration-300"
          data-testid="button-request-demo"
        >
          Request a Free Demo
        </a>

        <div className="mt-8 flex justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-primary" /> HIPAA Compliant
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-primary" /> EHR Integrated
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-primary" /> FQHC Focused
          </span>
        </div>
      </section>

      <section className="py-16 mb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-10">
            How It Works: Verification That Fits Your Workflow
          </h2>
          <p className="text-lg text-center text-muted-foreground mb-12 max-w-4xl mx-auto">
            TrueReach converts bad data into reliable connections using two powerful modes to support every team and every process.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6 border-primary/20">
              <h3 className="text-2xl font-semibold text-primary mb-3">1. Real-Time Widget</h3>
              <p className="text-sm font-medium text-muted-foreground mb-4">Target User: Front-Desk / Call Center Staff</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Instant Check at Registration:</strong> Use our light, secure widget to verify a new patient's number while they are on the phone or checking in.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Stop Bad Data:</strong> Eliminates data entry errors before the information enters your EHR.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Seamless Workflow:</strong> Designed to integrate without interrupting your existing front-end process.</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 border-primary/20">
              <h3 className="text-2xl font-semibold text-primary mb-3">2. Batch Upload</h3>
              <p className="text-sm font-medium text-muted-foreground mb-4">Target User: IT / Operations Teams</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Proactive Database Cleanup:</strong> Upload your entire patient list or targeted cohorts for a full database scrub.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Campaign Ready:</strong> Delivers a clean file for mass outreach campaigns and quarterly data audits.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong>Maximize Reach:</strong> Ensure all overdue patients and care gap alerts reach the intended recipient.</span>
                </li>
              </ul>
            </Card>
          </div>

          <div className="text-center mt-12 pt-8 border-t">
            <h3 className="text-xl font-semibold text-foreground mb-2">3. Connect & Care!</h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Verified data is automatically pushed or securely loaded back into your EHR/PMS, ensuring your vital communications <strong>reach the right person, right now,</strong> helping you close care gaps and save lives.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 mb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-10">
            The FQHC Value Proposition: The Power of Valid Data
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">Boost Revenue Cycle</h3>
              <p className="text-muted-foreground">
                Every verified appointment is a scheduled billable encounter. Lower no-show rates directly lead to higher daily revenue capture under the <strong>PPS model</strong>.
              </p>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">Improve Quality Metrics</h3>
              <p className="text-muted-foreground">
                Guaranteed patient contact for preventive screenings and <strong>Chronic Care Management (CCM)</strong> improves UDS and HEDIS measures, supporting Value-Based Care goals.
              </p>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">Increase Staff Efficiency</h3>
              <p className="text-muted-foreground">
                Free your staff from the endless cycle of "phone tag." Automation lets your team focus on patient support, not manual data verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="get-started" className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Three Powerful Ways to Validate</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 hover-elevate">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-center">Batch Upload</h3>
            <p className="text-muted-foreground text-center mb-6">
              Upload CSV or Excel files to clean your entire patient database in minutes. 
              Validate thousands of phone numbers at once.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">CSV & Excel support</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Up to 10,000 numbers/month</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Export validated results</span>
              </li>
            </ul>
            <Link href="/batch">
              <Button className="w-full" variant="outline" data-testid="button-try-batch">
                Try Batch Upload
              </Button>
            </Link>
          </Card>

          <Card className="p-8 hover-elevate border-primary">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-center">Real-Time API</h3>
            <p className="text-muted-foreground text-center mb-6">
              Validate phone numbers instantly as users type. Perfect for patient registration 
              and intake forms.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Instant validation feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Auto-format phone numbers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Landline & VoIP warnings</span>
              </li>
            </ul>
            <Link href="/widget-demo">
              <Button className="w-full" data-testid="button-try-realtime">
                Try Live Demo
              </Button>
            </Link>
          </Card>

          <Card className="p-8 hover-elevate">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Code2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-center">Widget Integration</h3>
            <p className="text-muted-foreground text-center mb-6">
              Drop-in JavaScript widget for EHR and Pharmacy Management systems. 
              No backend changes required.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">2-line JavaScript integration</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Works with any EHR/PMS</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Customizable styling</span>
              </li>
            </ul>
            <Link href="/widget-integration">
              <Button className="w-full" variant="outline" data-testid="button-view-integration">
                View Integration
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      <section className="mb-16">
        <Card className="p-12 bg-primary/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Why Phone Validation Matters</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Invalid phone numbers cost healthcare organizations thousands in missed appointments, 
              failed medication reminders, and lost patient engagement opportunities.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">Validation Accuracy</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">50K+</div>
                <div className="text-sm text-muted-foreground">Numbers Validated Daily</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Support Available</div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="text-center py-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Choose the validation method that works best for your organization.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/batch">
            <Button size="lg" data-testid="button-get-started">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" data-testid="button-see-all-plans">
              See All Plans
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
