import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '../../components/layouts';
import { UniversalHeader } from '../../components/navigation'; // Import UniversalHeader
import { Colors, Fonts, FontSizes, LineHeights } from '../../constants';
// import { useTabBarVisibility } from '../../contexts/TabBarVisibilityContext'; // No longer needed

export default function PrivacyPolicyScreen() {
  // const { setIsTabBarVisible } = useTabBarVisibility(); // No longer needed

  /* useEffect(() => { // This effect is no longer needed, CustomTabBar handles it
    setIsTabBarVisible(false); 
    return () => {
      setIsTabBarVisible(true); 
    };
  }, [setIsTabBarVisible]); */

  return (
    <ScreenWrapper withScrollView={false} applyTopInset={false} style={{backgroundColor: Colors.white}}>
      <StatusBar style="light" />
      {/* <Stack.Screen options={{ title: 'Privacy Policy' }} /> Removed Stack.Screen */}
      <UniversalHeader title="Privacy Policy" showBackButton={true} />
      
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: 2025/06/06</Text>

          <Text style={styles.heading}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to UniTree! We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at [Contact Email/Link].
          </Text>

          <Text style={styles.heading}>2. Information We Collect</Text>
          <Text style={styles.paragraph}>
            As a user of UniTree, we may collect the following information:
          </Text>
          <Text style={styles.listItem}>- Name, Email, Student ID: Provided during registration.</Text>
          <Text style={styles.listItem}>- WiFi Connection Data: We collect information about your connection to the designated campus WiFi network (e.g., SSID, connection duration) to award points. We do not monitor your internet traffic.</Text>
          <Text style={styles.listItem}>- Location Data (Optional): If you grant permission, we use location data solely to help confirm your connection to the campus WiFi. This data is not stored long-term or used for other purposes.</Text>
          <Text style={styles.listItem}>- App Usage Data: We collect information about how you interact with our app to improve its functionality and user experience.</Text>
          <Text style={styles.listItem}>- Device Information: We may collect information about the device you use to access UniTree, such as device model and operating system, to help with troubleshooting and optimization.</Text>
          
          <Text style={styles.heading}>3. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect in various ways, including to:
          </Text>
          <Text style={styles.listItem}>- Provide, operate, and maintain our app</Text>
          <Text style={styles.listItem}>- Improve, personalize, and expand our app</Text>
          <Text style={styles.listItem}>- Understand and analyze how you use our app</Text>
          <Text style={styles.listItem}>- Award points for WiFi connection and manage your UniTree progress</Text>
          <Text style={styles.listItem}>- Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the app, and for marketing and promotional purposes (with your consent where required)</Text>
          <Text style={styles.listItem}>- Process your transactions and manage your rewards</Text>
          <Text style={styles.listItem}>- Find and prevent fraud</Text>

          <Text style={styles.heading}>4. Sharing Your Information</Text>
          <Text style={styles.paragraph}>
            We do not sell your personal information. We may share information with third-party vendors and service providers that perform services for us or on our behalf and require access to such information to do that work. Examples include: data analytics, payment processing (if applicable), and hosting services.
          </Text>
          <Text style={styles.paragraph}>
            We may also disclose your information if required by law or in response to valid requests by public authorities.
          </Text>

          <Text style={styles.heading}>5. Data Security</Text>
          <Text style={styles.paragraph}>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
          </Text>

          <Text style={styles.heading}>6. Your Data Rights</Text>
          <Text style={styles.paragraph}>
            Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. Please contact us to exercise these rights.
          </Text>

          <Text style={styles.heading}>7. Children&#39;s Privacy</Text>
          <Text style={styles.paragraph}>
            Our service is not intended for individuals under the age of 13 (or a higher age threshold depending on the jurisdiction). We do not knowingly collect personal identifiable information from children. If you become aware that a child has provided us with personal information, please contact us.
          </Text>

          <Text style={styles.heading}>8. Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this privacy policy from time to time. The updated version will be indicated by an updated &#39;Last Updated&#39; date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.
          </Text>

          <Text style={styles.heading}>9. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions or comments about this notice, you may email us at <Text style={{color: Colors.primary}}>Greenityclub@gmail.com</Text>
          </Text>
          <Text style={styles.paragraph}>
          Or contact us on <Text style={{color: Colors.primary}}>https://www.facebook.com/greenityclub.vituonglaixanh</Text>
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  content: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 10,
  },
  lastUpdated: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLighter,
    marginBottom: 20,
    textAlign: 'right',
  },
  heading: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.Bold,
    color: Colors.text,
    marginTop: 15,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    lineHeight: LineHeights.base,
    marginBottom: 10,
  },
  listItem: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textLight,
    lineHeight: LineHeights.base,
    marginBottom: 5,
    marginLeft: 10,
  },
}); 