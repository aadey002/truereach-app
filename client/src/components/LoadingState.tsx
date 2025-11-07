import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
  progress?: string;
}

export default function LoadingState({ 
  message = "Validating phone numbers...", 
  progress 
}: LoadingStateProps) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{message}</h2>
          {progress && (
            <p className="text-muted-foreground" data-testid="text-progress">{progress}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
