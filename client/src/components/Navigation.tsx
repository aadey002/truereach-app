import { useState } from "react";
import { Link, useLocation } from "wouter";
import { FileText, Zap, DollarSign, Code, LogIn, LogOut, User, Menu, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import logoUrl from "@assets/image_1762494775992.png";

export function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicLinks = [
    { href: "/batch", label: "Batch Upload", icon: FileText },
    { href: "/widget-demo", label: "Instant validation", icon: Zap },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
  ];

  const devLinks = isAuthenticated ? [
    { href: "/developer-docs", label: "Developer Docs", icon: Code },
  ] : [];

  const allLinks = [...publicLinks, ...devLinks];

  return (
    <Card className="mb-4 md:mb-8">
      <nav className="p-2 md:p-4">
        <div className="flex justify-between items-center gap-2 md:gap-4">
          <Link href="/">
            <img src={logoUrl} alt="TrueReach - Verify. Connect. Care!" className="h-20 md:h-32 lg:h-40 cursor-pointer" />
          </Link>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>

          <div className="hidden md:flex items-center gap-2 flex-wrap">
            {allLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
              >
                <span
                  data-testid={`link-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-md font-semibold transition-colors hover-elevate cursor-pointer text-sm lg:text-base ${
                    location === href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                  <span className="lg:hidden">{label.split(' ')[0]}</span>
                </span>
              </Link>
            ))}
            
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center gap-2 lg:gap-3 ml-2 pl-2 border-l">
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
                        <span className="text-sm font-medium hidden lg:inline">
                          {user.firstName}
                        </span>
                      )}
                    </div>
                    <a href="/api/logout">
                      <Button variant="ghost" size="sm" data-testid="button-logout">
                        <LogOut className="w-4 h-4 lg:mr-1" />
                        <span className="hidden lg:inline">Logout</span>
                      </Button>
                    </a>
                  </div>
                ) : (
                  <a href="/api/login" className="ml-2 pl-2 border-l">
                    <Button variant="outline" size="sm" data-testid="button-login">
                      <LogIn className="w-4 h-4 lg:mr-1" />
                      <span className="hidden lg:inline">Developer Login</span>
                    </Button>
                  </a>
                )}
              </>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t space-y-2">
            {allLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span
                  data-testid={`link-mobile-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md font-semibold transition-colors ${
                    location === href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </span>
              </Link>
            ))}
            
            {!isLoading && (
              <div className="pt-2 border-t mt-2">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {user?.profileImageUrl && (
                          <AvatarImage src={user.profileImageUrl} alt={user.firstName || 'User'} />
                        )}
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user?.firstName || 'User'}</span>
                    </div>
                    <a href="/api/logout">
                      <Button variant="ghost" size="sm" data-testid="button-mobile-logout">
                        <LogOut className="w-4 h-4 mr-1" />
                        Logout
                      </Button>
                    </a>
                  </div>
                ) : (
                  <a href="/api/login" className="block px-4 py-2">
                    <Button variant="outline" className="w-full" data-testid="button-mobile-login">
                      <LogIn className="w-4 h-4 mr-2" />
                      Developer Login
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </nav>
    </Card>
  );
}
