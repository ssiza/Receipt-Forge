'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

interface TotalsSectionProps {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  onTaxAmountChange: (taxAmount: number) => void;
}

export function TotalsSection({ 
  subtotal, 
  taxAmount, 
  totalAmount, 
  onTaxAmountChange 
}: TotalsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Totals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="subtotal">Subtotal</Label>
            <Input
              id="subtotal"
              type="number"
              value={subtotal}
              readOnly
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="taxAmount">Tax Amount</Label>
            <Input
              id="taxAmount"
              type="number"
              value={taxAmount}
              onChange={(e) => {
                const newTaxAmount = Number(e.target.value) || 0;
                onTaxAmountChange(newTaxAmount);
              }}
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <Label htmlFor="totalAmount">Total Amount</Label>
            <Input
              id="totalAmount"
              type="number"
              value={totalAmount}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 