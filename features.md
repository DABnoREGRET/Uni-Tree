I. Core App Structure & Navigation:
Onboarding: A multi-slide onboarding flow for new users.
Authentication Flow:
Screens for Login, Registration (with school email, student ID, and password validation), Forgot Password, and Update Password (after email link).
Dedicated AuthScreenLayout for a consistent look and feel.
Main App Navigation (Tab-Based):
Custom animated bottom tab bar for navigating: Home, Redeem, My Tree, Leaderboard, and Profile.
Dynamic tab bar visibility (hides on scroll).
Stack Navigation: For screens nested within the main tabs (e.g., reward details, settings pages).
Consistent UI:
ScreenWrapper for standard screen layout, safe area handling, and scroll functionality.
CustomHeader for a uniform header with back navigation on sub-screens.
II. User Authentication & Management:
Email/Password Authentication: Secure sign-up, sign-in, sign-out.
Password Management:
Forgot password functionality (sends a reset link).
Ability for authenticated users to change their current password.
Session Persistence: User sessions are managed and persisted securely.
III. User Profile & Data:
Profile Screen: Displays user information (name, student ID, email, avatar).
Avatar Upload: Users can select an image from their device, which is then uploaded to Supabase Storage and set as their profile picture.
User Statistics: Tracks and displays total points and UniTree level.
Data Synchronization: User profile and stats are fetched from and updated to the Supabase backend.
IV. Gamification & Engagement:
UniTree (Virtual Tree):
A central virtual tree that users nurture.
The tree levels up based on accumulated points.
Visual representation of the tree changes according to its level.
Displays progress towards the next tree level.
Point System:
Users earn points primarily by connecting to a designated school WiFi network.
The system tracks the duration of the WiFi connection.
The Home screen displays the current WiFi connection status and a live stopwatch for the current session.
Rewards System:
Users can redeem their points for various rewards listed in the app.
A special high-cost reward allows users to "Plant a Real Tree," with a system to track pending redemptions.
"My Real-World Forest": A screen to display the collection of real trees planted by the user (currently shows an empty/mock state).
Leaderboard: Ranks users based on their total points and tree level.
Notifications:
In-app notification system for alerts, rewards, tree updates, etc.
Users can mark notifications as read or delete them.
Notifications can navigate to relevant sections of the app.
V. Home Dashboard:
A central hub displaying:
Personalized greeting and user avatar.
Current WiFi connection status.
Total accumulated points.
Current UniTree level and progress.
A chart visualizing weekly points earned.
Quick navigation to other features like "My Real Forest."
VI. Settings & Information:
Account Settings: Options to change password and log out.
Notification Settings: UI for toggling push notifications (full functionality might depend on further implementation).
Legal & App Info: Screens for Privacy Policy, About UniTree, and Acknowledgements.
VII. Technical Foundation:
Backend: Supabase (Authentication, Database, Storage, Edge Functions for specific actions like reward redemption and WiFi logging).
Frontend: React Native with Expo.
Language: TypeScript.
Routing: Expo Router for file-system based navigation.
State Management: React Context API for managing global state related to auth, user data, app-wide data (rewards/notifications), and tab bar visibility.
UI Components: A library of reusable custom components for buttons, text inputs, layouts, etc.
Permissions: Handles permissions for location (to verify WiFi SSID on Android) and media library (for avatar uploads).