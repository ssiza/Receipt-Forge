import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 20,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  receiptInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  receiptNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  customFieldsHeader: {
    marginTop: 15,
    marginBottom: 10,
  },
  customField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  customFieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  customFieldValue: {
    fontSize: 12,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    marginBottom: 30,
  },
  itemsTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: 8,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #f3f4f6',
    paddingVertical: 8,
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '2px solid #e5e7eb',
    paddingTop: 15,
    marginTop: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  customFieldsSection: {
    marginTop: 20,
    marginBottom: 20,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 15,
  },
  customFieldsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
  },
  customFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  customFieldRowLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  customFieldRowValue: {
    fontSize: 12,
    color: '#6b7280',
  },
  footer: {
    marginTop: 'auto',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 20,
  },
  thankYou: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactInfo: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.4,
  },
});

interface LineItemField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  validation?: any;
  affectsCalculation?: boolean;
}

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  section: 'header' | 'footer';
  order: number;
}

interface BusinessTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  lineItemFields: LineItemField[];
  customFields: CustomField[];
}

interface ReceiptPDFProps {
  businessName?: string;
  receiptNumber: string;
  date: string;
  items: Array<Record<string, any>>;
  total: number;
  footerThankYouText?: string;
  footerContactInfo?: string;
  businessTemplate?: BusinessTemplate;
  customFields?: Record<string, any>;
}

const ReceiptPDF: React.FC<ReceiptPDFProps> = ({
  businessName = 'Your Business Name',
  receiptNumber,
  date,
  items,
  total,
  footerThankYouText = 'Thank you for your business!',
  footerContactInfo = 'This receipt serves as proof of payment. For questions, please contact us at support@yourbusiness.com',
  businessTemplate,
  customFields = {},
}) => {
  // Get line item fields from template or use defaults
  const lineItemFields = businessTemplate?.lineItemFields || [
    { id: 'description', label: 'Description', name: 'description', type: 'text', required: true },
    { id: 'amount', label: 'Amount', name: 'amount', type: 'number', required: true }
  ];

  // Get custom fields from template
  const templateCustomFields = businessTemplate?.customFields || [];

  // Filter header custom fields
  const headerCustomFields = templateCustomFields
    .filter(field => field.section === 'header')
    .sort((a, b) => a.order - b.order);

  // Filter footer custom fields
  const footerCustomFields = templateCustomFields
    .filter(field => field.section === 'footer')
    .sort((a, b) => a.order - b.order);

  // Create dynamic table column styles
  const createColumnStyle = (index: number, total: number) => ({
    flex: index === 0 ? 2 : 1, // First column (description) gets more space
    paddingRight: index < total - 1 ? 10 : 0,
    textAlign: (index === total - 1 ? 'right' : 'left') as 'left' | 'right',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.businessName}>{businessName}</Text>
          <View style={styles.receiptInfo}>
            <Text style={styles.receiptNumber}>Receipt #{receiptNumber}</Text>
            <Text style={styles.date}>{new Date(date).toLocaleDateString()}</Text>
          </View>
          
          {/* Header Custom Fields */}
          {headerCustomFields.length > 0 && (
            <View style={styles.customFieldsHeader}>
              {headerCustomFields.map((field) => {
                const value = customFields[field.name];
                if (!value) return null;
                
                return (
                  <View key={field.id} style={styles.customField}>
                    <Text style={styles.customFieldLabel}>{field.label}:</Text>
                    <Text style={styles.customFieldValue}>{value}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Items Table */}
          <View style={styles.itemsTable}>
            <View style={styles.tableHeader}>
              {lineItemFields.map((field, index) => (
                <Text 
                  key={field.id} 
                  style={createColumnStyle(index, lineItemFields.length)}
                >
                  {field.label}
                </Text>
              ))}
            </View>
            
            {items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.tableRow}>
                {lineItemFields.map((field, fieldIndex) => {
                  const value = item[field.name];
                  const displayValue = field.type === 'number' && value 
                    ? `$${parseFloat(value).toFixed(2)}`
                    : value || '';
                  
                  return (
                    <Text 
                      key={field.id} 
                      style={createColumnStyle(fieldIndex, lineItemFields.length)}
                    >
                      {displayValue}
                    </Text>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Total */}
          <View style={styles.total}>
            <Text>Total</Text>
            <Text>${total.toFixed(2)}</Text>
          </View>

          {/* Footer Custom Fields */}
          {footerCustomFields.length > 0 && (
            <View style={styles.customFieldsSection}>
              <Text style={styles.customFieldsTitle}>Additional Information</Text>
              {footerCustomFields.map((field) => {
                const value = customFields[field.name];
                if (!value) return null;
                
                return (
                  <View key={field.id} style={styles.customFieldRow}>
                    <Text style={styles.customFieldRowLabel}>{field.label}:</Text>
                    <Text style={styles.customFieldRowValue}>{value}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thankYou}>{footerThankYouText}</Text>
          <Text style={styles.contactInfo}>{footerContactInfo}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReceiptPDF; 