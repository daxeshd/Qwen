# ReceiptSnap - Freelancer Receipt Tracker

A mobile-first receipt tracking app designed for freelancers and independent contractors. Turn receipt photos into clean, editable expenses and export them for tax time.

## Features

### Core MVP
- ✅ Sign in with Firebase Auth
- ✅ Upload or snap receipt photos
- ✅ Extract text with Google Vision OCR
- ✅ Parse and save: merchant, date, amount, category, notes
- ✅ Edit extracted fields before saving
- ✅ Searchable expense list
- ✅ Monthly totals and category breakdown
- ✅ CSV export (Premium)

### Monetization
- **Free Plan**: Up to 20 receipts per month
- **Premium Plan**: $2.99/month
  - Unlimited receipts
  - CSV export
  - Tax summary view
  - Backup sync
  - Premium badge

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Auth + Firestore + Storage)
- **OCR**: Google Vision API
- **Charts**: react-native-chart-kit

## Project Structure

```
receiptsnap/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── _layout.tsx
│   │   ├── home.tsx              # Main expense list
│   │   ├── summary.tsx           # Charts & summaries
│   │   └── profile.tsx           # User settings
│   ├── signin/
│   │   ├── _layout.tsx
│   │   └── signin.tsx
│   ├── edit-receipt/
│   │   └── edit-receipt.tsx
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Entry point
│   └── capture.tsx               # Camera/gallery capture
├── src/
│   ├── components/               # Reusable UI components
│   ├── screens/                  # Screen components
│   │   ├── SignInScreen.tsx
│   │   ├── EditReceiptScreen.tsx
│   │   ├── SummaryScreen.tsx
│   │   └── PaywallScreen.tsx
│   ├── services/                 # Backend services
│   │   ├── firebase.ts
│   │   ├── authService.ts
│   │   ├── expenseService.ts
│   │   ├── ocrService.ts
│   │   └── storageService.ts
│   ├── context/                  # React Context providers
│   │   └── AuthContext.tsx
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   │   └── constants.ts
│   └── types/                    # TypeScript types
│       └── index.ts
├── assets/                       # Images, fonts, etc.
├── app.json                      # Expo configuration
├── package.json
└── tsconfig.json
```

## Database Schema

### users collection
```typescript
{
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isPremium: boolean;
  subscriptionExpiry?: Timestamp;
  createdAt: Timestamp;
}
```

### expenses collection
```typescript
{
  id: string;
  userId: string;
  merchant: string;
  date: string;           // ISO format YYYY-MM-DD
  amount: number;
  category: string;
  notes: string;
  imageUrl?: string;      // Firebase Storage URL
  ocrText?: string;       // Raw OCR text
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Setup Instructions

### Prerequisites
1. Node.js 18+ installed
2. Expo CLI: `npm install -g expo-cli`
3. Firebase project created
4. Google Cloud project with Vision API enabled

### Step 1: Clone and Install
```bash
cd receiptsnap
npm install
```

### Step 2: Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create Firestore database
5. Create Storage bucket
6. Download config and update `app.json`:

```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "YOUR_API_KEY",
      "firebaseAuthDomain": "YOUR_PROJECT.firebaseapp.com",
      "firebaseProjectId": "YOUR_PROJECT_ID",
      "firebaseStorageBucket": "YOUR_PROJECT.appspot.com",
      "firebaseMessagingSenderId": "YOUR_SENDER_ID",
      "firebaseAppId": "YOUR_APP_ID"
    }
  }
}
```

### Step 3: Google Vision API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Cloud Vision API
3. Create API key
4. Add to `.env` file:

```bash
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_vision_api_key
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 4: Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 5: Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /receipts/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### Step 6: Run the App
```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on physical device (scan QR code from Expo Go)
npm start
```

## Test Checklist

### Authentication
- [ ] Sign up with email/password works
- [ ] Sign in with existing account works
- [ ] Sign out clears session
- [ ] Auth state persists across app restarts

### Receipt Capture
- [ ] Camera permission requested correctly
- [ ] Photo capture works
- [ ] Gallery selection works
- [ ] Document import works
- [ ] Manual entry option available

### OCR Processing
- [ ] Image preprocessing improves quality
- [ ] Text extraction works with Google Vision
- [ ] Merchant name parsed correctly
- [ ] Date parsed in various formats
- [ ] Amount extracted accurately
- [ ] Fallback to manual entry on OCR failure

### Expense Management
- [ ] All fields editable before save
- [ ] Category selection works
- [ ] Notes field accepts multiline input
- [ ] Save creates expense record
- [ ] Image uploads to Firebase Storage
- [ ] Expense appears in list after save
- [ ] Edit existing expense works
- [ ] Delete expense with confirmation
- [ ] Long press to delete works

### Search & Filter
- [ ] Search by merchant name
- [ ] Search by category
- [ ] Search by notes
- [ ] Empty state shows when no results

### Summary & Charts
- [ ] Monthly total calculated correctly
- [ ] Receipt count accurate
- [ ] Category breakdown displays
- [ ] Bar chart renders properly
- [ ] Month selector works
- [ ] Year selector works

### Premium Features
- [ ] Free plan limited to 20 receipts/month
- [ ] Paywall shows when limit reached
- [ ] Paywall shows for premium features
- [ ] Upgrade flow works (simulated)
- [ ] Premium badge displays for subscribers
- [ ] CSV export works for premium users
- [ ] Tax summary visible for premium users

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Invalid inputs show error messages
- [ ] Loading states display during operations
- [ ] Empty states for no data

### UI/UX
- [ ] App responsive on different screen sizes
- [ ] Touch targets appropriately sized
- [ ] Colors meet accessibility standards
- [ ] Loading spinners show during async ops
- [ ] Success/error alerts provide feedback

## Next 5 Features After MVP

1. **Recurring Expenses**
   - Track subscriptions and recurring bills
   - Auto-create monthly expenses
   - Predict upcoming expenses

2. **Multi-Currency Support**
   - Detect currency from receipt
   - Convert to home currency
   - Track exchange rates

3. **Mileage Tracking**
   - GPS-based trip logging
   - IRS mileage rate calculation
   - Combine with receipt tracking

4. **Receipt Sharing**
   - Share expenses with accountant
   - Collaborative workspaces
   - Team expense management

5. **Smart Categorization**
   - ML-based auto-categorization
   - Learn from user corrections
   - Merchant-based rules

## Monetization Implementation Notes

The current implementation simulates purchases. For production:

1. **Integrate RevenueCat** for cross-platform subscriptions
2. **Add Store Kit** (iOS) and **Billing Library** (Android)
3. **Implement receipt validation** on backend
4. **Add restore purchases** functionality
5. **Track subscription status** in Firestore

## License

MIT License - See LICENSE file for details
