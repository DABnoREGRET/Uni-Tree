# Greenity UniTree App 🌱

Welcome to Greenity UniTree, a mobile application designed to foster environmental awareness and community engagement at Greenwich Vietnam, Hanoi Campus. This app gamifies eco-friendly actions, primarily by rewarding students for connecting to the campus Wi-Fi, and allows them to grow a virtual tree and redeem points for real-world tree planting.

This project is built with Expo (React Native) and utilizes Supabase for its backend (Auth, Database, Storage, Edge Functions). It supports email/password authentication and runs on both iOS and Android.

## Features ✨

*   **Authentication:** Secure user sign-up, login, and sign-out using Supabase Auth (Email/Password).
*   **Password Management:** Includes functionality for password recovery and reset.
*   **Onboarding & Permissions:** A multi-page onboarding flow that clearly explains required permissions and lets users enable them. Push-notification permission is optional and clearly labelled.
*   **Home Dashboard:** Displays user's virtual tree level, points, weekly points chart, current Wi-Fi connection status, and quick navigation to other app sections.
*   **Wi-Fi Connection Tracking:** Automatically detects connection to designated school Wi-Fi (SSID & BSSID based) and tracks connection duration to award points.
*   **Point System:** Users earn points based on their connection time to campus Wi-Fi.
*   **Virtual UniTree:** Users grow a virtual tree that levels up based on accumulated points.
*   **Redeem Rewards:**
    *   **Digital Vouchers:** (Future Scope - based on `rewards` table structure) Users can redeem points for digital vouchers or other items.
    *   **Plant a Real Tree:** Users can spend a significant amount of points to have a real tree planted, making a tangible environmental impact.
*   **My Real-World Forest:** A dedicated section to view the collection of real trees planted by the user.
*   **Leaderboard:** Displays rankings of users based on their total points.
*   **User Profile:**
    *   View and manage user information (name, student ID).
    *   Upload and update profile avatar (stored in Supabase Storage).
    *   View key stats like total points and tree level.
*   **In-App & Push Notifications (Optional):** System for delivering important updates and alerts (e.g., reward redemption, tree level up). Users can opt-out of push notifications.
*   **Settings:**
    *   Change account password.
    *   Manage notification preferences (placeholder).
    *   Access legal information (Privacy Policy, Acknowledgements).
    *   View app information (About UniTree, Version).
*   **Location Services:** (Optional) Used to improve accuracy of Wi-Fi detection on certain platforms.
*   **Account Deletion:** Users can permanently delete their account (profile data + Supabase Auth user) from the Settings screen.

## Tech Stack 🛠️

*   **Frontend:**
    *   React Native
    *   Expo (SDK, Router, Notifications, Location, Secure Store, Image Picker)
    *   TypeScript
*   **Backend & Database:**
    *   Supabase (Authentication, PostgreSQL Database, Storage, Edge Functions - if any)
*   **State Management:**
    *   React Context API (`AuthContext`, `UserDataContext`, `AppContext`, `TabBarVisibilityContext`)
*   **Navigation:**
    *   Expo Router (File-system based routing)
*   **UI & Styling:**
    *   Custom UI Components
    *   FontAwesome Icons (`@expo/vector-icons`)
    *   Stylesheet for styling
*   **Utilities:**
    *   `@react-native-community/netinfo` (Network information)
    *   `react-native-chart-kit` (For displaying charts on the home screen)

## Getting Started 🚀

### Prerequisites

