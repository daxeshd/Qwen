import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { upgradeToPremium } from '../../services/authService';
import { FREE_PLAN_RECEIPT_LIMIT, PREMIUM_PRICE } from '../../utils/constants';

export default function PaywallScreen({ onDismiss }: { onDismiss: () => void }) {
  const { user, isPremium, currentMonthReceiptCount } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Simulate purchase - in production, integrate with RevenueCat or Stripe
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const { error } = await upgradeToPremium(user.uid, expiryDate);

      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Upgraded to Premium!');
        onDismiss();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const remainingReceipts = FREE_PLAN_RECEIPT_LIMIT - currentMonthReceiptCount;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Go Premium</Text>
          <Text style={styles.subtitle}>Unlock powerful features for freelancers</Text>
        </View>

        {!isPremium && (
          <View style={styles.usageCard}>
            <Text style={styles.usageTitle}>Current Usage</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (currentMonthReceiptCount / FREE_PLAN_RECEIPT_LIMIT) * 100)}%`,
                    backgroundColor: remainingReceipts <= 5 ? '#ef4444' : '#2563eb',
                  },
                ]}
              />
            </View>
            <Text style={styles.usageText}>
              {currentMonthReceiptCount} / {FREE_PLAN_RECEIPT_LIMIT} receipts this month
            </Text>
            {remainingReceipts <= 5 && (
              <Text style={styles.warningText}>
                ⚠️ Only {remainingReceipts} receipts remaining!
              </Text>
            )}
          </View>
        )}

        <View style={styles.features}>
          <FeatureItem text="✅ Unlimited receipts" />
          <FeatureItem text="✅ CSV export for taxes" />
          <FeatureItem text="✅ Tax summary view" />
          <FeatureItem text="✅ Backup & sync" />
          <FeatureItem text="✅ Premium badge" />
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.price}>${PREMIUM_PRICE}</Text>
          <Text style={styles.pricePeriod}>per month</Text>
        </View>

        <View style={styles.buttons}>
          <View style={styles.button}>
            <Text style={styles.buttonText} onPress={handleUpgrade}>
              Start Free Trial
            </Text>
          </View>

          <View style={[styles.button, styles.buttonSecondary]}>
            <Text style={styles.buttonTextSecondary} onPress={onDismiss}>
              Maybe Later
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Cancel anytime. No charges during trial period.
        </Text>
      </View>
    </View>
  );
}

const FeatureItem = ({ text }: { text: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  usageCard: {
    width: '100%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageText: {
    fontSize: 12,
    color: '#6b7280',
  },
  warningText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '600',
  },
  features: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
  },
  priceCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#6b7280',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
});
