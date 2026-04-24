// Google Vision API Service for OCR
// This service extracts text from receipt images

const GOOGLE_VISION_API_KEY = 'YOUR_GOOGLE_VISION_API_KEY'; // Replace with your actual API key

export const extractReceiptData = async (imageBase64) => {
  try {
    const response = await fetch(
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
                content: imageBase64,
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

    if (!response.ok) {
      throw new Error('Failed to process image with Google Vision API');
    }

    const data = await response.json();
    
    if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
      const fullText = data.responses[0].textAnnotations[0].description;
      return parseReceiptText(fullText);
    }
    
    throw new Error('No text detected in image');
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
};

// Parse extracted text to find date, amount, and merchant
const parseReceiptText = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let merchant = '';
  let amount = '';
  let date = '';
  
  // Extract amount (look for currency patterns)
  const amountPatterns = [
    /\$[\d,]+\.?\d*/g,           // $123.45 or $1,234.56
    /€[\d,]+\.?\d*/g,           // €123.45
    /£[\d,]+\.?\d*/g,           // £123.45
    /total[:\s]*\$?[\d,]+\.?\d*/gi,  // Total: $123.45
    /amount[:\s]*\$?[\d,]+\.?\d*/gi, // Amount: $123.45
  ];
  
  for (const line of lines) {
    for (const pattern of amountPatterns) {
      const match = line.match(pattern);
      if (match) {
        // Extract just the numeric part with currency symbol
        const amountMatch = match[0].match(/[\$€£][\d,]+\.?\d*/);
        if (amountMatch) {
          amount = amountMatch[0];
          break;
        }
      }
    }
    if (amount) break;
  }
  
  // Extract date (common date formats)
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g,        // MM/DD/YYYY or DD/MM/YYYY
    /\d{4}-\d{2}-\d{2}/g,                // YYYY-MM-DD
    /\d{2}-\d{2}-\d{4}/g,                // DD-MM-YYYY
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}/gi, // Month DD, YYYY
  ];
  
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        date = match[0];
        break;
      }
    }
    if (date) break;
  }
  
  // Extract merchant (usually first non-empty line, excluding common receipt words)
  const excludeWords = ['receipt', 'invoice', 'total', 'amount', 'date', 'time', 'thank', 'visit', 'again'];
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (!excludeWords.some(word => lowerLine.includes(word)) && line.length > 2 && line.length < 50) {
      merchant = line;
      break;
    }
  }
  
  // If no merchant found, use first line
  if (!merchant && lines.length > 0) {
    merchant = lines[0];
  }
  
  return {
    merchant: merchant || 'Unknown Merchant',
    amount: amount || '0.00',
    date: date || new Date().toLocaleDateString(),
    rawText: text,
  };
};

export default { extractReceiptData };
