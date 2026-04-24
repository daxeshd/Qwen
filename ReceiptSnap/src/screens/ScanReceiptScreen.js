import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { extractReceiptData } from '../services/ocrService';
import { addExpense } from '../services/firestoreService';

const ScanReceiptScreen = ({ navigation }) => {
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  
  // Mock user ID for MVP - replace with actual auth in production
  const userId = 'demo-user-123';

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library permissions are required to scan receipts.'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      processImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (imageUri) => {
    try {
      setProcessing(true);
      
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Extract data using OCR
      const data = await extractReceiptData(base64);
      setExtractedData(data);
      
      Alert.alert(
        'Receipt Scanned!',
        `Merchant: ${data.merchant}\nAmount: ${data.amount}\nDate: ${data.date}`,
        [
          { text: 'Edit', style: 'cancel' },
          {
            text: 'Save',
            onPress: () => saveExpense(data),
          },
        ]
      );
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert(
        'Processing Error',
        'Failed to process receipt. Please try again or enter manually.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const saveExpense = async (data) => {
    try {
      await addExpense(userId, {
        merchant: data.merchant,
        amount: data.amount,
        date: data.date,
        imageUrl: image,
      });
      
      Alert.alert('Success', 'Expense saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save expense. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Scan Receipt</Text>
        <Text style={styles.subtitle}>
          Take a photo or upload an image of your receipt
        </Text>

        {image && (
          <Image source={{ uri: image }} style={styles.previewImage} />
        )}

        {processing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.processingText}>Processing receipt...</Text>
          </View>
        )}

        {extractedData && !processing && (
          <View style={styles.extractedDataContainer}>
            <Text style={styles.extractedTitle}>Extracted Data:</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Merchant:</Text>
              <Text style={styles.dataValue}>{extractedData.merchant}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Amount:</Text>
              <Text style={styles.dataValue}>{extractedData.amount}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Date:</Text>
              <Text style={styles.dataValue}>{extractedData.date}</Text>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
            <Text style={styles.buttonText}>📷 Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
            <Text style={styles.buttonText}>🖼️ Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  previewImage: {
    width: 300,
    height: 400,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  processingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  extractedDataContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  extractedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  dataValue: {
    fontSize: 14,
    color: '#333',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  galleryButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default ScanReceiptScreen;
