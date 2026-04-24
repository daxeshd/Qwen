import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../src/screens/HomeScreen';
import ScanReceiptScreen from '../src/screens/ScanReceiptScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'ReceiptSnap' }}
        />
        <Stack.Screen 
          name="ScanReceipt" 
          component={ScanReceiptScreen} 
          options={{ title: 'Scan Receipt' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
