import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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

interface ReceiptPreferences {
  businessName?: string;
  businessAddress?: string;
  logoUrl?: string;
  tableColor?: string;
  footerThankYouText?: string;
  footerContactInfo?: string;
}

interface BrandedReceiptPDFProps {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  logoUrl?: string;
  tableColor?: string;
  receiptNumber: string;
  issueDate: string;
  dueDate?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: Array<Record<string, any>>;
  subtotal: number;
  discount?: number;
  taxAmount: number;
  total: number;
  footerThankYouText?: string;
  footerContactInfo?: string;
  businessTemplate?: BusinessTemplate;
  customFields?: Record<string, any>;
  currency?: string;
  status?: string;
  notes?: string;
  paymentTerms?: string;
  reference?: string;
  itemAdditionalFields?: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
  }>;
  // Full receipt object for maximum flexibility
  receipt?: Record<string, any>;
}

const BrandedReceiptPDF: React.FC<BrandedReceiptPDFProps> = ({
  businessName = 'Your Business Name',
  businessAddress,
  businessPhone,
  businessEmail,
  logoUrl,
  tableColor = '#ff6b35', // Vibrant orange accent for Apple-inspired design
  receiptNumber,
  issueDate,
  dueDate,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  items,
  subtotal,
  discount = 0,
  taxAmount,
  total,
  footerThankYouText = 'Thank you for choosing Gahins!',
  footerContactInfo = 'For questions, please contact us at support@yourbusiness.com or call us',
  businessTemplate,
  customFields = {},
  currency = 'USD',
  status,
  notes,
  paymentTerms,
  reference,
  itemAdditionalFields = [],
  receipt,
}) => {
  // Create minimalist Apple-inspired styles with compact spacing
  const dynamicStyles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      fontSize: 10,
      fontFamily: 'Helvetica',
      lineHeight: 1.5,
      padding: 0, // Remove page padding to allow color to start at top
    },
    // Extended top color section with curved bottom corners
    topColorSection: {
      backgroundColor: tableColor,
      paddingTop: 24,
      paddingBottom: 40,
      paddingHorizontal: 30,
      marginBottom: 32,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    // Clean header with minimal design
    header: {
      alignItems: 'center',
    },
    // Logo container with subtle styling
    logoContainer: {
      width: 80,
      height: 80,
      backgroundColor: '#ffffff',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      padding: 16,
      // Extremely subtle shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    logo: {
      maxWidth: 48,
      maxHeight: 48,
      objectFit: 'contain',
    },
    businessInfo: {
      alignItems: 'center',
    },
    businessName: {
      fontSize: 24,
      fontWeight: 'normal',
      color: '#ffffff',
      marginBottom: 12,
      fontFamily: 'Helvetica',
      letterSpacing: -0.3,
    },
    businessAddress: {
      fontSize: 12,
      color: '#ffffff',
      lineHeight: 1.4,
      marginBottom: 8,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
      textAlign: 'center',
      opacity: 0.9,
    },
    businessContactText: {
      fontSize: 11,
      color: '#ffffff',
      marginBottom: 0,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
      textAlign: 'center',
      opacity: 0.85,
    },
    // Content wrapper for white background content
    contentWrapper: {
      paddingHorizontal: 30,
    },
    // Status badge with minimal design
    statusSection: {
      alignItems: 'center',
      marginBottom: 28,
    },
    statusBadge: {
      backgroundColor: '#f2f2f7',
      color: '#1d1d1f',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 'normal',
      textTransform: 'uppercase',
      fontFamily: 'Helvetica',
      letterSpacing: 0.5,
    },
    // Receipt info with clean typography
    receiptInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 28,
      paddingBottom: 16,
      borderBottom: '1px solid #f2f2f7',
    },
    receiptNumber: {
      fontSize: 14,
      fontWeight: 'normal',
      color: '#1d1d1f',
      fontFamily: 'Helvetica',
    },
    receiptDate: {
      fontSize: 14,
      color: '#86868b',
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
    },
    // Customer and receipt details with compact spacing
    detailsSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 32,
    },
    customerSection: {
      flex: 1,
      marginRight: 40,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 'normal',
      color: '#1d1d1f',
      marginBottom: 12,
      fontFamily: 'Helvetica',
      letterSpacing: -0.2,
    },
    customerName: {
      fontSize: 15,
      fontWeight: 'normal',
      color: '#1d1d1f',
      marginBottom: 8,
      fontFamily: 'Helvetica',
    },
    customerDetails: {
      fontSize: 11,
      color: '#86868b',
      lineHeight: 1.5,
      marginBottom: 4,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
    },
    receiptDetails: {
      flex: 1,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 11,
      fontWeight: 'normal',
      color: '#86868b',
      marginRight: 12,
      fontFamily: 'Helvetica',
    },
    detailValue: {
      fontSize: 11,
      color: '#1d1d1f',
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
    },
    // Items table with pill-shaped design matching brand color
    itemsSection: {
      marginBottom: 32,
    },
    itemsTable: {
      border: `2px solid ${tableColor}`,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: '#ffffff',
      paddingBottom: 8,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: tableColor,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottom: '1px solid #f8f9fa',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: '#ffffff',
    },
    tableRowAlt: {
      flexDirection: 'row',
      borderBottom: '1px solid #f8f9fa',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: '#fafafa',
    },
    // Totals with clean typography
    totalsSection: {
      alignItems: 'flex-end',
      marginBottom: 32,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      minWidth: 240,
    },
    totalLabel: {
      fontSize: 12,
      color: '#86868b',
      fontWeight: 'normal',
      fontFamily: 'Helvetica',
    },
    totalValue: {
      fontSize: 12,
      color: '#1d1d1f',
      fontWeight: 'normal',
      fontFamily: 'Helvetica',
    },
    grandTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTop: '1px solid #f2f2f7',
    },
    grandTotalLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#1d1d1f',
      fontFamily: 'Helvetica',
      letterSpacing: -0.2,
    },
    grandTotalValue: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#1d1d1f',
      fontFamily: 'Helvetica',
      letterSpacing: -0.3,
    },
    // Notes section with minimal styling
    notesSection: {
      marginBottom: 32,
    },
    notesCard: {
      backgroundColor: '#f8f9fa',
      border: '1px solid #f2f2f7',
      borderRadius: 12,
      padding: 16,
    },
    notesTitle: {
      fontSize: 12,
      fontWeight: 'normal',
      color: '#1d1d1f',
      marginBottom: 8,
      fontFamily: 'Helvetica',
      letterSpacing: -0.2,
    },
    notesText: {
      fontSize: 11,
      color: '#86868b',
      lineHeight: 1.5,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
    },
    // Custom fields with clean design
    customFieldsSection: {
      marginBottom: 32,
      borderTop: '1px solid #f2f2f7',
      paddingTop: 24,
    },
    customFieldsTitle: {
      fontSize: 12,
      fontWeight: 'normal',
      color: '#1d1d1f',
      marginBottom: 12,
      fontFamily: 'Helvetica',
      letterSpacing: -0.2,
    },
    customFieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    customFieldLabel: {
      fontSize: 11,
      fontWeight: 'normal',
      color: '#86868b',
      fontFamily: 'Helvetica',
    },
    customFieldValue: {
      fontSize: 11,
      color: '#1d1d1f',
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
    },
    // Footer with minimal design
    footer: {
      borderTop: '1px solid #f2f2f7',
      paddingTop: 24,
      alignItems: 'center',
    },
    thankYou: {
      fontSize: 13,
      fontWeight: 'normal',
      color: '#1d1d1f',
      marginBottom: 8,
      textAlign: 'center',
      fontFamily: 'Helvetica',
      letterSpacing: -0.2,
    },
    contactInfo: {
      fontSize: 10,
      color: '#86868b',
      textAlign: 'center',
      lineHeight: 1.5,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
    },
  });

  // Dynamically determine all fields from the actual receipt data
  const getAllFieldsFromItems = () => {
    const allFields = new Set<string>();
    
    // Add standard fields
    allFields.add('description');
    allFields.add('quantity');
    allFields.add('unitPrice');
    allFields.add('totalPrice');
    
    // Add any additional fields from the receipt
    if (itemAdditionalFields && itemAdditionalFields.length > 0) {
      itemAdditionalFields.forEach(field => allFields.add(field.name));
    }
    
    // Scan all items for any additional fields that might exist
    items.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key && typeof key === 'string' && key !== 'id') {
          allFields.add(key);
        }
      });
    });
    
    // Also scan the full receipt object for any additional fields
    if (receipt) {
      Object.keys(receipt).forEach(key => {
        if (key && typeof key === 'string' && 
            !['id', 'teamId', 'receiptNumber', 'issueDate', 'customerName', 
              'customerEmail', 'customerPhone', 'customerAddress', 'items', 
              'subtotal', 'taxAmount', 'totalAmount', 'currency', 'status', 
              'notes', 'businessName', 'businessAddress', 'businessPhone', 
              'businessEmail', 'dueDate', 'paymentTerms', 'reference', 
              'itemAdditionalFields', 'createdAt', 'updatedAt'].includes(key)) {
          allFields.add(key);
        }
      });
    }
    
    return Array.from(allFields);
  };

  // Create field definitions dynamically
  const createFieldDefinition = (fieldName: string) => {
    // Standard field mappings
    const standardFields: Record<string, { label: string; type: string }> = {
      description: { label: 'Description', type: 'text' },
      quantity: { label: 'Qty', type: 'number' },
      unitPrice: { label: 'Unit Price', type: 'number' },
      totalPrice: { label: 'Amount', type: 'number' },
      price: { label: 'Price', type: 'number' },
      amount: { label: 'Amount', type: 'number' },
      weight: { label: 'Weight (kg)', type: 'number' },
      dimensions: { label: 'Dimensions', type: 'text' },
      sku: { label: 'SKU', type: 'text' },
      hoursWorked: { label: 'Hours', type: 'number' },
      hourlyRate: { label: 'Rate', type: 'number' },
      serviceDate: { label: 'Service Date', type: 'date' },
      location: { label: 'Location', type: 'text' },
      trackingNumber: { label: 'Tracking #', type: 'text' },
      variant: { label: 'Variant', type: 'text' },
      notes: { label: 'Notes', type: 'text' }
    };

    const fieldInfo = standardFields[fieldName] || {
      label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1'),
      type: 'text'
    };

    return {
      id: fieldName,
      name: fieldName,
      label: fieldInfo.label,
      type: fieldInfo.type
    };
  };

  // Get all unique fields from items and create field definitions
  const allFieldNames = getAllFieldsFromItems();
  const lineItemFields = allFieldNames.map(createFieldDefinition);

  // Get custom fields from template
  const templateCustomFields = businessTemplate?.customFields || [];
  const footerCustomFields = templateCustomFields
    .filter(field => field.section === 'footer')
    .sort((a, b) => a.order - b.order);

  // Ensure at least 2 empty rows and add 2 additional empty rows for spacing
  const displayItems = [...items];
  while (displayItems.length < 2) {
    displayItems.push({});
  }
  // Add 2 additional empty rows for spacing
  displayItems.push({}, {});

  // Create dynamic table column styles with better handling for multiple additional fields
  const createColumnStyle = (index: number, total: number) => {
    const isDescription = index === 0;
    const isPriceField = index >= total - 2; // Last two columns are typically price fields
    
    // Calculate flex based on field type and total number of fields
    let flex = 1;
    if (isDescription) {
      // Description gets more space, but less if we have many additional fields
      flex = total <= 4 ? 3 : total <= 5 ? 2.5 : 2;
    } else if (isPriceField) {
      // Price fields get standard space
      flex = 1;
    } else {
      // Additional fields get smaller space to prevent overflow
      flex = total <= 4 ? 1 : 0.8;
    }
    
    return {
      flex,
      paddingRight: index < total - 1 ? 10 : 0,
      textAlign: isPriceField ? 'right' as const : 'left' as const,
      fontSize: total > 5 ? 9 : 10,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
    };
  };

  return (
    <Document>
      <Page size="A4" style={dynamicStyles.page}>
        {/* Extended top color section with curved bottom corners */}
        <View style={dynamicStyles.topColorSection}>
          {/* Clean header with centered logo and business info */}
          <View style={dynamicStyles.header}>
            {logoUrl && (
              <View style={dynamicStyles.logoContainer}>
                <Image 
                  src={logoUrl} 
                  style={dynamicStyles.logo}
                  cache={false}
                />
              </View>
            )}
            <View style={dynamicStyles.businessInfo}>
              <Text style={dynamicStyles.businessName}>{businessName}</Text>
              {businessAddress && (
                <Text style={dynamicStyles.businessAddress}>{businessAddress}</Text>
              )}
              {(businessPhone || businessEmail) && (
                <Text style={dynamicStyles.businessContactText}>
                  {businessPhone && businessEmail 
                    ? `${businessPhone} | ${businessEmail}`
                    : businessPhone || businessEmail
                  }
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Content wrapper for white background content */}
        <View style={dynamicStyles.contentWrapper}>
          {/* Status badge */}
          <View style={dynamicStyles.statusSection}>
            <Text style={dynamicStyles.statusBadge}>
              {status ? status.toUpperCase() : 'PENDING'}
            </Text>
          </View>

          {/* Customer and Receipt Details with compact spacing */}
          <View style={dynamicStyles.detailsSection}>
            <View style={dynamicStyles.customerSection}>
              <Text style={dynamicStyles.sectionTitle}>Customer Information</Text>
              <Text style={dynamicStyles.customerName}>{customerName}</Text>
              {customerEmail && (
                <Text style={dynamicStyles.customerDetails}>{customerEmail}</Text>
              )}
              {customerPhone && (
                <Text style={dynamicStyles.customerDetails}>{customerPhone}</Text>
              )}
              {customerAddress && (
                <Text style={dynamicStyles.customerDetails}>{customerAddress}</Text>
              )}
            </View>
            <View style={dynamicStyles.receiptDetails}>
              <Text style={dynamicStyles.sectionTitle}>Receipt Details</Text>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Receipt Number:</Text>
                <Text style={dynamicStyles.detailValue}>#{receiptNumber}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Issue Date:</Text>
                <Text style={dynamicStyles.detailValue}>{new Date(issueDate).toLocaleDateString()}</Text>
              </View>
              {dueDate && (
                <View style={dynamicStyles.detailRow}>
                  <Text style={dynamicStyles.detailLabel}>Due Date:</Text>
                  <Text style={dynamicStyles.detailValue}>{new Date(dueDate).toLocaleDateString()}</Text>
                </View>
              )}
              {paymentTerms && (
                <View style={dynamicStyles.detailRow}>
                  <Text style={dynamicStyles.detailLabel}>Payment Terms:</Text>
                  <Text style={dynamicStyles.detailValue}>{paymentTerms}</Text>
                </View>
              )}
              {reference && (
                <View style={dynamicStyles.detailRow}>
                  <Text style={dynamicStyles.detailLabel}>Reference:</Text>
                  <Text style={dynamicStyles.detailValue}>{reference}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Items Table with pill-shaped design matching brand color */}
          <View style={dynamicStyles.itemsSection}>
            <Text style={dynamicStyles.sectionTitle}>Items</Text>
            <View style={dynamicStyles.itemsTable}>
              <View style={dynamicStyles.tableHeader}>
                {lineItemFields.map((field, index) => (
                  <Text 
                    key={field.id} 
                    style={{
                      ...createColumnStyle(index, lineItemFields.length),
                      color: '#ffffff',
                      fontWeight: 'normal',
                      fontSize: 10,
                      fontFamily: 'Helvetica',
                      letterSpacing: 0.3,
                    }}
                  >
                    {field.label}
                  </Text>
                ))}
              </View>
              
              {displayItems.map((item, itemIndex) => {
                // Determine row style based on index for alternating shading
                const isEvenRow = itemIndex % 2 === 0;
                const isLastRow = itemIndex === displayItems.length - 1;
                const baseRowStyle = isEvenRow ? dynamicStyles.tableRow : dynamicStyles.tableRowAlt;
                
                // Add extra bottom padding for the last row to ensure curved edges are visible
                const rowStyle = isLastRow ? {
                  ...baseRowStyle,
                  borderBottom: 'none', // Remove bottom border for last row
                  paddingBottom: 16, // Extra padding for last row
                } : baseRowStyle;
                
                return (
                  <View key={itemIndex} style={rowStyle}>
                    {lineItemFields.map((field, fieldIndex) => {
                      const value = item[field.name];
                      let displayValue = '';
                      
                      if (value !== undefined && value !== null && value !== '') {
                        if (field.type === 'number') {
                          // Handle different field names for amounts
                          if (field.name === 'amount' || field.name === 'totalPrice' || field.name === 'price') {
                            displayValue = `$${parseFloat(value).toFixed(2)}`;
                          } else if (field.name === 'unitPrice') {
                            displayValue = `$${parseFloat(value).toFixed(2)}`;
                          } else {
                            displayValue = parseFloat(value).toFixed(2);
                          }
                        } else {
                          displayValue = value.toString();
                        }
                      }
                      
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
                );
              })}
            </View>
          </View>

          {/* Totals with clean typography */}
          <View style={dynamicStyles.totalsSection}>
            <View style={dynamicStyles.totalRow}>
              <Text style={dynamicStyles.totalLabel}>Subtotal:</Text>
              <Text style={dynamicStyles.totalValue}>{currency}{subtotal.toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View style={dynamicStyles.totalRow}>
                <Text style={dynamicStyles.totalLabel}>Discount:</Text>
                <Text style={dynamicStyles.totalValue}>-{currency}{discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={dynamicStyles.totalRow}>
              <Text style={dynamicStyles.totalLabel}>Tax:</Text>
              <Text style={dynamicStyles.totalValue}>{currency}{taxAmount.toFixed(2)}</Text>
            </View>
            <View style={dynamicStyles.grandTotal}>
              <Text style={dynamicStyles.grandTotalLabel}>Total:</Text>
              <Text style={dynamicStyles.grandTotalValue}>{currency}{total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Notes Section with minimal styling */}
          {notes && (
            <View style={dynamicStyles.notesSection}>
              <View style={dynamicStyles.notesCard}>
                <Text style={dynamicStyles.notesTitle}>Notes</Text>
                <Text style={dynamicStyles.notesText}>{notes}</Text>
              </View>
            </View>
          )}

          {/* Additional Receipt Fields */}
          {receipt && (() => {
            // Define all known fields that are already displayed elsewhere
            const displayedFields = [
              'id', 'teamId', 'receiptNumber', 'issueDate', 'customerName', 
              'customerEmail', 'customerPhone', 'customerAddress', 'items', 
              'subtotal', 'taxAmount', 'totalAmount', 'currency', 'status', 
              'notes', 'businessName', 'businessAddress', 'businessPhone', 
              'businessEmail', 'dueDate', 'paymentTerms', 'reference', 
              'itemAdditionalFields', 'createdAt', 'updatedAt'
            ];
            
            // Find any additional fields that aren't already displayed
            const additionalFields = Object.keys(receipt).filter(key => 
              !displayedFields.includes(key) &&
              receipt[key] !== null && receipt[key] !== undefined && receipt[key] !== ''
            );
            
            if (additionalFields.length > 0) {
              return (
                <View style={dynamicStyles.customFieldsSection}>
                  <Text style={dynamicStyles.customFieldsTitle}>Additional Details</Text>
                  {additionalFields.map((fieldName) => {
                    const value = receipt[fieldName];
                    const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');
                    
                    return (
                      <View key={fieldName} style={dynamicStyles.customFieldRow}>
                        <Text style={dynamicStyles.customFieldLabel}>{label}:</Text>
                        <Text style={dynamicStyles.customFieldValue}>{value}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            }
            return null;
          })()}

          {/* Footer Custom Fields */}
          {footerCustomFields.length > 0 && (
            <View style={dynamicStyles.customFieldsSection}>
              <Text style={dynamicStyles.customFieldsTitle}>Additional Information</Text>
              {footerCustomFields.map((field) => {
                const value = customFields[field.name];
                if (!value) return null;
                
                return (
                  <View key={field.id} style={dynamicStyles.customFieldRow}>
                    <Text style={dynamicStyles.customFieldLabel}>{field.label}:</Text>
                    <Text style={dynamicStyles.customFieldValue}>{value}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Footer with minimal design */}
          <View style={dynamicStyles.footer}>
            <Text style={dynamicStyles.thankYou}>{footerThankYouText}</Text>
            <Text style={dynamicStyles.contactInfo}>{footerContactInfo}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default BrandedReceiptPDF; 