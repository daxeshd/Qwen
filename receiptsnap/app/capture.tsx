import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../src/context/AuthContext';
import { processImageForOCR, extractTextFromImage, parseReceiptData } from '../src/services/ocrService';
import { OCRResult } from '../src/types';

export default function CaptureScreen() {
  const { canAddReceipt } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (!canAddReceipt) {
      Alert.alert(
        'Limit Reached',
        'You have reached your monthly receipt limit. Upgrade to Premium for unlimited receipts.',
        [
          { text: 'OK', onPress: () => router.back() },
        ]
      );
    }
  }, [canAddReceipt]);

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleImageSelected = async (uri: string) => {
    setSelectedImage(uri);
    setProcessing(true);

    try {
      // Process image for better OCR results
      const processedImage = await processImageForOCR(uri);

      // Extract text using Google Vision API
      const text = await extractTextFromImage(processedImage);

      // Parse the extracted text
      const parsed = parseReceiptData(text);

      setOcrResult(parsed);

      // Navigate to edit screen with OCR results
      router.push({
        pathname: '/edit-receipt',
        params: {
          ocrData: JSON.stringify(parsed),
          imageUri: uri,
        },
      });
    } catch (error: any) {
      console.error('OCR Error:', error);
      Alert.alert(
        'OCR Failed',
        'Could not extract text from the image. You can still enter the details manually.',
        [
          {
            text: 'Enter Manually',
            onPress: () => {
              router.push({
                pathname: '/edit-receipt',
                params: {
                  imageUri: uri,
                },
              });
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeButton}>✕ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Receipt</Text>
        <View style={{ width: 60 }} />
      </View>

      {selectedImage ? (
        <View style={styles.imagePreview}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          {processing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.processingText}>Analyzing receipt...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.options}>
          <Text style={styles.instruction}>How would you like to add a receipt?</Text>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={takePhoto}
            disabled={processing}
          >
            <Text style={styles.optionIcon}>📷</Text>
            <Text style={styles.optionTitle}>Take Photo</Text>
            <Text style={styles.optionSubtitle}>Snap a picture of your receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={pickImageFromGallery}
            disabled={processing}
          >
            <Text style={styles.optionIcon}>🖼️</Text>
            <Text style={styles.optionTitle}>Choose from Gallery</Text>
            <Text style={styles.optionSubtitle}>Select an existing photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, styles.secondaryOption]}
            onPress={pickDocument}
            disabled={processing}
          >
            <Text style={styles.optionIcon}>📁</Text>
            <Text style={styles.optionTitle}>Import File</Text>
            <Text style={styles.optionSubtitle}>PDF or image file</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, styles.manualEntry]}
            onPress={() =>
              router.push({
                pathname: '/edit-receipt',
                params: { manual: 'true' },
              })
            }
            disabled={processing}
          >
            <Text style={styles.optionIcon}>✏️</Text>
            <Text style={styles.optionTitle}>Manual Entry</Text>
            <Text style={styles.optionSubtitle}>Enter details by hand</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🤖 AI-powered OCR will extract receipt details automatically
        </Text>
      </View>
    </View>
  );
}

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
  closeButton: {
    color: '#6b7280',
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  imagePreview: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  options: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  instruction: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryOption: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowOpacity: 0,
  },
  manualEntry: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowOpacity: 0,
  },
  optionIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
