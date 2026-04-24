# ReceiptSnap - Architecture Document

## Overview

ReceiptSnap is a mobile-first receipt tracking application built with React Native and Expo, designed specifically for freelancers and independent contractors to manage business expenses for tax purposes.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ReceiptSnap App                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Presentation Layer                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │  Home    │ │ Summary  │ │ Profile  │ │ Capture  │   │   │
│  │  │  Screen  │ │ Screen   │ │ Screen   │ │ Screen   │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Context Layer                       │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │              AuthContext (Global State)           │   │   │
│  │  │  - user, expenses, isPremium, canAddReceipt       │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Service Layer                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │  Auth    │ │ Expense  │ │   OCR    │ │ Storage  │   │   │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   Firebase   │  │   Firebase   │  │   Google     │
    │    Auth      │  │   Firestore  │  │   Vision     │
    │              │  │              │  │     API      │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                  │
            │                  ▼
            │          ┌──────────────┐
            │          │   Firebase   │
            │          │   Storage    │
            │          └──────────────┘
            │
            ▼
    ┌──────────────┐
    │ Apple/Google │
    │   In-App     │
    │   Purchases  │
    └──────────────┘
```

## Data Flow

### 1. User Authentication Flow
```
User enters credentials → AuthService → Firebase Auth
                              ↓
                    Create/Update user doc
                              ↓
                    Firestore (users collection)
                              ↓
                    AuthContext updates state
                              ↓
                    Navigate to Home screen
```

### 2. Receipt Capture & OCR Flow
```
User captures/selects image → CaptureScreen
                                    ↓
                         processImageForOCR()
                                    ↓
                         extractTextFromImage()
                                    ↓
                         Google Vision API
                                    ↓
                         parseReceiptData()
                                    ↓
                         Navigate to EditReceiptScreen
                                    ↓
                         User reviews/edits fields
                                    ↓
                         uploadReceiptImage() → Firebase Storage
                                    ↓
                         createExpense() → Firestore
                                    ↓
                         AuthContext refreshes expenses
                                    ↓
                         Return to Home screen
```

### 3. Expense List & Search Flow
```
HomeScreen loads → useAuth() provides expenses
                          ↓
                   Filter by search query
                          ↓
                   Render FlatList
                          ↓
                   Tap expense → Open edit modal
                          ↓
                   Long press → Delete confirmation
```

### 4. Premium Upgrade Flow
```
User taps upgrade → Show PaywallScreen
                          ↓
                   Display usage & features
                          ↓
                   User confirms purchase
                          ↓
                   (Simulated) Update user doc
                          ↓
                   Set isPremium: true
                          ↓
                   Unlock premium features
```

## State Management

### Global State (AuthContext)
- `user`: Current authenticated user with premium status
- `firebaseUser`: Raw Firebase auth user
- `expenses`: All user expenses (cached)
- `isPremium`: Derived from user.isPremium
- `currentMonthReceiptCount`: Count for limit checking
- `canAddReceipt`: Derived (premium OR under limit)
- `loading`: Auth loading state

### Local State
- Screen-specific UI state (search query, modals, etc.)
- Form state in EditReceiptScreen
- Processing state in CaptureScreen

## Key Design Decisions

### 1. Why Expo?
- Fast development with hot reload
- Built-in camera, image picker, file system modules
- Easy deployment with EAS Build
- Cross-platform from single codebase

### 2. Why Firebase?
- Real-time sync out of the box
- Offline support for mobile
- Integrated auth, database, storage
- Scales automatically
- No backend infrastructure needed

### 3. Why Google Vision API?
- Best-in-class OCR accuracy
- Handles various receipt formats
- Supports multiple languages
- Pay-per-use pricing (free tier available)

### 4. Why Editable OCR Results?
- OCR is never 100% accurate
- Users need to verify before saving
- Builds trust in the system
- Reduces frustration from errors

### 5. Why Monthly Limits?
- Encourages upgrade without blocking core functionality
- 20 receipts/month sufficient for many freelancers
- Clear value proposition for premium
- Predictable costs for infrastructure

## Security Considerations

### Client-Side
- Environment variables not exposed in bundle
- Firebase rules enforce server-side security
- No sensitive data in local storage
- HTTPS for all API calls

### Server-Side (Firebase Rules)
- Users can only access their own data
- Expense userId must match auth user
- Storage paths scoped to user ID
- Rate limiting via Firebase default rules

## Performance Optimizations

1. **Image Processing**: Resize images before OCR to reduce API payload
2. **Query Optimization**: Index Firestore queries on userId and date
3. **Local Caching**: Expenses cached in context to avoid refetching
4. **Lazy Loading**: FlatList for expense list rendering
5. **Debounced Search**: Prevent excessive filtering on keystroke

## Error Handling Strategy

1. **Network Errors**: Retry logic with exponential backoff
2. **API Failures**: Graceful fallback (manual entry for OCR failures)
3. **Validation**: Client-side form validation before submission
4. **User Feedback**: Clear error messages with actionable steps
5. **Logging**: Console logging for debugging (remove in production)

## Testing Strategy

### Unit Tests (Recommended additions)
- OCR parsing functions
- Date/amount extraction patterns
- Category color mapping

### Integration Tests (Recommended additions)
- Firebase service functions
- Auth flow with test users
- Expense CRUD operations

### E2E Tests (Recommended additions)
- Complete receipt capture flow
- Search and filter functionality
- Premium upgrade simulation

## Deployment Checklist

- [ ] Configure app.json with production values
- [ ] Set up Firebase production project
- [ ] Configure Firebase rules for production
- [ ] Enable App Store Connect / Google Play Console
- [ ] Set up RevenueCat for subscriptions (production)
- [ ] Configure EAS Build profiles
- [ ] Add privacy policy and terms of service
- [ ] Test on physical devices (iOS and Android)
- [ ] Submit for app store review
