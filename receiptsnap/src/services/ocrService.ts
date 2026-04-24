import * as ImageManipulator from 'expo-image-manipulator';
import { GOOGLE_VISION_API_KEY } from '../utils/constants';
import { OCRResult } from '../types';

export const processImageForOCR = async (imageUri: string) => {
  try {
    // Resize and compress image for better OCR performance
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 1200 } },
        { rotate: 0 },
      ],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return manipulatedImage.uri;
  } catch (error: any) {
    console.error('Error processing image:', error);
    return imageUri;
  }
};

export const extractTextFromImage = async (imageUri: string): Promise<string> => {
  try {
    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = (reader.result as string).split(',')[1];
        
        try {
          const visionResponse = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                requests: [
                  {
                    image: {
                      content: base64Image,
                    },
                    features: [
                      {
                        type: 'TEXT_DETECTION',
                        maxResults: 1,
                      },
                    ],
                  },
                ],
              }),
            }
          );
          
          const data = await visionResponse.json();
          
          if (data.responses && data.responses[0] && data.responses[0].fullTextAnnotation) {
            resolve(data.responses[0].fullTextAnnotation.text);
          } else {
            resolve('');
          }
        } catch (error) {
          console.error('OCR API error:', error);
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    console.error('Error extracting text:', error);
    throw error;
  }
};

export const parseReceiptData = (text: string): OCRResult => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let merchant = '';
  let date = '';
  let amount = 0;
  
  // Try to find merchant name (usually first few lines, alphanumeric with spaces)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line.length > 2 && line.length < 50 && !isDateOrAmount(line)) {
      merchant = line;
      break;
    }
  }
  
  // Try to find date (various formats)
  const datePatterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
    /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      date = match[0];
      break;
    }
  }
  
  // Try to find total amount (look for largest number with currency symbols or "total")
  const amountPatterns = [
    /(?:total|amount|balance)[:\s]*\$?([\d,]+\.?\d*)/i,
    /\$([\d,]+\.?\d*)/,
    /([\d,]+\.?\d*)\s*(?:USD|EUR|GBP)/i,
  ];
  
  const amounts: number[] = [];
  
  for (const pattern of amountPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(value) && value > 0) {
        amounts.push(value);
      }
    }
  }
  
  // Also look for standalone numbers that could be amounts
  const numberPattern = /\b(\d+\.\d{2})\b/g;
  let numMatch;
  while ((numMatch = numberPattern.exec(text)) !== null) {
    const value = parseFloat(numMatch[1]);
    if (!isNaN(value) && value > 0 && value < 10000) {
      amounts.push(value);
    }
  }
  
  // Take the largest amount as the total (usually the total on receipts)
  if (amounts.length > 0) {
    amount = Math.max(...amounts);
  }
  
  // If no date found, use today
  if (!date) {
    date = new Date().toISOString().split('T')[0];
  }
  
  return {
    merchant: merchant || 'Unknown Merchant',
    date,
    amount,
    rawText: text,
  };
};

const isDateOrAmount = (line: string): boolean => {
  // Check if line looks like a date
  const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
  if (datePattern.test(line)) return true;
  
  // Check if line looks like an amount
  const amountPattern = /^\$?\d+\.?\d*$/;
  if (amountPattern.test(line)) return true;
  
  return false;
};
