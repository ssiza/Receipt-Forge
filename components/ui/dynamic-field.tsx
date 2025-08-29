'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldDefinition } from '@/lib/types/receipt';

interface DynamicFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  className?: string;
}

export function DynamicField({ field, value, onChange, error, className }: DynamicFieldProps) {
  const handleChange = (newValue: any) => {
    // Convert value based on field type
    let convertedValue = newValue;
    if (field.type === 'number') {
      // Handle empty string and NaN values
      if (newValue === '' || isNaN(Number(newValue))) {
        convertedValue = 0;
      } else {
        convertedValue = Number(newValue);
      }
    }
    onChange(convertedValue);
  };

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type === 'email' ? 'email' : 'text'}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={className}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value === undefined || value === null || value === '' ? '' : value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            step="0.01"
            className={className}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={className}
          />
        );
      
      case 'select':
        return (
          <Select value={value || ''} onValueChange={handleChange}>
            <SelectTrigger className={className}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={className}
          />
        );
      
      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={className}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
} 