import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import SummaryScreen from '../../src/screens/SummaryScreen';

export default function SummaryTab() {
  const { expenses, isPremium } = useAuth();

  return (
    <View style={styles.container}>
      <SummaryScreen expenses={expenses} isPremium={isPremium} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
