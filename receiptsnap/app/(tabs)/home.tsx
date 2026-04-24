import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Expense } from '../../src/types';
import PaywallScreen from '../../src/screens/PaywallScreen';
import EditReceiptScreen from '../../src/screens/EditReceiptScreen';
import { deleteExpense } from '../../src/services/expenseService';

export default function HomeScreen() {
  const { user, expenses, isPremium, canAddReceipt, refreshExpenses, currentMonthReceiptCount } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const cameraRef = useRef(null);

  const filteredExpenses = expenses.filter((expense) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      expense.merchant.toLowerCase().includes(query) ||
      expense.category.toLowerCase().includes(query) ||
      expense.notes?.toLowerCase().includes(query)
    );
  });

  const handleAddReceipt = () => {
    if (!canAddReceipt) {
      setShowPaywall(true);
      return;
    }
    // Navigate to camera/gallery selection
    router.push({
      pathname: '/capture',
      params: { source: 'button' },
    });
  };

  const handleManualEntry = () => {
    if (!canAddReceipt) {
      setShowPaywall(true);
      return;
    }
    // Open edit modal with empty form
    setSelectedExpense(null);
    setShowEditModal(true);
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowEditModal(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteExpense(expenseId);
            if (error) {
              Alert.alert('Error', error);
            } else {
              Alert.alert('Success', 'Receipt deleted');
              await refreshExpenses();
            }
          },
        },
      ]
    );
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={styles.expenseItem}
      onPress={() => handleViewExpense(item)}
      onLongPress={() => handleDeleteExpense(item.id)}
    >
      <View style={styles.expenseLeft}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(item.category) },
          ]}
        >
          <Text style={styles.categoryBadgeText}>
            {item.category.charAt(0)}
          </Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseMerchant}>{item.merchant}</Text>
          <Text style={styles.expenseDate}>{item.date}</Text>
          <Text style={styles.expenseCategory}>{item.category}</Text>
        </View>
      </View>
      <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  const totalThisMonth = expenses
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.displayName || 'Freelancer'}!</Text>
          <Text style={styles.subtitle}>Track your business expenses</Text>
        </View>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>⭐ Premium</Text>
          </View>
        )}
      </View>

      {/* Usage Indicator */}
      {!isPremium && (
        <View style={styles.usageBar}>
          <Text style={styles.usageText}>
            {currentMonthReceiptCount}/{20} receipts this month
          </Text>
          <View style={styles.usageProgress}>
            <View
              style={[
                styles.usageFill,
                {
                  width: `${Math.min(100, (currentMonthReceiptCount / 20) * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Monthly Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>This Month</Text>
        <Text style={styles.summaryAmount}>${totalThisMonth.toFixed(2)}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/summary')}>
          <Text style={styles.summaryLink}>View Summary →</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleAddReceipt}
        >
          <Text style={styles.primaryButtonText}>📷 Scan Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleManualEntry}
        >
          <Text style={styles.secondaryButtonText}>+ Manual Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Expense List */}
      <Text style={styles.sectionTitle}>Recent Expenses</Text>
      {filteredExpenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No matching expenses' : 'No expenses yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? 'Try a different search term'
              : 'Scan your first receipt or add manually'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Paywall Modal */}
      <Modal visible={showPaywall} animationType="slide" transparent>
        <PaywallScreen onDismiss={() => setShowPaywall(false)} />
      </Modal>

      {/* Edit Receipt Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEditModal(false)}>
            <Text style={styles.modalClose}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {selectedExpense ? 'Edit Receipt' : 'New Receipt'}
          </Text>
          <View style={{ width: 60 }} />
        </View>
        <EditReceiptScreen
          ocrResult={
            selectedExpense
              ? {
                  merchant: selectedExpense.merchant,
                  date: selectedExpense.date,
                  amount: selectedExpense.amount,
                  rawText: selectedExpense.ocrText || '',
                }
              : undefined
          }
          imageUri={selectedExpense?.imageUrl}
          onSaved={() => {
            setShowEditModal(false);
            refreshExpenses();
          }}
        />
      </Modal>
    </View>
  );
}

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Office Supplies': '#3b82f6',
    'Software & Subscriptions': '#8b5cf6',
    'Travel': '#06b6d4',
    'Meals & Entertainment': '#f97316',
    'Equipment': '#10b981',
    'Professional Services': '#6366f1',
    'Marketing & Advertising': '#ec4899',
    'Insurance': '#14b8a6',
    'Utilities': '#f59e0b',
    'Rent & Lease': '#ef4444',
    'Education & Training': '#84cc16',
    'Other': '#6b7280',
  };
  return colors[category] || '#6b7280';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  premiumBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  premiumBadgeText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },
  usageBar: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  usageText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  usageProgress: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  summaryCard: {
    backgroundColor: '#2563eb',
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  summaryLabel: {
    color: '#93c5fd',
    fontSize: 14,
    marginBottom: 8,
  },
  summaryAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryLink: {
    color: '#dbeafe',
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  expenseItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseInfo: {
    gap: 4,
  },
  expenseMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  expenseDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  expenseCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalClose: {
    color: '#6b7280',
    fontSize: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});
