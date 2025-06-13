import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthScreenLayout } from '../components/layouts';
import { Colors, Fonts, FontSizes, LineHeights } from '../constants';

export default function TermsAndServiceScreen() {
  const router = useRouter();

  return (
    <AuthScreenLayout
      formTitle="Terms and Service"
      showBackButton={true}
      onBackPress={() => router.back()}
      isSignup={true}
      showMascot={false}
      topContentSize="small"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: 2025/06/06</Text>

          <Text style={styles.heading}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing or using UniTree, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this app.
          </Text>

          <Text style={styles.heading}>2. Use License</Text>
          <Text style={styles.paragraph}>
            Permission is granted to temporarily download one copy of the materials (information or software) on UniTree&#39;s app for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </Text>

          <Text style={styles.heading}>3. Limitations</Text>
          <Text style={styles.paragraph}>
            In no event shall UniTree or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on UniTree&#39;s app.
          </Text>

          <Text style={styles.heading}>4. Revisions and Errata</Text>
          <Text style={styles.paragraph}>
            The materials appearing on UniTree&#39;s app could include technical, typographical, or photographic errors. UniTree does not warrant that any of the materials on its app are accurate, complete, or current.
          </Text>

          <Text style={styles.heading}>5. Links</Text>
          <Text style={styles.paragraph}>
            UniTree has not reviewed all of the sites linked to its app and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by UniTree of the site.
          </Text>

          <Text style={styles.heading}>6. Governing Law</Text>
          <Text style={styles.paragraph}>
            Any claim relating to UniTree&#39;s app shall be governed by the laws of Vietnam without regard to its conflict of law provisions.
          </Text>

          <Text style={styles.heading}>7. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms, please contact us at <Text style={{color: Colors.primary}}>Greenityclub@gmail.com</Text>
          </Text>
          <Text style={styles.paragraph}>
            Or contact us on <Text style={{color: Colors.primary}}>https://www.facebook.com/greenityclub.vituonglaixanh</Text>
          </Text>
        </View>
      </ScrollView>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  content: {
    backgroundColor: 'transparent',
  },
  lastUpdated: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.white,
    marginBottom: 20,
    textAlign: 'right',
  },
  heading: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.Poppins.Bold,
    color: Colors.white,
    marginTop: 15,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.Poppins.Regular,
    color: Colors.textWhite,
    lineHeight: LineHeights.base,
    marginBottom: 10,
  },
}); 