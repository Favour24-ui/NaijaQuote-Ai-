export interface User {
  id: string;
  email: string;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface BusinessInfoSnapshot {
  businessName: string;
  businessPhone?: string;
  businessAddress?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
}

export interface CustomerSnapshot {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Quotation {
  id: string;
  userId: string;
  quotationNumber: string;
  customerId?: string;
  customerInfo: CustomerSnapshot;
  businessInfo: BusinessInfoSnapshot;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  vatRate: number; // typically 7.5% in Nigeria
  vatAmount: number;
  total: number;
  terms?: string;
  notes?: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}
