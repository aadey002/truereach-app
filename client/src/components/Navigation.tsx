import { Link, useLocation } from "wouter";
import { FileText, Zap, DollarSign, Code, LogIn, LogOut, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import logoUrl from "@assets/image_1762494775992.png";

export function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  const publicLinks = [
    { href: "/batch", label: "Batch Upload", icon: FileText },
    { href: "/widget-demo", label: "Try It", icon: Zap },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
  ];

  const devLinks = isAuthenticated ? [
    { href: "/developer-docs", label: "Developer Docs", icon: Code },
  ] : [];

  const allLinks = [...publicLinks, ...devLinks];

  return (
    <Card className="mb-8">
      <nav className="p-4">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <Link href="/">
            <img src={logoUrl} alt="TrueReach - Verify. Connect. Care!" className="h-40 cursor-pointer" />
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {allLinks.map(({ href, label, icon: Icon }) => (
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
            
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 ml-2 pl-2 border-l">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {user?.profileImageUrl && (
                          <AvatarImage src={user.profileImageUrl} alt={user.firstName || 'User'} />
                        )}
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      {user?.firstName && (
                        <span className="text-sm font-medium hidden md:inline">
                          {user.firstName}
                        </span>
                      )}
                    </div>
                    <a href="/api/logout">
                      <Button variant="ghost" size="sm" data-testid="button-logout">
                        <LogOut className="w-4 h-4 mr-1" />
                        Logout
                      </Button>
                    </a>
                  </div>
                ) : (
                  <a href="/api/login" className="ml-2 pl-2 border-l">
                    <Button variant="outline" size="sm" data-testid="button-login">
                      <LogIn className="w-4 h-4 mr-1" />
                      Developer Login
                    </Button>
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    </Card>
  );
}
