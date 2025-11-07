import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, Zap, Code2, CheckCircle, ArrowRight } from "lucide-react";
import logoUrl from "@assets/truereach-logo-full.png";

export default function Landing() {
  return (
    <div className="max-w-7xl mx-auto">
      <section className="mb-16">
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
