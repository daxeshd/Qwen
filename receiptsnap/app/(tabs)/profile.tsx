import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { signOut } from '../../src/services/authService';
import { router } from 'expo-router';
import PaywallScreen from '../../src/screens/PaywallScreen';
import * as FileSystem from 'expo-file-system';
import { getUserExpenses } from '../../src/services/expenseService';

export default function ProfileScreen() {
  const { user, isPremium, signOut: contextSignOut, currentMonthReceiptCount } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await contextSignOut();
          router.replace('/');
        },
      },
    ]);
  };

  const handleExportCSV = async () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    try {
      if (!user) return;

      // Fetch all expenses
      const expenses = await getUserExpenses(user.uid);

      // Create CSV content
      const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Notes'];
      const rows = expenses.map((e) =>
        [e.date, e.merchant, e.category, e.amount.toFixed(2), e.notes || '']
          .map((field) => `"${field}"`)
          .join(',')
      );

      const csvContent = [headers.join(','), ...rows].join('\n');

      // Save to file
      const filename = `${FileSystem.documentDirectory}receiptsnap_export_${new Date().toISOString().split('T')[0]}.csv`;
      await FileSystem.writeAsStringAsync(filename, csvContent);

      Alert.alert(
        'Export Successful',
        `CSV file saved to:\n${filename}`,
        [
          { text: 'OK' },
          {
            text: 'Open Folder',
            onPress: () => Linking.openURL(FileSystem.documentDirectory || ''),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Export Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.displayName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {isPremium && (
          <View style={styles.premiumBadgeLarge}>
            <Text style={styles.premiumBadgeText}>⭐ Premium Member</Text>
          </View>
        )}
      </View>

      {/* Usage Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage</Text>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {currentMonthReceiptCount}
            </Text>
            <Text style={styles.statLabel}>Receipts This Month</Text>
          </View>
          {!isPremium && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>20</Text>
                <Text style={styles.statLabel}>Monthly Limit</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Subscription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.card}>
          {isPremium ? (
            <>
              <Text style={styles.planName}>Premium Plan</Text>
              <Text style={styles.planStatus}>Active</Text>
              <TouchableOpacity style={styles.cardButton}>
                <Text style={styles.cardButtonText}>Manage Subscription</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.planName}>Free Plan</Text>
              <Text style={styles.planStatus}>20 receipts/month</Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => setShowPaywall(true)}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.featureItem} onPress={handleExportCSV}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Export CSV</Text>
              <Text style={styles.featureSubtitle}>
                {isPremium ? 'Download your expense data' : 'Premium feature'}
              </Text>
            </View>
            <Text style={styles.featureArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.featureDivider} />

          <TouchableOpacity style={styles.featureItem}>
            <Text style={styles.featureIcon}>☁️</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Backup & Sync</Text>
              <Text style={styles.featureSubtitle}>
                {isPremium ? 'Enabled' : 'Premium feature'}
              </Text>
            </View>
            <Text style={[styles.featureArrow, !isPremium && styles.featureLocked]}>
              {isPremium ? '✓' : '🔒'}
            </Text>
          </TouchableOpacity>

          <View style={styles.featureDivider} />

          <TouchableOpacity style={styles.featureItem}>
            <Text style={styles.featureIcon}>📈</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Tax Summary</Text>
              <Text style={styles.featureSubtitle}>
                {isPremium ? 'View tax deductions' : 'Premium feature'}
              </Text>
            </View>
            <Text style={[styles.featureArrow, !isPremium && styles.featureLocked]}>
              {isPremium ? '→' : '🔒'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.featureItem}>
            <Text style={styles.featureIcon}>❓</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Help Center</Text>
              <Text style={styles.featureSubtitle}>FAQs and guides</Text>
            </View>
            <Text style={styles.featureArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.featureDivider} />

          <TouchableOpacity style={styles.featureItem}>
            <Text style={styles.featureIcon}>📧</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Contact Support</Text>
              <Text style={styles.featureSubtitle}>Get help via email</Text>
            </View>
            <Text style={styles.featureArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>

      {/* Paywall Modal */}
      {showPaywall && (
        <View style={styles.modalContainer}>
          <PaywallScreen onDismiss={() => setShowPaywall(false)} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
  },
  premiumBadgeLarge: {
    marginTop: 12,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  premiumBadgeText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginLeft: 4,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  planStatus: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  cardButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  featureArrow: {
    fontSize: 18,
    color: '#d1d5db',
  },
  featureLocked: {
    color: '#d1d5db',
  },
  featureDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  signOutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
