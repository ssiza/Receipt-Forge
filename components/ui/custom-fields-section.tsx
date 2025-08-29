'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicField } from '@/components/ui/dynamic-field';
import { CustomField } from '@/lib/types/receipt';

interface CustomFieldsSectionProps {
  fields: CustomField[];
  values: Record<string, any>;
  onFieldChange: (fieldName: string, value: any) => void;
  title: string;
  icon?: React.ReactNode;
}

export function CustomFieldsSection({ 
  fields, 
  values, 
  onFieldChange, 
  title, 
  icon 
}: CustomFieldsSectionProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <DynamicField
              key={field.id}
              field={field}
              value={values[field.name]}
              onChange={(value) => onFieldChange(field.name, value)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 