// Firebase configuration
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Google Vision API Key
export const GOOGLE_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';

// Plan limits
export const FREE_PLAN_RECEIPT_LIMIT = 20;
export const PREMIUM_PRICE = 2.99;

// Categories for freelancers
export const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Software & Subscriptions',
  'Travel',
  'Meals & Entertainment',
  'Equipment',
  'Professional Services',
  'Marketing & Advertising',
  'Insurance',
  'Utilities',
  'Rent & Lease',
  'Education & Training',
  'Other',
];
