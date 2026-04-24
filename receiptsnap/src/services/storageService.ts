import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const uploadReceiptImage = async (userId: string, imageUri: string, expenseId?: string) => {
  try {
    // Create unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const filename = `receipts/${userId}/${expenseId || timestamp}_${randomId}.jpg`;
    
    // Fetch the image
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return { url: downloadURL, path: filename, error: null };
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return { url: null, path: null, error: error.message };
  }
};

export const deleteReceiptImage = async (imageUrl: string) => {
  try {
    // Create a reference to the file
    const imageRef = ref(storage, imageUrl);
    
    // Delete the file
    await deleteObject(imageRef);
    
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return { error: error.message };
  }
};
