import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { Expense, OCRResult } from '../../types';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { createExpense, updateExpense, checkForDuplicates } from '../../services/expenseService';
import { uploadReceiptImage } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';

interface EditReceiptScreenProps {
  ocrResult?: OCRResult;
  imageUri?: string;
  onSaved: () => void;
}

export default function EditReceiptScreen({ ocrResult, imageUri, onSaved }: EditReceiptScreenProps) {
  const { user, refreshExpenses } = useAuth();
  const [merchant, setMerchant] = useState(ocrResult?.merchant || '');
  const [date, setDate] = useState(ocrResult?.date || new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(ocrResult?.amount.toString() || '');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleSave = async () => {
    if (!merchant || !date || !amount) {
      Alert.alert('Error', 'Please fill in merchant, date, and amount');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);

    try {
      // Check for duplicates before saving (only for new receipts)
      if (!ocrResult?.rawText || !imageUri) {
        const duplicates = await checkForDuplicates(
          user.uid,
          merchant,
          date,
          parseFloat(amount)
        );
        
        if (duplicates.length > 0) {
          const response = await new Promise<'save' | 'cancel'>((resolve) => {
            Alert.alert(
              'Potential Duplicate',
              `A receipt from ${merchant} on ${date} for $${amount} already exists. Save anyway?`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') },
                { text: 'Save Anyway', onPress: () => resolve('save') },
              ]
            );
          });
          
          if (response === 'cancel') {
            setLoading(false);
            return;
          }
        }
      }

      let imageUrl: string | undefined;

      // Upload image if provided
      if (imageUri) {
        const { url, error } = await uploadReceiptImage(user.uid, imageUri);
        if (error) {
          console.error('Image upload error:', error);
        } else {
          imageUrl = url;
        }
      }

      // Create expense record
      const expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        merchant,
        date,
        amount: parseFloat(amount),
        category,
        notes,
        imageUrl,
        ocrText: ocrResult?.rawText,
      };

      const { id, error } = await createExpense(expenseData);

      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Receipt saved!');
        await refreshExpenses();
        onSaved();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.receiptImage} resizeMode="contain" />
        </View>
      )}

      <View style={styles.form}>
        <Text style={styles.label}>Merchant *</Text>
        <TextInput
          style={styles.input}
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Store or vendor name"
        />

        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
        >
          <Text style={styles.pickerButtonText}>{category}</Text>
        </TouchableOpacity>

        {showCategoryPicker && (
          <View style={styles.categoryList}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryItem,
                  category === cat && styles.categoryItemSelected,
                ]}
                onPress={() => {
                  setCategory(cat);
                  setShowCategoryPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryItemText,
                    category === cat && styles.categoryItemTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional details (optional)"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Receipt</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  categoryList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  categoryItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryItemSelected: {
    backgroundColor: '#eff6ff',
  },
  categoryItemText: {
    fontSize: 14,
    color: '#374151',
  },
  categoryItemTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
