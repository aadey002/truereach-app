import { CheckCircle, XCircle, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface PhoneValidationResult {
  phone: string;
  valid: boolean;
  phone_type: string;
  can_receive_sms: boolean;
  carrier: string;
}

export interface ValidationResultsProps {
  results: PhoneValidationResult[];
  validCount: number;
  invalidCount: number;
  smsCount: number;
}

export default function ValidationResults({
  results,
  validCount,
  invalidCount,
  smsCount,
}: ValidationResultsProps) {
  return (
    <div className="space-y-8" data-testid="validation-results">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex flex-col items-center text-center gap-3">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <div>
              <h3 className="text-4xl font-bold" data-testid="text-valid-count">{validCount}</h3>
              <p className="text-muted-foreground mt-1">Valid Numbers</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex flex-col items-center text-center gap-3">
            <XCircle className="w-12 h-12 text-red-500" />
            <div>
              <h3 className="text-4xl font-bold" data-testid="text-invalid-count">{invalidCount}</h3>
              <p className="text-muted-foreground mt-1">Invalid Numbers</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex flex-col items-center text-center gap-3">
            <Smartphone className="w-12 h-12 text-blue-500" />
            <div>
              <h3 className="text-4xl font-bold" data-testid="text-sms-count">{smsCount}</h3>
              <p className="text-muted-foreground mt-1">Can Receive SMS</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="text-primary-foreground font-semibold">Phone Number</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Status</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Type</TableHead>
                <TableHead className="text-primary-foreground font-semibold">SMS</TableHead>
                <TableHead className="text-primary-foreground font-semibold">Carrier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index} data-testid={`row-result-${index}`}>
                  <TableCell className="font-medium">{result.phone}</TableCell>
                  <TableCell>
                    {result.valid ? (
                      <span className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Valid
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-4 h-4" />
                        Invalid
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{result.phone_type}</TableCell>
                  <TableCell>
                    {result.can_receive_sms ? (
                      <span className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-4 h-4" />
                        No
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{result.carrier}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
