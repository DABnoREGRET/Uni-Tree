import { FontAwesome } from '@expo/vector-icons'; // Example Icon pack
import { Tabs } from 'expo-router';
import { CustomTabBar } from '../components/navigation'; // Import your CustomTabBar

export default function AppLayout() {
  return (
    <Tabs
      // Pass your custom TabBar component to the tabBar prop
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          headerShown: false, // Keep header hidden for main tab screens
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="redeem/index"
        options={{
          title: 'Redeem',
          headerShown: false, // Keep header hidden for main tab screens
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="gift" size={size} color={color} />
          ),
        }}
      />
       <Tabs.Screen
        name="tree/index"
        options={{
          title: 'My Tree',
          headerShown: false, // Keep header hidden for main tab screens
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="tree" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard/index"
        options={{
          title: 'Ranking',
          headerShown: false, // Keep header hidden for main tab screens
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          headerShown: false, // Keep header hidden for main tab screens
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
       {/* Hidden screens (or screens opened programmatically) - these will now show a header with a back button by default */}
       <Tabs.Screen 
         name="redeem/[itemId]" 
         options={{ 
           href: null, 
           headerShown: false, // No header for this detail screen by default
         }} 
       />
       <Tabs.Screen 
         name="profile/settings" 
         options={{ 
           href: null, 
           headerShown: false, // Will use CustomHeader in the component
         }} 
       />
       <Tabs.Screen 
         name="profile/privacy-policy" 
         options={{
           href: null, 
           headerShown: false, // Will use CustomHeader in the component
         }} 
       />
       <Tabs.Screen 
         name="profile/about"
         options={{
           href: null,
           headerShown: false, // Will use CustomHeader in the component
         }}
       />
       <Tabs.Screen 
         name="notifications/index" 
         options={{ 
           href: null, 
           headerShown: false, // Will use CustomHeader in the component, or Stack.Screen in component
         }} 
       />
       <Tabs.Screen 
         name="forest/index" 
         options={{ 
           href: null, 
           headerShown: false, // forest/index has its own title display
         }} 
       />
       <Tabs.Screen 
         name="profile/acknowledgements"
         options={{
           href: null,
           headerShown: false, // Will use CustomHeader in the component
         }} 
       />
       <Tabs.Screen 
         name="profile/terms-and-service"
         options={{
           href: null,
           headerShown: false, // Will use CustomHeader in the component
         }} 
       />

    </Tabs>
  );
} 