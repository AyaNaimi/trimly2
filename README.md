# Trimly

Trimly is a mobile budgeting app built with React Native and Expo. It combines daily budget tracking, subscription monitoring, recurring payment reminders, email-based subscription detection, and multilingual onboarding in one app.

## Tech Stack

- React Native 0.81 and Expo SDK 54
- React 19
- React Navigation with stack and bottom tabs
- AsyncStorage for local persistence
- Supabase for authentication, profile data, sync, and edge functions
- Expo Notifications for billing and spending reminders
- Expo Auth Session for Google OAuth and Gmail access
- Lottie for animated splash and UI assets
- Victory Native, Skia, and SVG for reports and charts

## Main Features

- Budget dashboard with income, categories, spending progress, and quick transaction entry
- Category management with weekly and monthly budget periods
- Subscription manager with billing cycles, trials, cancellation state, and next charge insights
- Email scanner flow for detecting subscriptions from Gmail or manual scans
- Reports screen for spending and subscription analytics
- Transaction history with category-aware updates
- Login, guest mode, onboarding, and synced user state
- Light/dark theme support
- Language support for English, French, Spanish, German, Portuguese, and Italian
- Local and push-style notifications for upcoming payments and daily spending reminders

## Getting Started

```bash
npm install
npm start
```

Useful scripts:

```bash
npm run android
npm run ios
npm run web
npm run check-translations
```

## Environment Variables

Create a local `.env` file for secrets and public Expo config. The file is ignored by Git.

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_CLIENT_ID=
EXPO_PUBLIC_GMAIL_CLIENT_ID=
EXPO_PUBLIC_OUTLOOK_CLIENT_ID=
EXPO_PUBLIC_EMAIL_SCANNER_URL=http://localhost:3001
```

Google and Firebase platform config files may also be needed for native builds:

- `google-services.json` for Android
- `GoogleService-Info.plist` for iOS

See `ANDROID_GOOGLE_AUTH_SETUP.md`, `GOOGLE_AUTH_GMAIL_SETUP.md`, and `TEST_AUTH.md` for auth setup notes.

## Project Structure

```text
trimly/
|-- App.js
|-- app.json
|-- package.json
|-- src/
|   |-- components/
|   |-- context/
|   |   |-- AppContext.js
|   |   |-- LanguageContext.js
|   |   `-- ThemeContext.js
|   |-- data/
|   |-- hooks/
|   |-- locales/
|   |-- navigation/
|   |-- screens/
|   |   |-- Auth/
|   |   |-- Home/
|   |   |-- Onboarding/
|   |   |-- Reports/
|   |   |-- Settings/
|   |   |-- Splash/
|   |   |-- Subscriptions/
|   |   |-- Transactions/
|   |   `-- __tests__/
|   |-- services/
|   |-- theme/
|   `-- utils/
|-- supabase/
|   `-- functions/
|       `-- scan-emails/
`-- scripts/
```

## App Flow

1. App starts with the animated splash screen.
2. Users can log in with Supabase/Google or continue in guest mode.
3. First-time users complete onboarding and budget setup.
4. The main app opens to the budget dashboard with tabs for reports, transactions, subscriptions, and settings.
5. Subscription edits trigger notification scheduling and local state persistence.
6. Authenticated users can sync profile, budget, transaction, subscription, and scan data.

## Email Subscription Scanning

Trimly supports email subscription discovery through shared services and a Supabase edge function:

- OAuth scopes are configured in `src/services/googleAuthService.js`.
- Subscription normalization and insights live in `src/services/emailService.js`.
- The Supabase edge function is in `supabase/functions/scan-emails/`.

The scanner estimates service name, price, billing cycle, trial state, next billing date, and suggested alternatives when available.

## Notifications

Notifications are scheduled when subscription data changes:

- Two days before a charge
- One day before a charge
- On the charge date
- Before trial expiration when trial data is available
- Daily spending reminders based on the selected notification level

## Development Notes

- Keep `.env` out of Git.
- Run `npm run check-translations` after editing locale files.
- Use Expo commands for local development and native testing.
- Generated folders such as `node_modules/` should stay untracked.
