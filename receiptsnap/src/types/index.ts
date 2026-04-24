export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isPremium: boolean;
  subscriptionExpiry?: Date;
  createdAt: Date;
}

export interface Expense {
  id: string;
  userId: string;
  merchant: string;
  date: string;
  amount: number;
  category: string;
  notes: string;
  imageUrl?: string;
  ocrText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlySummary {
  month: string;
  total: number;
  receiptCount: number;
  categories: Record<string, number>;
}

export interface OCRResult {
  merchant: string;
  date: string;
  amount: number;
  rawText: string;
}
