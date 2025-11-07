import { Link, useLocation } from "wouter";
import { FileText, Zap, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";

export function Navigation() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Batch Upload", icon: FileText },
    { href: "/widget-demo", label: "Real-Time Demo", icon: Zap },
    { href: "/widget-integration", label: "EHR Widget", icon: Zap },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
  ];

  return (
    <Card className="mb-8">
      <nav className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <span className="font-bold text-primary text-xl">Phone Validator Pro</span>
          </div>
          <div className="flex gap-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
              >
                <a
                  data-testid={`link-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors hover-elevate ${
                    location === href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </Card>
  );
}
