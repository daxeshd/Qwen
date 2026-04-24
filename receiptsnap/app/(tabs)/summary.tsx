import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Share } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../../src/context/AuthContext';
import SummaryScreen from '../../src/screens/SummaryScreen';
import { exportExpensesToCSV, getTaxSummary } from '../../src/services/expenseService';

export default function SummaryTab() {
  const { expenses, isPremium, user } = useAuth();
  const [taxSummary, setTaxSummary] = useState<{
    totalDeductible: number;
    byCategory: Record<string, number>;
    receiptCount: number;
    averageReceipt: number;
  } | null>(null);

  const handleExportCSV = async () => {
    if (!isPremium) {
      Alert.alert('Premium Feature', 'Upgrade to Premium to export CSV files.');
      return;
    }

    if (expenses.length === 0) {
      Alert.alert('No Data', 'No expenses to export.');
      return;
    }

    try {
      const csvContent = exportExpensesToCSV(expenses);
      
      // Create a temporary file
      const fileName = `receiptsnap_export_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      await Share.share({
        url: filePath,
        title: 'ReceiptSnap Export',
        message: 'Your expense data exported from ReceiptSnap',
      });
    } catch (error: any) {
      Alert.alert('Error', `Failed to export: ${error.message}`);
    }
  };

  const handleLoadTaxSummary = async () => {
    if (!isPremium || !user) {
      Alert.alert('Premium Feature', 'Upgrade to Premium for tax summaries.');
      return;
    }

    try {
      // Get current year-to-date summary
      const startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const summary = await getTaxSummary(user.uid, startDate, endDate);
      setTaxSummary(summary);
      
      Alert.alert(
        'Tax Summary Loaded',
        `Total Deductible: $${summary.totalDeductible.toFixed(2)}\nReceipts: ${summary.receiptCount}\nAverage: $${summary.averageReceipt.toFixed(2)}`
      );
    } catch (error: any) {
      Alert.alert('Error', `Failed to load tax summary: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Summary & Export</Text>
        {isPremium && (
          <View style={styles.exportButtons}>
            <View style={styles.exportButton} onTouchEnd={handleExportCSV}>
              <Text style={styles.exportButtonText}>📄 Export CSV</Text>
            </View>
            <View style={[styles.exportButton, styles.secondaryButton]} onTouchEnd={handleLoadTaxSummary}>
              <Text style={styles.exportButtonText}>📊 Tax Summary</Text>
            </View>
          </View>
        )}
      </View>
      <SummaryScreen expenses={expenses} isPremium={isPremium} taxSummary={taxSummary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: '#10b981',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
