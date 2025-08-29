import { Receipt } from '@/lib/types/receipt';

export interface ReceiptPreferences {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  logoUrl?: string;
  tableColor?: string;
  footerThankYouText?: string;
  footerContactInfo?: string;
} 