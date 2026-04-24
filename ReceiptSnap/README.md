# ReceiptSnap - AI Expense Tracker MVP

A simple React Native (Expo) app that lets freelancers scan receipts, extract data using OCR, store expenses in Firebase, and export to CSV.

## 📁 Project Structure

```
ReceiptSnap/
├── App.js                          # Main app entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel configuration
├── assets/                         # Images and icons
├── src/
│   ├── config/
│   │   ├── firebase.js            # Firebase config (UPDATE WITH YOUR KEYS)
│   │   └── firebaseInit.js        # Firebase initialization
│   ├── services/
│   │   ├── ocrService.js          # Google Vision API integration
│   │   └── firestoreService.js    # Firestore database operations
│   ├── screens/
│   │   ├── HomeScreen.js          # Expense list view
│   │   └── ScanReceiptScreen.js   # Receipt scanning interface
│   ├── utils/
│   │   └── csvExport.js           # CSV export functionality
│   └── navigation/
│       └── AppNavigator.js        # Stack navigation setup
└── README.md                       # This file
```

## 🚀 Setup Guide

### Step 1: Install Dependencies

```bash
cd ReceiptSnap
npm install
```

### Step 2: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database** (start in test mode for development)
4. Enable **Authentication** (optional for MVP, currently using mock user)
5. Get your Firebase config from Project Settings
6. Update `src/config/firebase.js` with your credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

### Step 3: Configure Google Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Cloud Vision API**
4. Create credentials (API Key)
5. Update `src/services/ocrService.js` with your API key:

```javascript
const GOOGLE_VISION_API_KEY = 'YOUR_ACTUAL_GOOGLE_VISION_API_KEY';
```

**Note:** Google Vision API offers 1,000 free units/month (enough for MVP testing).

### Step 4: Set Up Firestore Rules

In Firebase Console → Firestore Database → Rules, add:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{expenseId} {
      allow read, write: if true; // Change to proper auth in production
    }
  }
}
```

### Step 5: Run the App

```bash
# Start Expo development server
npm start

# Then press:
# - 'a' for Android emulator
# - 'i' for iOS simulator (Mac only)
# - 'w' for web browser
# - Scan QR code with Expo Go app on your phone
```

## ✨ Features

1. **📷 Scan Receipts**: Take photos or upload from gallery
2. **🤖 AI Extraction**: Automatically extracts merchant, amount, and date using Google Vision OCR
3. **💾 Store Data**: Saves expenses to Firebase Firestore
4. **📋 View List**: See all your expenses in a clean list
5. **📤 Export CSV**: Export all expenses for tax purposes
6. **🗑️ Delete**: Remove unwanted expenses

## 🔧 Tech Stack

- **Frontend**: React Native (Expo SDK 52)
- **Backend**: Firebase (Firestore)
- **OCR**: Google Cloud Vision API
- **Navigation**: React Navigation
- **State**: React Hooks (useState, useEffect)

## 💰 Monetization Ideas

- **Freemium**: Free for 10 receipts/month, $4.99/month unlimited
- **One-time Purchase**: $19.99 for lifetime access
- **Pro Features**: Multi-currency, category tagging, receipt search ($2.99/month add-on)

## ⚠️ Important Notes

### For MVP Testing:
- Currently uses a mock user ID (`demo-user-123`)
- All users share the same data (for testing only!)
- Add proper authentication before production

### Security Considerations:
- Never commit API keys to version control
- Use environment variables in production
- Implement Firebase Authentication
- Set up proper Firestore security rules

### Google Vision API Costs:
- First 1,000 units/month: FREE
- 1,001 - 5,000,000: $1.50 per 1,000 units
- Typical receipt = 1 unit

## 🐛 Troubleshooting

### "No space left on device" error:
```bash
# Clean npm cache and node_modules
rm -rf node_modules
rm -rf /root/.npm
npm install
```

### Camera permissions not working:
- Make sure you've added camera permissions in `app.json`
- On physical devices, grant permissions when prompted
- For simulators, use a physical device or test with image upload

### OCR not extracting data correctly:
- Ensure receipt image is clear and well-lit
- Try different angles
- Google Vision works best with high-contrast images

## 📝 Next Steps for Production

1. ✅ Add Firebase Authentication (Email/Google Sign-in)
2. ✅ Implement proper user isolation in Firestore
3. ✅ Add manual edit fields for OCR corrections
4. ✅ Add expense categories
5. ✅ Add receipt image storage (Firebase Storage)
6. ✅ Add monthly/yearly summaries
7. ✅ Add dark mode
8. ✅ Add multi-language support
9. ✅ Add receipt search functionality
10. ✅ Add cloud backup/sync

## 📄 License

MIT License - Feel free to use this for your own projects!

---

**Built with ❤️ for freelancers everywhere**
