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
