import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  QueryConstraint,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Expense } from '../types';

export const createExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'expenses'), {
      ...expense,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { id: docRef.id, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
};

export const getUserExpenses = async (userId: string): Promise<Expense[]> => {
  try {
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      expenses.push({
        id: doc.id,
        merchant: data.merchant,
        userId: data.userId,
        date: data.date,
        amount: data.amount,
        category: data.category,
        notes: data.notes,
        imageUrl: data.imageUrl,
        ocrText: data.ocrText,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Expense);
    });
    
    return expenses;
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return [];
  }
};

export const updateExpense = async (expenseId: string, updates: Partial<Expense>) => {
  try {
    await updateDoc(doc(db, 'expenses', expenseId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const deleteExpense = async (expenseId: string) => {
  try {
    await deleteDoc(doc(db, 'expenses', expenseId));
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getExpensesByMonth = async (userId: string, year: number, month: number) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0])
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      expenses.push({
        id: doc.id,
        merchant: data.merchant,
        userId: data.userId,
        date: data.date,
        amount: data.amount,
        category: data.category,
        notes: data.notes,
        imageUrl: data.imageUrl,
        ocrText: data.ocrText,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Expense);
    });
    
    return expenses;
  } catch (error: any) {
    console.error('Error fetching monthly expenses:', error);
    return [];
  }
};

export const searchExpenses = async (userId: string, searchTerm: string): Promise<Expense[]> => {
  try {
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const merchantMatch = data.merchant?.toLowerCase().includes(lowerSearchTerm);
      const notesMatch = data.notes?.toLowerCase().includes(lowerSearchTerm);
      const categoryMatch = data.category?.toLowerCase().includes(lowerSearchTerm);
      
      if (merchantMatch || notesMatch || categoryMatch) {
        expenses.push({
          id: doc.id,
          merchant: data.merchant,
          userId: data.userId,
          date: data.date,
          amount: data.amount,
          category: data.category,
          notes: data.notes,
          imageUrl: data.imageUrl,
          ocrText: data.ocrText,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Expense);
      }
    });
    
    return expenses;
  } catch (error: any) {
    console.error('Error searching expenses:', error);
    return [];
  }
};

export const getReceiptCountForMonth = async (userId: string, year: number, month: number): Promise<number> => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0])
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error: any) {
    console.error('Error counting receipts:', error);
    return 0;
  }
};

/**
 * Check for potential duplicate receipts based on merchant, date, and amount
 */
export const checkForDuplicates = async (
  userId: string,
  merchant: string,
  date: string,
  amount: number
): Promise<Expense[]> => {
  try {
    // Search for expenses with same merchant and date
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('merchant', '==', merchant),
      where('date', '==', date)
    );
    
    const querySnapshot = await getDocs(q);
    const duplicates: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Check if amount matches (within 1 cent tolerance for floating point)
      if (Math.abs(data.amount - amount) < 0.01) {
        duplicates.push({
          id: doc.id,
          merchant: data.merchant,
          userId: data.userId,
          date: data.date,
          amount: data.amount,
          category: data.category,
          notes: data.notes,
          imageUrl: data.imageUrl,
          ocrText: data.ocrText,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Expense);
      }
    });
    
    return duplicates;
  } catch (error: any) {
    console.error('Error checking for duplicates:', error);
    return [];
  }
};

/**
 * Export expenses to CSV format
 */
export const exportExpensesToCSV = (expenses: Expense[]): string => {
  const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Notes'];
  const rows = expenses.map((expense) => [
    expense.date,
    `"${expense.merchant.replace(/"/g, '""')}"`,
    `"${expense.category.replace(/"/g, '""')}"`,
    expense.amount.toFixed(2),
    `"${(expense.notes || '').replace(/"/g, '""')}"`,
  ]);
  
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

/**
 * Get tax summary for a date range (premium feature)
 */
export const getTaxSummary = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalDeductible: number;
  byCategory: Record<string, number>;
  receiptCount: number;
  averageReceipt: number;
}> => {
  try {
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const querySnapshot = await getDocs(q);
    let totalDeductible = 0;
    const byCategory: Record<string, number> = {};
    let receiptCount = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalDeductible += data.amount;
      receiptCount++;
      
      if (!byCategory[data.category]) {
        byCategory[data.category] = 0;
      }
      byCategory[data.category] += data.amount;
    });
    
    return {
      totalDeductible,
      byCategory,
      receiptCount,
      averageReceipt: receiptCount > 0 ? totalDeductible / receiptCount : 0,
    };
  } catch (error: any) {
    console.error('Error getting tax summary:', error);
    return {
      totalDeductible: 0,
      byCategory: {},
      receiptCount: 0,
      averageReceipt: 0,
    };
  }
};
