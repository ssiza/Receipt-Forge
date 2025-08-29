import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { Receipt } from '@/lib/types/receipt';
import { ReceiptPreferences } from './receipt-template';
import { log } from './logger';
import { getBusinessTemplateById, getDefaultBusinessTemplate, getReceiptPreferences } from './db/queries';
import BrandedReceiptPDF from '@/components/BrandedReceiptPDF';

export async function generateReceiptPDF(receipt: Receipt, preferences?: ReceiptPreferences): Promise<Buffer> {
  try {
    log.info(`Generating PDF for receipt ${receipt.receiptNumber}`);
    
    // Get receipt preferences if not provided
    if (!preferences) {
      const dbPreferences = await getReceiptPreferences(receipt.teamId);
      if (dbPreferences) {
        preferences = {
          businessName: dbPreferences.businessName || undefined,
          businessAddress: dbPreferences.businessAddress || undefined,
          logoUrl: dbPreferences.logoUrl || undefined,
          tableColor: dbPreferences.tableColor || undefined,
          footerThankYouText: dbPreferences.footerThankYouText || undefined,
          footerContactInfo: dbPreferences.footerContactInfo || undefined,
        };
      }
    }

    // Use receipt's business info if available, otherwise fall back to preferences
    const businessName = receipt.businessName || preferences?.businessName;
    const businessAddress = receipt.businessAddress || preferences?.businessAddress;
    const businessPhone = receipt.businessPhone;
    const businessEmail = receipt.businessEmail || preferences?.businessEmail;
    
    // Prepare props for BrandedReceiptPDF component
    const pdfProps = {
      businessName,
      businessAddress,
      businessPhone,
      businessEmail,
      logoUrl: preferences?.logoUrl || undefined,
      tableColor: preferences?.tableColor || '#3b82f6',
      receiptNumber: receipt.receiptNumber,
      issueDate: receipt.issueDate,
      dueDate: receipt.dueDate,
      customerName: receipt.customerName,
      customerEmail: receipt.customerEmail || undefined,
      customerPhone: receipt.customerPhone,
      customerAddress: receipt.customerAddress,
      items: receipt.items,
      subtotal: parseFloat(receipt.subtotal.toString()),
      taxAmount: parseFloat(receipt.taxAmount?.toString() || '0'),
      total: parseFloat(receipt.totalAmount.toString()),
      footerThankYouText: preferences?.footerThankYouText || undefined,
      footerContactInfo: preferences?.footerContactInfo || undefined,
      currency: receipt.currency,
      status: receipt.status,
      notes: receipt.notes || undefined,
      paymentTerms: receipt.paymentTerms,
      reference: receipt.reference,
      itemAdditionalFields: receipt.itemAdditionalFields || [],
      // Pass the entire receipt object for maximum flexibility
      receipt: receipt,
    };
    
    // Render PDF to buffer
    const pdfBuffer = await renderToBuffer(React.createElement(BrandedReceiptPDF, pdfProps as any) as any);
    
    log.info(`PDF generated successfully for receipt ${receipt.receiptNumber}: ${pdfBuffer.length} bytes`);
    return pdfBuffer;
    
  } catch (error) {
    log.error(`Failed to generate PDF for receipt ${receipt.receiptNumber}:`, error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateReceiptImage(receipt: Receipt, preferences?: ReceiptPreferences): Promise<Buffer> {
  try {
    log.info(`Generating image for receipt ${receipt.receiptNumber}`);
    
    // For now, we'll generate a PDF and convert it to image
    // In a production environment, you might want to use a different approach
    // or implement a separate image generation component
    
    const pdfBuffer = await generateReceiptPDF(receipt, preferences);
    
    // Note: Converting PDF to image requires additional libraries
    // For now, we'll return the PDF buffer as a placeholder
    // You can implement proper image generation later if needed
    
    log.info(`Image generation placeholder for receipt ${receipt.receiptNumber}: ${pdfBuffer.length} bytes`);
    return pdfBuffer;
    
  } catch (error) {
    log.error(`Failed to generate image for receipt ${receipt.receiptNumber}:`, error);
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 