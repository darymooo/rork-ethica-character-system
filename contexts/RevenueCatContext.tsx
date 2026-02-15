import createContextHook from '@nkzw/create-context-hook';
import Purchases, { CustomerInfo, PurchasesOfferings } from 'react-native-purchases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';

const ENTITLEMENT_ID = 'Ethica Pro';

function getRCToken() {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

if (Platform.OS !== 'web') {
  const apiKey = getRCToken();
  if (apiKey) {
    Purchases.configure({ apiKey });
  } else {
    console.error('RevenueCat API key not found');
  }
}

export const [RevenueCatProvider, useRevenueCat] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const previousProStatus = useRef<boolean | null>(null);

  useEffect(() => {
    const apiKey = getRCToken();
    if (apiKey && Platform.OS !== 'web') {
      try {
        Purchases.configure({ apiKey });
        setIsInitialized(true);
        console.log('RevenueCat initialized successfully');
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
      }
    } else if (Platform.OS === 'web') {
      setIsInitialized(true);
      console.log('RevenueCat: Web mode - features will be simulated');
    }
  }, []);

  const customerInfoQuery = useQuery({
    queryKey: ['revenuecat-customer-info'],
    queryFn: async (): Promise<CustomerInfo | null> => {
      if (Platform.OS === 'web') {
        return null;
      }
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        return customerInfo;
      } catch (error) {
        console.error('Error fetching customer info:', error);
        return null;
      }
    },
    enabled: isInitialized && Platform.OS !== 'web',
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) return;

    const currentProStatus = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    if (previousProStatus.current === null) {
      previousProStatus.current = currentProStatus;
      return;
    }

    previousProStatus.current = currentProStatus;
  }, [customerInfoQuery.data]);

  const offeringsQuery = useQuery({
    queryKey: ['revenuecat-offerings'],
    queryFn: async (): Promise<PurchasesOfferings | null> => {
      if (Platform.OS === 'web') {
        return null;
      }
      try {
        const offerings = await Purchases.getOfferings();
        return offerings;
      } catch (error) {
        console.error('Error fetching offerings:', error);
        return null;
      }
    },
    enabled: isInitialized && Platform.OS !== 'web',
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      if (Platform.OS === 'web') {
        throw new Error('Purchases not available on web');
      }

      const offerings = offeringsQuery.data;
      if (!offerings?.current) {
        throw new Error('No offerings available');
      }

      const pkg = offerings.current.availablePackages.find(
        p => p.identifier === packageId
      );

      if (!pkg) {
        throw new Error('Package not found');
      }

      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        return customerInfo;
      } catch (error: any) {
        if (error.userCancelled) {
          throw new Error('Purchase cancelled');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenuecat-customer-info'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (Platform.OS === 'web') {
        throw new Error('Restore not available on web');
      }
      try {
        const customerInfo = await Purchases.restorePurchases();
        return customerInfo;
      } catch (error) {
        console.error('Error restoring purchases:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenuecat-customer-info'] });
    },
  });

  const isPro = (): boolean => {
    if (Platform.OS === 'web') {
      return false;
    }
    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) return false;
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  };

  const getProExpirationDate = (): Date | null => {
    if (Platform.OS === 'web') {
      return null;
    }
    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) return null;
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) return null;
    return entitlement.expirationDate ? new Date(entitlement.expirationDate) : null;
  };

  const purchase = async (packageId: string) => {
    return purchaseMutation.mutateAsync(packageId);
  };

  const restorePurchases = async () => {
    return restoreMutation.mutateAsync();
  };

  return {
    isInitialized,
    isPro: isPro(),
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    isLoadingCustomerInfo: customerInfoQuery.isLoading,
    isLoadingOfferings: offeringsQuery.isLoading,
    purchase,
    restorePurchases,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchaseError: purchaseMutation.error,
    restoreError: restoreMutation.error,
    getProExpirationDate,
  };
});
