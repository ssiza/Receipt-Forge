import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles for the simplified PDF
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
  description: {
    flex: 2,
    paddingRight: 10,
  },
  amount: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
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

interface SimpleReceiptPDFProps {
  businessName?: string;
  receiptNumber: string;
  date: string;
  items: any[];
  total: number;
  footerThankYouText?: string;
  footerContactInfo?: string;
}

const SimpleReceiptPDF: React.FC<SimpleReceiptPDFProps> = ({ 
  businessName, 
  receiptNumber, 
  date, 
  items, 
  total, 
  footerThankYouText, 
  footerContactInfo 
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.businessName}>{businessName || 'Your Business Name'}</Text>
        <View style={styles.receiptInfo}>
          <Text style={styles.receiptNumber}>Receipt #{receiptNumber}</Text>
          <Text style={styles.date}>{new Date(date).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.description}>Description</Text>
            <Text style={styles.amount}>Amount</Text>
          </View>
          
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.description}>{item.description || item.name || 'Item'}</Text>
              <Text style={styles.amount}>
                ${(item.amount || item.totalPrice || item.unitPrice || 0).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.total}>
          <Text>Total</Text>
          <Text>${total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.thankYou}>{footerThankYouText || 'Thank you for your business!'}</Text>
        <Text style={styles.contactInfo}>
          {footerContactInfo || 'This receipt serves as proof of payment. For questions, please contact us at support@yourbusiness.com'}
        </Text>
      </View>
    </Page>
  </Document>
);

export default SimpleReceiptPDF; 