*   An IDE (like VS Code with the Expo Tools extension).
*   Node.js (LTS version recommended).
*   Yarn or npm.
*   An account with [Supabase](https://supabase.io/).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd greenityUniTree
    ```

2.  **Create Environment File:**
    Create a `.env` file in the root of the project and add your Supabase credentials:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    You can find these in your Supabase project settings.

3.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

4.  **Set up Supabase Backend:**
    *   Ensure your Supabase project has the necessary tables. Key tables include:
        *   `profiles` (for user public data, linked to `auth.users`)
        *   `user_stats` (for points, tree level, etc.)
        *   `rewards` (for redeemable items)
        *   `user_rewards` (to track redeemed items - if applicable)
        *   `points_log` (to track points earned over time and daily aggregates)
        *   `notifications` (for user-specific notifications)
        *   `real_tree_redemptions` (to track requests for planting real trees)
    *   Apply any database migrations located in the `supabase/migrations` directory if provided.
    *   Set up Row Level Security (RLS) policies on your Supabase tables to ensure data security.
    *   Configure Supabase Auth (e.g., set up email templates, redirect URLs for password recovery `exp://127.0.0.1:8081/--/update-password` for local dev).

5.  **Start the development server:**
    ```bash
    npx expo start
    ```
    This will open the Expo Developer Tools in your browser. You can then run the app on:
    *   An Android emulator or physical device.
    *   An iOS simulator or physical device (requires macOS).
    *   Web browser (experimental, some native features might not work perfectly).

## Project Structure 📁

```
greenityUniTree/
├── app/                    # Main application code
│   ├── (app)/              # Authenticated screens (tabs, stack navigators)
│   │   ├── home/
│   │   ├── redeem/
│   │   ├── tree/
│   │   ├── leaderboard/
│   │   ├── profile/
│   │   ├── notifications/
│   │   └── forest/
│   ├── (auth)/             # Authentication screens (login, register, etc.)
│   ├── components/         # Reusable UI components
│   │   ├── layouts/
│   │   ├── navigation/
│   │   └── ui/
│   ├── constants/          # Colors, fonts, layout, config
│   ├── contexts/           # Global state management (React Context)
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Supabase client setup, API calls
│   ├── utils/              # Utility functions
│   ├── _layout.tsx         # Root layout for the app
│   └── onboarding.tsx      # Onboarding screen
├── assets/                 # Static assets (images, fonts)
├── credentials/            # Credentials files (e.g. for Android keystore, should be in .gitignore)
├── supabase/               # Supabase specific files (migrations, functions if any)
│   ├── .temp/              # Supabase CLI temp files
│   └── migrations/         # Database schema migrations (if used)
├── .env                    # Environment variables (ignored by Git)
├── .gitignore
├── app.json                # Expo app configuration
├── babel.config.js
├── eas.json                # EAS Build configuration
├── tsconfig.json           # TypeScript configuration
└── package.json
```

## Supabase Configuration Details

This application heavily relies on Supabase for its backend needs.

*   **Authentication:** Uses Supabase Auth for managing users, including email/password authentication. User metadata (like username and default avatar) is passed during sign-up and managed by Supabase triggers to populate the public `profiles` table.
*   **Database:** Supabase PostgreSQL is used to store:
    *   User profiles (`profiles`)
    *   User statistics like points, tree level, and progress (`user_stats`)
    *   Redeemable rewards and their costs (`rewards`)
    *   Records of points earned daily (`points_log`)
    *   User notifications (`notifications`)
    *   Requests for planting real trees (`real_tree_redemptions`)
*   **Storage:** Supabase Storage is used for user-uploaded avatars. Files are typically stored in a bucket named `avatars` under a path corresponding to the user's ID.
*   **Database Triggers & Functions:** (Assumed based on typical Supabase setups for profiles and stats)
    *   A trigger on `auth.users` likely populates the public `profiles` table with initial data.
    *   Functions might be used to calculate daily points, update tree levels, or manage leaderboard data. Refer to the `supabase/` directory or Supabase project dashboard for specifics.

## Contributing 🤝

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/YourFeature`).
6.  Open a Pull Request.

Please ensure your code adheres to the existing coding style and includes tests where appropriate.

## License 📄

Apache 2

---

**Privacy & Permissions**

• Foreground & background location are required solely to read the Wi-Fi SSID/BSSID for point tracking; GPS coordinates are never stored or transmitted.
• Push notifications are optional – the app functions fully without them.
• Users can review or revoke any permission later in their device settings.
