export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'email' | 'phone';

export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface LineItemField extends FieldDefinition {
  affectsCalculation?: boolean; // Whether this field affects the total calculation
  calculationFormula?: string; // Formula for calculation (e.g., "weight * rate")
}

export interface CustomField extends FieldDefinition {
  section: 'header' | 'footer'; // Whether this field appears in header or footer
  order: number; // Order within the section
}

export interface BusinessTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  lineItemFields: LineItemField[];
  customFields: CustomField[];
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  [key: string]: any; // For dynamic fields
}

export interface ReceiptFormData {
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
  // Business information fields
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  // Additional fields
  dueDate?: string;
  paymentTerms?: string;
  reference?: string;
  // Item additional fields
  itemAdditionalFields?: Array<{
    id: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: string[];
  }>;
}

export interface Receipt {
  id: string;
  teamId: number;
  receiptNumber: string;
  issueDate: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  items: ReceiptItem[];
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  status: string;
  notes?: string | null;
  // Business information fields
  businessName?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  // Additional fields
  dueDate?: string | null;
  paymentTerms?: string | null;
  reference?: string | null;
  // Item additional fields
  itemAdditionalFields?: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
  }> | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Predefined business templates
export const DEFAULT_BUSINESS_TEMPLATES: Omit<BusinessTemplate, 'id'>[] = [
  {
    name: 'General',
    description: 'Standard receipt template with basic fields',
    isDefault: true,
    lineItemFields: [
      {
        id: 'description',
        name: 'description',
        label: 'Description',
        type: 'text',
        required: true,
        placeholder: 'Item description'
      },
      {
        id: 'quantity',
        name: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true,
        defaultValue: 1,
        validation: { min: 1 }
      },
      {
        id: 'unitPrice',
        name: 'unitPrice',
        label: 'Unit Price',
        type: 'number',
        required: true,
        defaultValue: 0,
        validation: { min: 0 },
        affectsCalculation: true
      }
    ],
    customFields: []
  },
  {
    name: 'Shipping & Logistics',
    description: 'Template for shipping and logistics businesses',
    isDefault: false,
    lineItemFields: [
      {
        id: 'description',
        name: 'description',
        label: 'Description',
        type: 'text',
        required: true,
        placeholder: 'Item description'
      },
      {
        id: 'quantity',
        name: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true,
        defaultValue: 1,
        validation: { min: 1 }
      },
      {
        id: 'weight',
        name: 'weight',
        label: 'Weight (kg)',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'dimensions',
        name: 'dimensions',
        label: 'Dimensions (LxWxH)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 10x5x3 cm'
      },
      {
        id: 'trackingNumber',
        name: 'trackingNumber',
        label: 'Tracking Number',
        type: 'text',
        required: false,
        placeholder: 'Tracking number'
      },
      {
        id: 'unitPrice',
        name: 'unitPrice',
        label: 'Unit Price',
        type: 'number',
        required: true,
        defaultValue: 0,
        validation: { min: 0 },
        affectsCalculation: true
      }
    ],
    customFields: [
      {
        id: 'purchaseOrder',
        name: 'purchaseOrder',
        label: 'Purchase Order #',
        type: 'text',
        required: false,
        section: 'header',
        order: 1
      },
      {
        id: 'deliveryInstructions',
        name: 'deliveryInstructions',
        label: 'Delivery Instructions',
        type: 'textarea',
        required: false,
        section: 'footer',
        order: 1
      }
    ]
  },
  {
    name: 'Professional Services',
    description: 'Template for consulting, photography, and other professional services',
    isDefault: false,
    lineItemFields: [
      {
        id: 'description',
        name: 'description',
        label: 'Service Description',
        type: 'text',
        required: true,
        placeholder: 'Service description'
      },
      {
        id: 'hoursWorked',
        name: 'hoursWorked',
        label: 'Hours Worked',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'serviceDate',
        name: 'serviceDate',
        label: 'Service Date',
        type: 'date',
        required: false
      },
      {
        id: 'location',
        name: 'location',
        label: 'Location',
        type: 'text',
        required: false,
        placeholder: 'Service location'
      },
      {
        id: 'rate',
        name: 'rate',
        label: 'Hourly Rate',
        type: 'number',
        required: false,
        defaultValue: 0,
        validation: { min: 0 }
      },
      {
        id: 'unitPrice',
        name: 'unitPrice',
        label: 'Total Price',
        type: 'number',
        required: true,
        defaultValue: 0,
        validation: { min: 0 },
        affectsCalculation: true
      }
    ],
    customFields: [
      {
        id: 'projectName',
        name: 'projectName',
        label: 'Project Name',
        type: 'text',
        required: false,
        section: 'header',
        order: 1
      },
      {
        id: 'clientAccount',
        name: 'clientAccount',
        label: 'Client Account #',
        type: 'text',
        required: false,
        section: 'header',
        order: 2
      },
      {
        id: 'terms',
        name: 'terms',
        label: 'Payment Terms',
        type: 'text',
        required: false,
        section: 'footer',
        order: 1
      }
    ]
  },
  {
    name: 'Retail',
    description: 'Template for retail businesses with SKU and variant tracking',
    isDefault: false,
    lineItemFields: [
      {
        id: 'description',
        name: 'description',
        label: 'Product Name',
        type: 'text',
        required: true,
        placeholder: 'Product name'
      },
      {
        id: 'sku',
        name: 'sku',
        label: 'SKU',
        type: 'text',
        required: false,
        placeholder: 'Stock keeping unit'
      },
      {
        id: 'variant',
        name: 'variant',
        label: 'Variant',
        type: 'text',
        required: false,
        placeholder: 'Color, size, etc.'
      },
      {
        id: 'quantity',
        name: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true,
        defaultValue: 1,
        validation: { min: 1 }
      },
      {
        id: 'unitPrice',
        name: 'unitPrice',
        label: 'Unit Price',
        type: 'number',
        required: true,
        defaultValue: 0,
        validation: { min: 0 },
        affectsCalculation: true
      }
    ],
    customFields: [
      {
        id: 'customerAccount',
        name: 'customerAccount',
        label: 'Customer Account #',
        type: 'text',
        required: false,
        section: 'header',
        order: 1
      },
      {
        id: 'loyaltyNumber',
        name: 'loyaltyNumber',
        label: 'Loyalty Number',
        type: 'text',
        required: false,
        section: 'header',
        order: 2
      }
    ]
  }
]; 