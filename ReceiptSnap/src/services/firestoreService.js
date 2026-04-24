// Firestore service for managing expenses
import { db } from '../config/firebaseInit';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const EXPENSES_COLLECTION = 'expenses';

// Add a new expense
export const addExpense = async (userId, expenseData) => {
  try {
    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), {
      userId,
      ...expenseData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

// Get all expenses for a user
export const getUserExpenses = async (userId) => {
  try {
    const q = query(
      collection(db, EXPENSES_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const expenses = [];
    querySnapshot.forEach((doc) => {
      if (doc.data().userId === userId) {
        expenses.push({
          id: doc.id,
          ...doc.data(),
        });
      }
    });
    
    return expenses;
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
};

// Update an expense
export const updateExpense = async (expenseId, updatedData) => {
  try {
    const expenseRef = doc(db, EXPENSES_COLLECTION, expenseId);
    await updateDoc(expenseRef, updatedData);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Delete an expense
export const deleteExpense = async (expenseId) => {
  try {
    await deleteDoc(doc(db, EXPENSES_COLLECTION, expenseId));
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

export default {
  addExpense,
  getUserExpenses,
  updateExpense,
  deleteExpense,
};
