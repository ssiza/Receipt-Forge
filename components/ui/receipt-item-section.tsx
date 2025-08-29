'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { ReceiptItem, LineItemField } from '@/lib/types/receipt';

interface ReceiptItemSectionProps {
  items: ReceiptItem[];
  fields: LineItemField[];
  onItemsChange: (items: ReceiptItem[]) => void;
  onSubtotalChange: (subtotal: number) => void;
}

export function ReceiptItemSection({ 
  items, 
  fields, 
  onItemsChange, 
  onSubtotalChange 
}: ReceiptItemSectionProps) {
  // Validate props
  if (!items || !Array.isArray(items)) {
    console.warn('ReceiptItemSection: items prop is not a valid array');
    return null;
  }

  if (!fields || !Array.isArray(fields)) {
    console.warn('ReceiptItemSection: fields prop is not a valid array');
    return null;
  }
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  // Create a new empty item with default values
  const createEmptyItem = (): ReceiptItem => {
    const item: ReceiptItem = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };

    // Set default values from field definitions
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        item[field.name] = field.defaultValue;
      }
    });

    return item;
  };

  // Add a new item
  const addItem = () => {
    try {
      const newItem = createEmptyItem();
      const newItems = [...items, newItem];
      onItemsChange(newItems);
      updateSubtotal(newItems);
    } catch (error) {
      console.error('ReceiptItemSection: Error adding item', error);
    }
  };

  // Remove an item
  const removeItem = (index: number) => {
    try {
      if (items.length <= 1) return; // Keep at least one item
      if (index < 0 || index >= items.length) {
        console.warn('ReceiptItemSection: Invalid item index for removal', index);
        return;
      }
      const newItems = items.filter((_, i) => i !== index);
      onItemsChange(newItems);
      updateSubtotal(newItems);
      
      // Clear errors for removed item
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    } catch (error) {
      console.error('ReceiptItemSection: Error removing item', error);
    }
  };

  // Update a specific field in an item
  const updateItemField = (index: number, fieldName: string, value: any) => {
    try {
      if (index < 0 || index >= items.length) {
        console.warn('ReceiptItemSection: Invalid item index', index);
        return;
      }

      const newItems = [...items];
      const item = { ...newItems[index] };
      
      // Convert value based on field type
      const field = fields.find(f => f.name === fieldName);
      if (field?.type === 'number') {
        item[fieldName] = value === '' ? 0 : Number(value);
      } else {
        item[fieldName] = value;
      }

      // Recalculate total price for this item
      if (fieldName === 'quantity' || fieldName === 'unitPrice') {
        const quantity = fieldName === 'quantity' ? item[fieldName] : item.quantity || 0;
        const unitPrice = fieldName === 'unitPrice' ? item[fieldName] : item.unitPrice || 0;
        item.totalPrice = quantity * unitPrice;
      }

      newItems[index] = item;
      onItemsChange(newItems);
      updateSubtotal(newItems);

      // Clear error for this field
      const newErrors = { ...errors };
      if (newErrors[index]) {
        delete newErrors[index][fieldName];
        if (Object.keys(newErrors[index]).length === 0) {
          delete newErrors[index];
        }
      }
      setErrors(newErrors);
    } catch (error) {
      console.error('ReceiptItemSection: Error updating item field', error);
    }
  };

  // Update subtotal and notify parent
  const updateSubtotal = (itemsToCalculate: ReceiptItem[]) => {
    const subtotal = itemsToCalculate.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    onSubtotalChange(subtotal);
  };

  // Validate a field
  const validateField = (index: number, fieldName: string, value: any) => {
    const field = fields.find(f => f.name === fieldName);
    if (!field) return;

    const newErrors = { ...errors };
    if (!newErrors[index]) newErrors[index] = {};

    // Required field validation
    if (field.required && (!value || value === '')) {
      newErrors[index][fieldName] = `${field.label} is required`;
    } else if (field.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        newErrors[index][fieldName] = `${field.label} must be a number`;
      } else if (field.validation?.min !== undefined && numValue < field.validation.min) {
        newErrors[index][fieldName] = `${field.label} must be at least ${field.validation.min}`;
      } else if (field.validation?.max !== undefined && numValue > field.validation.max) {
        newErrors[index][fieldName] = `${field.label} must be at most ${field.validation.max}`;
      } else {
        delete newErrors[index][fieldName];
      }
    } else {
      delete newErrors[index][fieldName];
    }

    if (Object.keys(newErrors[index]).length === 0) {
      delete newErrors[index];
    }
    setErrors(newErrors);
  };

  // Handle field change with validation
  const handleFieldChange = (index: number, fieldName: string, value: any) => {
    updateItemField(index, fieldName, value);
    validateField(index, fieldName, value);
  };

  // Render a single field
  const renderField = (field: LineItemField, item: ReceiptItem, index: number) => {
    if (!field || !field.name) {
      console.warn('ReceiptItemSection: Invalid field definition', field);
      return null;
    }
    
    const value = item[field.name];
    const error = errors[index]?.[field.name];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={`${field.name}-${index}`} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`${field.name}-${index}`}
              type={field.type === 'email' ? 'email' : 'text'}
              value={value || ''}
              onChange={(e) => handleFieldChange(index, field.name, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={`${field.name}-${index}`} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`${field.name}-${index}`}
              type="number"
              value={value === undefined || value === null || value === '' ? '' : value}
              onChange={(e) => handleFieldChange(index, field.name, e.target.value)}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              step={field.name === 'unitPrice' ? '0.01' : '1'}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={`${field.name}-${index}`} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`${field.name}-${index}`}
              type="date"
              value={value || ''}
              onChange={(e) => handleFieldChange(index, field.name, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={`${field.name}-${index}`} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`${field.name}-${index}`}
              type="text"
              value={value || ''}
              onChange={(e) => handleFieldChange(index, field.name, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Items
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-4 bg-gray-50/50"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeItem(index)}
                disabled={items.length <= 1}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map((field) => renderField(field, item, index))}
            </div>

            {/* Item Total */}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Item Total:</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${(item.totalPrice || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Summary */}
        {items.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Subtotal:</span>
              <span className="text-lg font-semibold text-gray-900">
                ${items.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 