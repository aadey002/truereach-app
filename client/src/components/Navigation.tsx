import { Link, useLocation } from "wouter";
import { FileText, Zap, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import logoUrl from "@assets/image_1762494775992.png";

export function Navigation() {
  const [location] = useLocation();

  const links = [
    { href: "/batch", label: "Batch Upload", icon: FileText },
    { href: "/widget-demo", label: "Real-Time Demo", icon: Zap },
    { href: "/widget-integration", label: "Integration", icon: Zap },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
  ];

  return (
    <Card className="mb-8">
      <nav className="p-4">
        <div className="flex justify-between items-center">
          <Link href="/">
            <img src={logoUrl} alt="TrueReach - Verify. Connect. Care!" className="h-40 cursor-pointer" />
          </Link>
          <div className="flex gap-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
              >
                <span
                  data-testid={`link-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors hover-elevate cursor-pointer ${
                    location === href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </Card>
  );
}
