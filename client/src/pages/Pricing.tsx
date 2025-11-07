import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Building2 } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Batch Upload",
      price: "$79",
      period: "month",
      description: "Clean your existing patient database",
      icon: Building2,
      features: [
        "Upload CSV/Excel files",
        "Validate up to 10,000 numbers/month",
        "Identify SMS-capable numbers",
        "Phone type detection (mobile/landline)",
        "Carrier information",
        "Export results to CSV",
        "Email support",
      ],
      popular: false,
    },
    {
      name: "Real-Time API",
      price: "$199",
      period: "month",
      description: "Validate as you enter patient data",
      icon: Zap,
      features: [
        "Everything in Batch Upload",
        "Real-time validation API",
        "Validate up to 50,000 numbers/month",
        "Instant feedback on forms",
        "Auto-formatting of phone numbers",
        "Warning detection (landline, VoIP)",
        "Priority support",
        "API documentation",
      ],
      popular: true,
    },
    {
      name: "Full Integration",
      price: "$399",
      period: "month",
      description: "Embedded directly in your EMR",
      icon: Star,
      features: [
        "Everything in Real-Time API",
        "Unlimited validations",
        "Custom EMR integration",
        "Dedicated account manager",
        "SLA guarantee (99.9% uptime)",
        "Custom reporting dashboard",
        "Webhook notifications",
        "White-label option",
        "24/7 phone support",
      ],
      popular: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground mb-3">
            Verifying connections, providing care
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your healthcare organization's needs. All plans include our core validation features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`p-8 relative hover-elevate ${
                  plan.popular ? "border-2 border-primary" : ""
                }`}
                data-testid={`card-plan-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="mb-2">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  data-testid={`button-select-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  Get Started
                </Button>
              </Card>
            );
          })}
        </div>

        <Card className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We offer enterprise plans for large healthcare systems with custom requirements. Contact our sales team for a personalized quote.
          </p>
          <Button size="lg" variant="outline" data-testid="button-contact-sales">
            Contact Sales
          </Button>
        </Card>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-semibold mb-2">HIPAA Compliant</h3>
            <p className="text-sm text-muted-foreground">
              All data is encrypted and handled according to HIPAA regulations
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Validate thousands of numbers in seconds with our optimized API
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-semibold mb-2">99.9% Accuracy</h3>
            <p className="text-sm text-muted-foreground">
              Industry-leading validation accuracy powered by Veriphone
            </p>
          </Card>
        </div>
    </div>
  );
}
