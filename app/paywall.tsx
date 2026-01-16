import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { X, Check, Sparkles, Zap } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import { useEthica } from '@/contexts/EthicaContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';

const PREMIUM_FEATURES = [
  'Create unlimited custom virtues',
  'Track your own principles',
  'Advanced analytics & insights',
  'Export your complete journal',
  'Priority support',
];

export default function Paywall() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const { state } = useEthica();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;

  const {
    offerings,
    purchase,
    restorePurchases,
    isPurchasing,
    isRestoring,
    isLoadingOfferings,
  } = useRevenueCat();

  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'annual'>('annual');
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);

  const monthlyPackage = offerings?.current?.availablePackages.find(
    pkg => pkg.identifier === '$rc_monthly'
  );
  const annualPackage = offerings?.current?.availablePackages.find(
    pkg => pkg.identifier === '$rc_annual'
  );

  const handleClose = () => {
    if (!state.hasSeenOnboarding || showDiscountModal) {
      router.replace('/virtue-selection');
    } else {
      setShowDiscountModal(true);
    }
  };

  const handleDiscountPurchase = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available',
        'Purchases are not available on the web version. Please use the mobile app to upgrade to Pro.'
      );
      return;
    }

    try {
      const packageId = '$rc_annual';
      await purchase(packageId);
      setShowDiscountModal(false);
      Alert.alert(
        'Success!',
        'Welcome to Ethica Pro! You now have access to all premium features.',
        [{ text: 'Continue', onPress: () => router.replace('/virtue-selection') }]
      );
    } catch (error: any) {
      if (error.message !== 'Purchase cancelled') {
        Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleSkipToApp = () => {
    setShowDiscountModal(false);
    router.replace('/virtue-selection');
  };

  const handlePurchase = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available',
        'Purchases are not available on the web version. Please use the mobile app to upgrade to Pro.'
      );
      return;
    }

    try {
      const packageId = selectedPackage === 'monthly' ? '$rc_monthly' : '$rc_annual';
      await purchase(packageId);
      Alert.alert(
        'Success!',
        'Welcome to Ethica Pro! You now have access to all premium features.',
        [{ text: 'Continue', onPress: () => router.replace('/virtue-selection') }]
      );
    } catch (error: any) {
      if (error.message !== 'Purchase cancelled') {
        Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleRestore = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available',
        'Restore purchases is not available on the web version.'
      );
      return;
    }

    try {
      await restorePurchases();
      Alert.alert(
        'Restore Complete',
        'Your purchases have been restored.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Could not restore purchases. Please try again.');
    }
  };

  const monthlyPrice = monthlyPackage?.product?.priceString || '$4.99';
  const annualPrice = annualPackage?.product?.priceString || '$39.99';
  const monthlySavings = monthlyPackage && annualPackage 
    ? Math.round((1 - (annualPackage.product.price / (monthlyPackage.product.price * 12))) * 100)
    : 33;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Sparkles size={32} color={theme.accent} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              Upgrade to Ethica Pro
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Unlock the full potential of your character development journey
            </Text>
            <View style={[styles.trialBadge, { backgroundColor: theme.accent }]}>
              <Zap size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.trialBadgeText}>3-Day Free Trial</Text>
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.checkContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Check size={16} color={theme.accent} strokeWidth={2.5} />
                </View>
                <Text style={[styles.featureText, { color: theme.text }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {isLoadingOfferings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading subscription options...
              </Text>
            </View>
          ) : (
            <View style={styles.pricingContainer}>
              <TouchableOpacity
                style={[
                  styles.pricingCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selectedPackage === 'annual' ? theme.accent : theme.border,
                    borderWidth: selectedPackage === 'annual' ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedPackage('annual')}
                activeOpacity={0.7}
                testID="annual-package"
              >
                {monthlySavings > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                    <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                      Save {monthlySavings}%
                    </Text>
                  </View>
                )}
                <View style={styles.pricingHeader}>
                  <Text style={[styles.planName, { color: theme.text }]}>Annual</Text>
                  <Text style={[styles.planPrice, { color: theme.text }]}>
                    {annualPrice}<Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/year</Text>
                  </Text>
                </View>
                <Text style={[styles.planDetail, { color: theme.textSecondary }]}>
                  Best value - less than $3.50/month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pricingCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selectedPackage === 'monthly' ? theme.accent : theme.border,
                    borderWidth: selectedPackage === 'monthly' ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedPackage('monthly')}
                activeOpacity={0.7}
                testID="monthly-package"
              >
                <View style={styles.pricingHeader}>
                  <Text style={[styles.planName, { color: theme.text }]}>Monthly</Text>
                  <Text style={[styles.planPrice, { color: theme.text }]}>
                    {monthlyPrice}<Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/month</Text>
                  </Text>
                </View>
                <Text style={[styles.planDetail, { color: theme.textSecondary }]}>
                  Billed monthly, cancel anytime
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text style={[styles.noPaymentText, { color: theme.textSecondary }]}>
            No payment required now
          </Text>
          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: theme.accent }]}
            onPress={handlePurchase}
            disabled={isPurchasing || isLoadingOfferings}
            activeOpacity={0.7}
            testID="subscribe-button"
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                Start Free Trial
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleClose}
            activeOpacity={0.7}
            testID="skip-button"
          >
            <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
              Skip and continue to app
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isRestoring}
            activeOpacity={0.7}
            testID="restore-button"
          >
            <Text style={[styles.restoreButtonText, { color: theme.textTertiary }]}>
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>
            3-day free trial, then {selectedPackage === 'annual' ? annualPrice : monthlyPrice}{selectedPackage === 'annual' ? '/year' : '/month'}. Cancel anytime.
          </Text>
        </View>
      </SafeAreaView>

      <Modal
        visible={showDiscountModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleSkipToApp}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Wait! Special Offer
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Don&apos;t miss this exclusive discount
                </Text>
              </View>

              <View style={[styles.discountCard, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                <View style={[styles.discountBadge, { backgroundColor: theme.accent }]}>
                  <Text style={styles.discountBadgeText}>LIMITED TIME</Text>
                </View>
                <Text style={[styles.discountTitle, { color: theme.text }]}>
                  40% OFF First Year
                </Text>
                <Text style={[styles.discountPrice, { color: theme.text }]}>
                  ${annualPackage ? (annualPackage.product.price * 0.6).toFixed(2) : '23.99'}
                  <Text style={[styles.originalPrice, { color: theme.textTertiary }]}> {annualPrice}</Text>
                </Text>
                <Text style={[styles.discountDetail, { color: theme.textSecondary }]}>
                  Less than $2/month • 3-day free trial included
                </Text>
              </View>

              <View style={styles.urgencyContainer}>
                <Text style={[styles.urgencyText, { color: theme.textSecondary }]}>
                  This offer expires when you leave this page
                </Text>
              </View>

              <View style={styles.modalFeatures}>
                {PREMIUM_FEATURES.slice(0, 3).map((feature, index) => (
                  <View key={index} style={styles.modalFeatureRow}>
                    <Check size={20} color={theme.accent} strokeWidth={2.5} />
                    <Text style={[styles.modalFeatureText, { color: theme.text }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.discountButton, { backgroundColor: theme.accent }]}
                onPress={handleDiscountPurchase}
                disabled={isPurchasing}
                activeOpacity={0.7}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.discountButtonText}>
                    Claim 40% Off
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSkipButton}
                onPress={handleSkipToApp}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalSkipButtonText, { color: theme.textSecondary }]}>
                  No thanks, continue to app
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  noPaymentText: {
    ...typography.sans.medium,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.serif.semibold,
    fontSize: sizes.xlarge,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  pricingContainer: {
    gap: 16,
    marginBottom: 24,
  },
  pricingCard: {
    padding: 20,
    borderRadius: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    ...typography.sans.semibold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planName: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  planPrice: {
    ...typography.sans.semibold,
    fontSize: 24,
  },
  planPeriod: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  planDetail: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  footer: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.sans.medium,
    fontSize: sizes.body,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    ...typography.sans.regular,
    fontSize: 13,
  },
  disclaimer: {
    ...typography.sans.regular,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  trialBadgeText: {
    ...typography.sans.semibold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 32,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  modalTitle: {
    ...typography.serif.semibold,
    fontSize: 32,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    textAlign: 'center',
  },
  discountCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  discountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  discountBadgeText: {
    ...typography.sans.semibold,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  discountTitle: {
    ...typography.serif.semibold,
    fontSize: 28,
  },
  discountPrice: {
    ...typography.sans.semibold,
    fontSize: 36,
  },
  originalPrice: {
    ...typography.sans.regular,
    fontSize: 24,
    textDecorationLine: 'line-through',
  },
  discountDetail: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    textAlign: 'center',
  },
  urgencyContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  urgencyText: {
    ...typography.sans.medium,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalFeatures: {
    gap: 16,
  },
  modalFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalFeatureText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    flex: 1,
  },
  modalFooter: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  discountButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  discountButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
    color: '#FFFFFF',
  },
  modalSkipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSkipButtonText: {
    ...typography.sans.medium,
    fontSize: sizes.body,
  },
});