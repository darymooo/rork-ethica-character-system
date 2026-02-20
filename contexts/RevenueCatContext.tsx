import createContextHook from '@nkzw/create-context-hook';
import type { CustomerInfo, PurchasesOfferings } from 'react-native-purchases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';

type PurchasesModule = typeof import('react-native-purchases');
type PurchasesType = PurchasesModule['default'];

let purchasesInstance: PurchasesType | null = null;

const getPurchases = (): PurchasesType | null => {
  if (purchasesInstance) return purchasesInstance;
  if (Platform.OS === 'web') return null;
  try {
    const module = require('react-native-purchases') as PurchasesModule;
    purchasesInstance = module.default;
    return purchasesInstance;
  } catch (error) {
    console.error('RevenueCat unavailable in Expo Go:', error);
    return null;
  }
};

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


export const [RevenueCatProvider, useRevenueCat] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const previousProStatus = useRef<boolean | null>(null);

  useEffect(() => {
    const apiKey = getRCToken();
    if (Platform.OS === 'web') {
      setIsInitialized(true);
      console.log('RevenueCat: Web mode - features will be simulated');
      return;
    }

    if (!apiKey) {
      console.error('RevenueCat API key not found');
      return;
    }

    const purchases = getPurchases();
    if (!purchases) {
      console.warn('RevenueCat not available. Skipping initialization.');
      setIsInitialized(true);
      return;
    }

    try {
      purchases.configure({ apiKey });
      setIsInitialized(true);
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    }
  }, []);

  const customerInfoQuery = useQuery({
    queryKey: ['revenuecat-customer-info'],
    queryFn: async (): Promise<CustomerInfo | null> => {
      if (Platform.OS === 'web') {
        return null;
      }
      const purchases = getPurchases();
      if (!purchases) {
        return null;
      }
      try {
        const customerInfo = await purchases.getCustomerInfo();
        return customerInfo;
      } catch (error) {
        console.error('Error fetching customer info:', error);
        return null;
      }
    },
    enabled: isInitialized,
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
      const purchases = getPurchases();
      if (!purchases) {
        return null;
      }
      try {
        const offerings = await purchases.getOfferings();
        return offerings;
      } catch (error) {
        console.error('Error fetching offerings:', error);
        return null;
      }
    },
    enabled: isInitialized,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      if (Platform.OS === 'web') {
        throw new Error('Purchases not available on web');
      }

      const purchases = getPurchases();
      if (!purchases) {
        throw new Error('Purchases not available');
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
        const { customerInfo } = await purchases.purchasePackage(pkg);
        return customerInfo;
      } catch (error: any) {
        if (error?.userCancelled) {
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
      const purchases = getPurchases();
      if (!purchases) {
        throw new Error('Restore not available');
      }
      try {
        const customerInfo = await purchases.restorePurchases();
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
