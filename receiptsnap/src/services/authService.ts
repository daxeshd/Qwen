import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: null,
      isPremium: false,
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    return { user: userData, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return { user: userDoc.data() as User, error: null };
    } else {
      // Create user document if it doesn't exist
      const userData: User = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL,
        isPremium: false,
        createdAt: new Date(),
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      return { user: userData, error: null };
    }
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const upgradeToPremium = async (userId: string, expiryDate: Date) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isPremium: true,
      subscriptionExpiry: expiryDate,
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { user: userDoc.data() as User, error: null };
    }
    return { user: null, error: 'User not found' };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};
