import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import Landing from "@/pages/Landing";
import BatchUpload from "@/pages/BatchUpload";
import WidgetDemo from "@/pages/WidgetDemo";
import WidgetIntegration from "@/pages/WidgetIntegration";
import Pricing from "@/pages/Pricing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/batch" component={BatchUpload} />
      <Route path="/widget-demo" component={WidgetDemo} />
      <Route path="/widget-integration" component={WidgetIntegration} />
      <Route path="/pricing" component={Pricing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const showNavigation = location !== "/";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-primary/20 via-primary/5 to-background">
          <div className="container mx-auto px-4 py-2">
            {showNavigation && <Navigation />}
            <Router />
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
