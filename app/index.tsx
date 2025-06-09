
// This file now primarily serves as an entry point.
// The main redirection logic is handled in app/_layout.tsx based on authentication state.
// If the user is authenticated, they'll be sent to /(app)/home.
// If not, they'll be sent to /(auth)/login or onboarding if it's their first time (logic in _layout).

export default function StartPage() {
  // Optional: You could show a very brief loading indicator here if needed,
  // but SplashScreen should cover the initial app load.
  // The RootLayout will handle redirection.
  return null; 
  // Alternatively, if you want to be explicit and if onboarding is always the first step before auth check:
  // return <Redirect href="/onboarding" />;
  // However, the RootLayout and AuthContext should manage the flow to login/home correctly after checking auth status.
}
