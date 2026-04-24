import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Expense } from '../../types';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

interface SummaryScreenProps {
  expenses: Expense[];
  isPremium: boolean;
}

const screenWidth = Dimensions.get('window').width;

export default function SummaryScreen({ expenses, isPremium }: SummaryScreenProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filter expenses for selected month
  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getMonth() === selectedMonth &&
      expenseDate.getFullYear() === selectedYear
    );
  });

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const receiptCount = filteredExpenses.length;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  filteredExpenses.forEach((expense) => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += expense.amount;
  });

  // Prepare chart data
  const categories = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals).map((v) => Math.round(v * 100) / 100);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const years = [2024, 2025];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expense Summary</Text>
        
        {!isPremium && (
          <View style={styles.premiumBanner}>
            <Text style={styles.premiumText}>🔒 Premium Feature</Text>
            <Text style={styles.premiumSubtext}>Upgrade for unlimited receipts & exports</Text>
          </View>
        )}
      </View>

      {/* Month/Year Selector */}
      <View style={styles.dateSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {months.map((month, index) => (
            <TouchableOpacity
              key={month}
              style={[
                styles.monthButton,
                selectedMonth === index && styles.monthButtonSelected,
              ]}
              onPress={() => setSelectedMonth(index)}
            >
              <Text
                style={[
                  styles.monthText,
                  selectedMonth === index && styles.monthTextSelected,
                ]}
              >
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.yearSelector}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.yearButtonSelected,
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <Text
                style={[
                  styles.yearText,
                  selectedYear === year && styles.yearTextSelected,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryCards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Spent</Text>
          <Text style={styles.cardValue}>${totalAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Receipts</Text>
          <Text style={styles.cardValue}>{receiptCount}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Categories</Text>
          <Text style={styles.cardValue}>{categories.length}</Text>
        </View>
      </View>

      {/* Category Breakdown Chart */}
      {categories.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>By Category</Text>
          <BarChart
            data={{
              labels: categories.map((c) => c.length > 8 ? c.substring(0, 8) + '..' : c),
              datasets: [
                {
                  data: values,
                },
              ],
            }}
            width={screenWidth - 48}
            height={220}
            yAxisLabel="$"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#2563eb',
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      )}

      {/* Category List */}
      <View style={styles.categoryList}>
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No expenses this month</Text>
          </View>
        ) : (
          Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: getCategoryColor(category) },
                    ]}
                  />
                  <Text style={styles.categoryName}>{category}</Text>
                </View>
                <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
              </View>
            ))
        )}
      </View>

      {/* Tax Summary (Premium Feature) */}
      {isPremium && (
        <View style={styles.taxSection}>
          <Text style={styles.sectionTitle}>Tax Summary</Text>
          <View style={styles.taxCard}>
            <Text style={styles.taxLabel}>Estimated Deductible Expenses</Text>
            <Text style={styles.taxValue}>${totalAmount.toFixed(2)}</Text>
            <Text style={styles.taxNote}>
              Consult with a tax professional for accurate tax advice.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  premiumBanner: {
    marginTop: 12,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  premiumSubtext: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 4,
  },
  dateSelector: {
    padding: 16,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  monthButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  monthText: {
    fontSize: 14,
    color: '#6b7280',
  },
  monthTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  yearSelector: {
    flexDirection: 'row',
    marginTop: 12,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  yearButtonSelected: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  yearText: {
    fontSize: 12,
    color: '#6b7280',
  },
  yearTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryCards: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  categoryList: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    color: '#374151',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  taxSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taxCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  taxLabel: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 8,
  },
  taxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  taxNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
