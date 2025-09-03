'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, Plus, Trash2, Building2, User, Package, Calculator, FileText, GripVertical, X, Settings } from 'lucide-react';
import useSWR from 'swr';

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.warn(`Failed to fetch ${url}:`, error);
    throw error;
  }
};

interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  [key: string]: any; // For dynamic fields
}

interface AdditionalField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  placeholder?: string;
  options?: string[]; // For select fields
  defaultValue?: any;
}

interface ReceiptFormData {
  issueDate: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  notes?: string;
  // Business info fields
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  // Additional fields
  dueDate?: string;
  paymentTerms?: string;
  reference?: string;
  // Item additional fields
  itemAdditionalFields: AdditionalField[];
  [key: string]: any; // For any additional custom fields
}

interface ReceiptFormProps {
  initialData?: ReceiptFormData;
  onSubmit: (data: ReceiptFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

export function ReceiptForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  disabled = false
}: ReceiptFormProps) {
  const [formData, setFormData] = useState<ReceiptFormData>(() => {
    const now = new Date();
    const defaultDueDate = new Date();
    defaultDueDate.setDate(now.getDate() + 30); // Default to 30 days from now
    
    const baseData: ReceiptFormData = {
      issueDate: now.toISOString().split('T')[0],
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      items: [{
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }],
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      currency: 'USD',
      status: 'draft',
      notes: '',
      businessName: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      dueDate: defaultDueDate.toISOString().split('T')[0],
      paymentTerms: 'Net 30',
      reference: '',
      itemAdditionalFields: [],
    };

    if (initialData) {
      // Convert null values to empty strings for form display
      const cleanedInitialData = {
        ...initialData,
        customerEmail: initialData.customerEmail || '',
        customerPhone: initialData.customerPhone || '',
        customerAddress: initialData.customerAddress || '',
        notes: initialData.notes || '',
        businessName: initialData.businessName || '',
        businessAddress: initialData.businessAddress || '',
        businessPhone: initialData.businessPhone || '',
        businessEmail: initialData.businessEmail || '',
        dueDate: initialData.dueDate || '',
        paymentTerms: initialData.paymentTerms || '',
        reference: initialData.reference || '',
        itemAdditionalFields: initialData.itemAdditionalFields || [],
      };
      return { ...baseData, ...cleanedInitialData };
    }

    return baseData;
  });

  // Fetch user's receipt preferences
  const { data: preferencesData } = useSWR<{ ok: boolean; data: any }>('/api/receipt-preferences', fetcher, {
    onError: (err) => {
      console.warn('Failed to fetch receipt preferences:', err);
    }
  });

  // Update form data with user preferences when they load
  useEffect(() => {
    if (preferencesData?.data && !initialData) {
      setFormData(prev => ({
        ...prev,
        businessName: preferencesData.data.businessName || prev.businessName,
        businessAddress: preferencesData.data.businessAddress || prev.businessAddress,
        businessPhone: preferencesData.data.businessPhone || prev.businessPhone,
        businessEmail: preferencesData.data.businessEmail || prev.businessEmail,
      }));
    }
  }, [preferencesData, initialData]);

  // Debug logging for initial data
  useEffect(() => {
    if (initialData) {
      console.log('ReceiptForm - Initial data loaded:', {
        itemAdditionalFields: initialData.itemAdditionalFields,
        items: initialData.items,
        hasInitialData: !!initialData
      });
    }
  }, [initialData]);

  // Calculate totals whenever items change
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalAmount = subtotal + formData.taxAmount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      totalAmount
    }));
  }, [formData.items, formData.taxAmount]);

  // Predefined additional fields that users can choose from
  const availableAdditionalFields: AdditionalField[] = [
    { id: 'weight', name: 'weight', label: 'Weight (kg)', type: 'number', placeholder: '0.00' },
    { id: 'dimensions', name: 'dimensions', label: 'Dimensions', type: 'text', placeholder: 'L x W x H' },
    { id: 'sku', name: 'sku', label: 'SKU', type: 'text', placeholder: 'Stock keeping unit' },
    { id: 'hoursWorked', name: 'hoursWorked', label: 'Hours Worked', type: 'number', placeholder: '0.00' },
    { id: 'hourlyRate', name: 'hourlyRate', label: 'Hourly Rate', type: 'number', placeholder: '0.00' },
    { id: 'serviceDate', name: 'serviceDate', label: 'Service Date', type: 'date' },
    { id: 'location', name: 'location', label: 'Location', type: 'text', placeholder: 'Service location' },
    { id: 'trackingNumber', name: 'trackingNumber', label: 'Tracking Number', type: 'text', placeholder: 'Tracking number' },
    { id: 'variant', name: 'variant', label: 'Variant', type: 'text', placeholder: 'Color, size, etc.' },
  ];

  const addAdditionalField = (field: AdditionalField) => {
    if (formData.itemAdditionalFields.length >= 3) {
      // Show warning and prevent action
      alert('Maximum of 3 additional fields allowed. Please remove a field before adding a new one.');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      itemAdditionalFields: [...prev.itemAdditionalFields, field]
    }));
  };

  const removeAdditionalField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      itemAdditionalFields: prev.itemAdditionalFields.filter(field => field.id !== fieldId),
      items: prev.items.map(item => {
        const newItem = { ...item };
        delete newItem[fieldId];
        return newItem;
      })
    }));
  };

  const reorderAdditionalFields = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const newFields = [...prev.itemAdditionalFields];
      const [movedField] = newFields.splice(fromIndex, 1);
      newFields.splice(toIndex, 0, movedField);
      return {
        ...prev,
        itemAdditionalFields: newFields
      };
    });
  };

  const addItem = () => {
    const newId = (formData.items.length + 1).toString();
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        id: newId, 
        description: '', 
        quantity: 1, 
        unitPrice: 0, 
        totalPrice: 0 
      }]
    }));
  };

  const removeItem = (id: string) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }
  };

  const updateItem = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate total price
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if disabled
    if (disabled) {
      alert('Monthly limit reached. Upgrade to create more receipts.');
      return;
    }
    
    // Filter out empty items
    const filteredItems = formData.items.filter(item => 
      item.description.trim() !== '' || item.quantity > 0 || item.unitPrice > 0
    );
    
    const submitData = {
      ...formData,
      items: filteredItems.length > 0 ? filteredItems : [{ 
        id: '1', 
        description: 'Item', 
        quantity: 1, 
        unitPrice: 0, 
        totalPrice: 0 
      }]
    };
    
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Information */}
      <CollapsibleSection title="Business Information" icon={<Building2 className="h-5 w-5" />}>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 mb-2">
            <strong>ℹ️ Using your saved business information</strong>
          </p>
          <p className="text-xs text-blue-600">
            This information is pulled from your account settings. To update it, go to <strong>Dashboard → General Settings</strong>.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={formData.businessName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
              placeholder="Your Business Name"
              className={preferencesData?.data?.businessName ? "bg-gray-50" : ""}
            />
            {preferencesData?.data?.businessName && (
              <p className="text-xs text-gray-500 mt-1">From your settings</p>
            )}
          </div>
          <div>
            <Label htmlFor="businessEmail">Business Email</Label>
            <Input
              id="businessEmail"
              type="email"
              value={formData.businessEmail || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
              placeholder="business@example.com"
              className={preferencesData?.data?.businessEmail ? "bg-gray-50" : ""}
            />
            {preferencesData?.data?.businessEmail && (
              <p className="text-xs text-gray-500 mt-1">From your settings</p>
            )}
          </div>
          <div>
            <Label htmlFor="businessPhone">Business Phone</Label>
            <Input
              id="businessPhone"
              value={formData.businessPhone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
              className={preferencesData?.data?.businessPhone ? "bg-gray-50" : ""}
            />
            {preferencesData?.data?.businessPhone && (
              <p className="text-xs text-gray-500 mt-1">From your settings</p>
            )}
          </div>
          <div>
            <Label htmlFor="businessAddress">Business Address</Label>
            <Input
              id="businessAddress"
              value={formData.businessAddress || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
              placeholder="123 Business St, City, State 12345"
              className={preferencesData?.data?.businessAddress ? "bg-gray-50" : ""}
            />
            {preferencesData?.data?.businessAddress && (
              <p className="text-xs text-gray-500 mt-1">From your settings</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Customer Information */}
      <CollapsibleSection title="Customer Information" icon={<User className="h-5 w-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="Customer Name"
              required
            />
          </div>
          <div>
            <Label htmlFor="customerEmail">Customer Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
              placeholder="customer@example.com"
            />
          </div>
          <div>
            <Label htmlFor="customerPhone">Customer Phone</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="customerAddress">Customer Address</Label>
            <Input
              id="customerAddress"
              value={formData.customerAddress || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
              placeholder="123 Customer St, City, State 12345"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Receipt Details */}
      <CollapsibleSection title="Receipt Details" icon={<FileText className="h-5 w-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="issueDate">Issue Date *</Label>
            <Input
              id="issueDate"
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="AUD">AUD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reference">Reference/PO Number</Label>
            <Input
              id="reference"
              value={formData.reference || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="PO-12345"
            />
          </div>
          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Input
              id="paymentTerms"
              value={formData.paymentTerms || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
              placeholder="Net 30"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleSection>

      {/* Items/Services */}
      <CollapsibleSection title="Items & Services" icon={<Package className="h-5 w-5" />}>
        <div className="space-y-4">
          {/* Additional Fields Management */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Additional Item Fields</h4>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">
                  {formData.itemAdditionalFields.length}/3 fields
                </div>
                <Select
                  disabled={formData.itemAdditionalFields.length >= 3}
                  onValueChange={(value) => {
                    const field = availableAdditionalFields.find(f => f.id === value);
                    if (field && !formData.itemAdditionalFields.find(f => f.id === field.id)) {
                      addAdditionalField(field);
                    }
                  }}
                >
                  <SelectTrigger className={`w-48 ${formData.itemAdditionalFields.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue placeholder={formData.itemAdditionalFields.length >= 3 ? "Max fields reached" : "Select field to add"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAdditionalFields
                      .filter(field => !formData.itemAdditionalFields.find(f => f.id === field.id))
                      .map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {formData.itemAdditionalFields.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">Drag to reorder fields. They will appear in this order in your receipt.</p>
                {formData.itemAdditionalFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    <span className="text-sm font-medium flex-1">{field.label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAdditionalField(field.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {formData.itemAdditionalFields.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No additional fields added. Select a field to include fields like weight, SKU, hours worked, etc. (Max 3 fields)
              </p>
            )}
            
            {formData.itemAdditionalFields.length >= 3 && (
              <p className="text-sm text-amber-600 text-center py-2 bg-amber-50 rounded">
                Maximum of 3 additional fields reached. Remove a field to add a new one.
              </p>
            )}
          </div>

          {/* Items List */}
          {formData.items.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4">
              {/* Standard Fields */}
              <div className="grid grid-cols-12 gap-4 items-end mb-4">
                <div className="col-span-6">
                  <Label htmlFor={`description-${item.id}`}>Description</Label>
                  <Input
                    id={`description-${item.id}`}
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Item or service description"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`quantity-${item.id}`}>Qty</Label>
                  <Input
                    id={`quantity-${item.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`unitPrice-${item.id}`}>Unit Price</Label>
                  <Input
                    id={`unitPrice-${item.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1">
                  <Label>Total</Label>
                  <div className="text-sm font-medium p-2 bg-gray-50 rounded">
                    {formData.currency} {(item.totalPrice || 0).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    disabled={formData.items.length === 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Additional Fields */}
              {formData.itemAdditionalFields.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t">
                  {formData.itemAdditionalFields.map((field) => (
                    <div key={`${item.id}-${field.id}`}>
                      <Label htmlFor={`${item.id}-${field.id}`}>{field.label}</Label>
                      {field.type === 'number' && (
                        <Input
                          id={`${item.id}-${field.id}`}
                          type="number"
                          step="0.01"
                          value={item[field.name] || ''}
                          onChange={(e) => updateItem(item.id, field.name, parseFloat(e.target.value) || 0)}
                          placeholder={field.placeholder}
                        />
                      )}
                      {field.type === 'text' && (
                        <Input
                          id={`${item.id}-${field.id}`}
                          type="text"
                          value={item[field.name] || ''}
                          onChange={(e) => updateItem(item.id, field.name, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      )}
                      {field.type === 'date' && (
                        <Input
                          id={`${item.id}-${field.id}`}
                          type="date"
                          value={item[field.name] || ''}
                          onChange={(e) => updateItem(item.id, field.name, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </CollapsibleSection>

      {/* Totals */}
      <CollapsibleSection title="Totals" icon={<Calculator className="h-5 w-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="subtotal">Subtotal</Label>
              <div className="text-lg font-medium">
                {formData.currency} {formData.subtotal.toFixed(2)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="taxAmount">Tax Amount</Label>
              <Input
                id="taxAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.taxAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, taxAmount: parseFloat(e.target.value) || 0 }))}
                className="w-32"
              />
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{formData.currency} {formData.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              placeholder="Additional notes, terms, or special instructions..."
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || disabled} 
          className={`${
            disabled 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
          title={disabled ? 'Monthly limit reached. Upgrade to create more receipts.' : 'Save receipt'}
        >
          {isSubmitting ? 'Saving...' : disabled ? 'Limit Reached' : 'Save Receipt'}
        </Button>
      </div>
    </form>
  );
} 