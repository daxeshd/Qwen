import React from 'react';
import { Stack } from 'expo-router';

export default function SignInLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signin" />
    </Stack>
  );
}
