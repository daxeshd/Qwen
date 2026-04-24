import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User, Expense } from '../types';
import { subscribeToAuthChanges, getUserData, signOut as authSignOut } from '../services/authService';
import { getUserExpenses, getReceiptCountForMonth } from '../services/expenseService';
import { FREE_PLAN_RECEIPT_LIMIT } from '../utils/constants';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  expenses: Expense[];
  isPremium: boolean;
  currentMonthReceiptCount: number;
  canAddReceipt: boolean;
  signOut: () => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentMonthReceiptCount, setCurrentMonthReceiptCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        const { user: userData } = await getUserData(fbUser.uid);
        setUser(userData);
        
        // Load expenses
        const userExpenses = await getUserExpenses(fbUser.uid);
        setExpenses(userExpenses);
        
        // Count receipts for current month
        const now = new Date();
        const count = await getReceiptCountForMonth(fbUser.uid, now.getFullYear(), now.getMonth() + 1);
        setCurrentMonthReceiptCount(count);
      } else {
        setUser(null);
        setExpenses([]);
        setCurrentMonthReceiptCount(0);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    setFirebaseUser(null);
    setExpenses([]);
    setCurrentMonthReceiptCount(0);
  };

  const refreshExpenses = async () => {
    if (firebaseUser) {
      const userExpenses = await getUserExpenses(firebaseUser.uid);
      setExpenses(userExpenses);
      
      const now = new Date();
      const count = await getReceiptCountForMonth(firebaseUser.uid, now.getFullYear(), now.getMonth() + 1);
      setCurrentMonthReceiptCount(count);
    }
  };

  const isPremium = user?.isPremium || false;
  const canAddReceipt = isPremium || currentMonthReceiptCount < FREE_PLAN_RECEIPT_LIMIT;

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        expenses,
        isPremium,
        currentMonthReceiptCount,
        canAddReceipt,
        signOut,
        refreshExpenses,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
