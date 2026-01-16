import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, Zap, Code2, CheckCircle, ArrowRight } from "lucide-react";
import logoUrl from "@assets/image_1762494775992.png";

export default function Landing() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 md:pt-8">
      <section className="text-center pb-4 md:pb-8 mb-4 md:mb-8">
        <div className="flex items-center justify-center -mb-2 md:-mb-4 lg:-mb-8">
          <img src={logoUrl} alt="TrueReach Logo" className="h-40 md:h-72 lg:h-[500px]" />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground mb-6 md:mb-8 leading-tight">
          Stop Missed Appointments. Start True Patient Engagement.
        </h1>

        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto px-2">
          The only patient verification tool built to help{" "}
          <strong>FQHCs reduce no-shows by up to 25%</strong> and maximize
          valuable clinical time.
        </p>

        <a 
          href="/batch"
          className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-6 md:py-3 md:px-8 rounded-full shadow-lg hover:shadow-xl transition duration-300 text-sm md:text-base"
          data-testid="button-try-now"
        >
          Try It Now
        </a>

        <div className="mt-6 flex flex-wrap justify-center gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-primary" /> HIPAA Compliant
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-primary" /> EHR Integrated
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-primary" /> FQHC Focused
          </span>
        </div>
      </section>

      <section className="py-4 md:py-8 mb-4 md:mb-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4 md:mb-6 px-2">
            How It Works: Verification That Fits Your Workflow
          </h2>
          <p className="text-base md:text-lg text-center text-muted-foreground mb-6 md:mb-8 max-w-4xl mx-auto px-2">
            TrueReach converts bad data into reliable connections using two
            powerful modes to support every team and every process.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <Card className="p-4 md:p-6 border-primary/20">
              <h3 className="text-xl md:text-2xl font-semibold text-primary mb-2 md:mb-3">
                1. Real-Time Widget
              </h3>
              <p className="text-sm font-medium text-muted-foreground mb-4">
                Target User: Front-Desk / Call Center Staff
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Instant Check at Registration:</strong> Use our
                    light, secure widget to verify a new patient's number while
                    they are on the phone or checking in.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Stop Bad Data:</strong> Eliminates data entry errors
                    before the information enters your EHR.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Seamless Workflow:</strong> Designed to integrate
                    without interrupting your existing front-end process.
                  </span>
                </li>
              </ul>
            </Card>

            <Card className="p-4 md:p-6 border-primary/20">
              <h3 className="text-xl md:text-2xl font-semibold text-primary mb-2 md:mb-3">
                2. Batch Upload
              </h3>
              <p className="text-sm font-medium text-muted-foreground mb-4">
                Target User: IT / Operations Teams
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Proactive Database Cleanup:</strong> Upload your
                    entire patient list or targeted cohorts for a full database
                    scrub.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Campaign Ready:</strong> Delivers a clean file for
                    mass outreach campaigns and quarterly data audits.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Downloadable Excel Report:</strong> Get a comprehensive 
                    report with validation summary, SMS capability stats, phone type 
                    breakdown, and smart correction suggestions.
                  </span>
                </li>
              </ul>
            </Card>
          </div>

          <div className="text-center mt-6 md:mt-8 pt-4 md:pt-6 border-t px-2">
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
              3. Connect & Care!
            </h3>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              Verified data is automatically pushed or securely loaded back into
              your EHR/PMS, ensuring your vital communications{" "}
              <strong>reach the right person, right now,</strong> helping you
              close care gaps and save lives.
            </p>
          </div>
        </div>
      </section>

      <section className="py-4 md:py-8 mb-4 md:mb-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4 md:mb-6 px-2">
            The FQHC Value Proposition: The Power of Valid Data
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 text-center">
            <div className="p-3 md:p-6">
              <h3 className="text-base md:text-xl font-semibold text-foreground mb-2 md:mb-3">
                Boost Revenue Cycle
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Every verified appointment is a scheduled billable encounter.
                Lower no-show rates directly lead to higher daily revenue
                capture under the <strong>PPS model</strong>.
              </p>
            </div>

            <div className="p-3 md:p-6">
              <h3 className="text-base md:text-xl font-semibold text-foreground mb-2 md:mb-3">
                Improve Quality Metrics
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Guaranteed patient contact for preventive screenings and{" "}
                <strong>Chronic Care Management (CCM)</strong> improves UDS and
                HEDIS measures, supporting Value-Based Care goals.
              </p>
            </div>

            <div className="p-3 md:p-6">
              <h3 className="text-base md:text-xl font-semibold text-foreground mb-2 md:mb-3">
                Increase Staff Efficiency
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Free your staff from the endless cycle of "phone tag."
                Automation lets your team focus on patient support, not manual
                data verification.
              </p>
            </div>

            <div className="p-3 md:p-6">
              <h3 className="text-base md:text-xl font-semibold text-foreground mb-2 md:mb-3">
                HIPAA-Safe by Design
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Patient data is <strong>never stored</strong> on our servers. 
                Results auto-expire after 30 minutes for complete{" "}
                <strong>HIPAA compliance</strong> and peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="get-started" className="mb-4 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 md:mb-6 px-2">
          Three Powerful Ways to Validate
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <Card className="p-4 md:p-8 hover-elevate">
            <div className="flex justify-center mb-3 md:mb-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-center">
              Batch Upload
            </h3>
            <p className="text-sm md:text-base text-muted-foreground text-center mb-4 md:mb-6">
              Upload CSV or Excel files to clean your entire patient database in
              minutes. Validate thousands of phone numbers at once.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">CSV & Excel file support</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Smart duplicate detection</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Excel report with summary stats</span>
              </li>
            </ul>
            <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted/50 rounded">
              <strong>Report includes:</strong> Validation summary, SMS stats, phone types, carrier info, patient data pass-through
            </div>
            <Button
              className="w-full"
              variant="outline"
              data-testid="button-try-batch"
              onClick={() => window.location.href = '/batch'}
            >
              Try Batch Upload
            </Button>
          </Card>

          <Card className="p-4 md:p-8 hover-elevate border-primary">
            <div className="flex justify-center mb-3 md:mb-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-center">
              Real-Time API
            </h3>
            <p className="text-sm md:text-base text-muted-foreground text-center mb-4 md:mb-6">
              Validate phone numbers instantly as users type. Perfect for
              patient registration and intake forms.
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
            <Button 
              className="w-full" 
              data-testid="button-try-realtime"
              onClick={() => window.location.href = '/widget-demo'}
            >
              Try Live Demo
            </Button>
          </Card>

          <Card className="p-4 md:p-8 hover-elevate">
            <div className="flex justify-center mb-3 md:mb-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Code2 className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-center">
              Widget Integration
            </h3>
            <p className="text-sm md:text-base text-muted-foreground text-center mb-4 md:mb-6">
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
            <Button
              className="w-full"
              variant="outline"
              data-testid="button-view-integration"
              onClick={() => window.location.href = '/developer-docs'}
            >
              Developer Docs
            </Button>
          </Card>
        </div>
      </section>

      <section className="mb-4 md:mb-8">
        <Card className="p-4 md:p-8 bg-primary/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
              Why Phone Validation Matters
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6 px-2">
              Invalid phone numbers cost healthcare organizations thousands in
              missed appointments, failed medication reminders, and lost patient
              engagement opportunities.
            </p>

            <div className="grid grid-cols-3 gap-4 md:gap-8">
              <div>
                <div className="text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">
                  99.9%
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Validation Accuracy
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">50K+</div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Numbers Validated Daily
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">24/7</div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Support Available
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>


      <section className="text-center py-4 md:py-8 px-2">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Ready to Get Started?</h2>
        <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6">
          Choose the validation method that works best for your organization.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <Button 
            size="lg" 
            data-testid="button-get-started"
            onClick={() => window.location.href = '/batch'}
          >
            Get Started
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            data-testid="button-see-all-plans"
            onClick={() => window.location.href = '/pricing'}
          >
            See All Plans
          </Button>
        </div>
      </section>
    </div>
  );
}
