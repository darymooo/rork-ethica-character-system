import createContextHook from '@nkzw/create-context-hook';
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type PurchasesModule = typeof import('react-native-purchases');
type PurchasesType = PurchasesModule['default'];

type RevenueCatPlan = 'weekly' | 'monthly';

let purchasesInstance: PurchasesType | null = null;
let purchasesConfigured = false;

const ENTITLEMENT_ALIASES = ['Ethica Pro', 'ethica_pro', 'pro', 'premium'];

function hasActiveProEntitlement(customerInfo: CustomerInfo | null | undefined): boolean {
  const activeEntitlements = customerInfo?.entitlements.active ?? {};
  const activeKeys = Object.keys(activeEntitlements);
  console.log('Checking active RevenueCat entitlements for Pro unlock', { activeKeys });

  return ENTITLEMENT_ALIASES.some((id) => activeEntitlements[id] !== undefined) || activeKeys.length > 0;
}

function getActiveProEntitlement(customerInfo: CustomerInfo | null | undefined) {
  const activeEntitlements = customerInfo?.entitlements.active ?? {};
  const alias = ENTITLEMENT_ALIASES.find((id) => activeEntitlements[id] !== undefined);
  if (alias) {
    return activeEntitlements[alias];
  }

  const firstActiveKey = Object.keys(activeEntitlements)[0];
  return firstActiveKey ? activeEntitlements[firstActiveKey] : undefined;
}

function getRCToken(): string | undefined {
  if (__DEV__) {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }

  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

function getPurchases(): PurchasesType | null {
  if (purchasesInstance) {
    return purchasesInstance;
  }

  try {
    const module = require('react-native-purchases') as PurchasesModule;
    purchasesInstance = module.default;
    return purchasesInstance;
  } catch (error) {
    console.error('RevenueCat module unavailable:', error);
    return null;
  }
}

function resolvePackageByPlan(
  offerings: PurchasesOfferings | null | undefined,
  plan: RevenueCatPlan
): PurchasesPackage | null {
  const availablePackages = offerings?.current?.availablePackages ?? [];

  const matchers: RegExp[] = plan === 'weekly'
    ? [/\bweekly\b/i, /\bweek\b/i, /\bp1w\b/i, /\$rc_weekly/i]
    : [/\bmonthly\b/i, /\bmonth\b/i, /\bp1m\b/i, /\$rc_monthly/i];

  const expectedPackageType = plan === 'weekly' ? 'WEEKLY' : 'MONTHLY';

  const matchedByType = availablePackages.find((pkg) => pkg.packageType === expectedPackageType);
  if (matchedByType) {
    return matchedByType;
  }

  const matchedByMetadata = availablePackages.find((pkg) => {
    const searchable = [
      pkg.identifier,
      pkg.product.identifier,
      pkg.product.title,
      pkg.product.description,
      pkg.product.subscriptionPeriod ?? '',
    ].join(' ');

    return matchers.some((matcher) => matcher.test(searchable));
  });

  return matchedByMetadata ?? null;
}

async function initializeRevenueCat(): Promise<boolean> {
  if (purchasesConfigured) {
    return true;
  }

  const apiKey = getRCToken();
  if (!apiKey) {
    console.error('RevenueCat API key not found');
    return false;
  }

  const purchases = getPurchases();
  if (!purchases) {
    console.warn('RevenueCat SDK unavailable. Continuing without purchases support.');
    return false;
  }

  try {
    purchases.configure({ apiKey });
    purchasesConfigured = true;
    console.log('RevenueCat configured successfully');
    return true;
  } catch (error) {
    console.error('Failed to configure RevenueCat:', error);
    return false;
  }
}

const revenueCatSetupPromise = initializeRevenueCat();

export const [RevenueCatProvider, useRevenueCat] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const previousProStatus = useRef<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const finishInitialization = async () => {
      const configured = await revenueCatSetupPromise;
      if (!isMounted) {
        return;
      }

      setIsInitialized(true);
      console.log('RevenueCat initialization completed', { configured });
    };

    void finishInitialization();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const purchases = getPurchases();
    if (!purchases || !isInitialized) {
      return;
    }

    const handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
      console.log('RevenueCat customer info listener fired');
      queryClient.setQueryData(['revenuecat-customer-info'], customerInfo);
    };

    purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

    return () => {
      purchases.removeCustomerInfoUpdateListener(handleCustomerInfoUpdate);
    };
  }, [isInitialized, queryClient]);

  const customerInfoQuery = useQuery({
    queryKey: ['revenuecat-customer-info'],
    queryFn: async (): Promise<CustomerInfo | null> => {
      const purchases = getPurchases();
      if (!purchases) {
        return null;
      }

      try {
        const customerInfo = await purchases.getCustomerInfo();
        console.log('RevenueCat customer info fetched', {
          activeEntitlements: Object.keys(customerInfo.entitlements.active ?? {}),
        });
        return customerInfo;
      } catch (error) {
        console.error('Error fetching customer info:', error);
        return null;
      }
    },
    enabled: isInitialized,
    refetchInterval: 60000,
  });

  const offeringsQuery = useQuery({
    queryKey: ['revenuecat-offerings'],
    queryFn: async (): Promise<PurchasesOfferings | null> => {
      const purchases = getPurchases();
      if (!purchases) {
        return null;
      }

      try {
        const offerings = await purchases.getOfferings();
        console.log('RevenueCat offerings fetched', {
          currentOffering: offerings.current?.identifier ?? null,
          packages: offerings.current?.availablePackages.map((pkg) => ({
            identifier: pkg.identifier,
            packageType: pkg.packageType,
            productId: pkg.product.identifier,
            priceString: pkg.product.priceString,
            subscriptionPeriod: pkg.product.subscriptionPeriod,
          })) ?? [],
        });
        return offerings;
      } catch (error) {
        console.error('Error fetching offerings:', error);
        return null;
      }
    },
    enabled: isInitialized,
  });

  useEffect(() => {
    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) {
      return;
    }

    const currentProStatus = hasActiveProEntitlement(customerInfo);

    if (previousProStatus.current === null) {
      previousProStatus.current = currentProStatus;
      return;
    }

    if (previousProStatus.current !== currentProStatus) {
      console.log('RevenueCat pro status changed', {
        previous: previousProStatus.current,
        current: currentProStatus,
      });
    }

    previousProStatus.current = currentProStatus;
  }, [customerInfoQuery.data]);

  const refreshRevenueCat = useCallback(async (): Promise<void> => {
    await Promise.all([
      customerInfoQuery.refetch(),
      offeringsQuery.refetch(),
    ]);
  }, [customerInfoQuery, offeringsQuery]);

  const purchaseMutation = useMutation({
    mutationFn: async (plan: RevenueCatPlan) => {
      const purchases = getPurchases();
      if (!purchases) {
        throw new Error('Purchases are not available on this device.');
      }

      const pkg = resolvePackageByPlan(offeringsQuery.data, plan);
      if (!pkg) {
        throw new Error(`The ${plan} subscription is not available right now.`);
      }

      console.log('Starting RevenueCat purchase', {
        requestedPlan: plan,
        packageIdentifier: pkg.identifier,
        packageType: pkg.packageType,
        productIdentifier: pkg.product.identifier,
      });

      try {
        const { customerInfo } = await purchases.purchasePackage(pkg);
        const freshCustomerInfo = await purchases.getCustomerInfo();
        return hasActiveProEntitlement(freshCustomerInfo) ? freshCustomerInfo : customerInfo;
      } catch (error: any) {
        if (error?.userCancelled) {
          throw new Error('Purchase cancelled');
        }

        console.error('RevenueCat purchase failed', error);
        throw error;
      }
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(['revenuecat-customer-info'], customerInfo);
      void queryClient.invalidateQueries({ queryKey: ['revenuecat-offerings'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const purchases = getPurchases();
      if (!purchases) {
        throw new Error('Restore is not available on this device.');
      }

      try {
        const customerInfo = await purchases.restorePurchases();
        console.log('RevenueCat restore completed');
        return customerInfo;
      } catch (error) {
        console.error('Error restoring purchases:', error);
        throw error;
      }
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(['revenuecat-customer-info'], customerInfo);
      void queryClient.invalidateQueries({ queryKey: ['revenuecat-offerings'] });
    },
  });

  const isPro = useMemo((): boolean => {
    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) {
      return false;
    }

    return hasActiveProEntitlement(customerInfo);
  }, [customerInfoQuery.data]);

  const getProExpirationDate = useCallback((): Date | null => {
    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) {
      return null;
    }

    const entitlement = getActiveProEntitlement(customerInfo);
    if (!entitlement?.expirationDate) {
      return null;
    }

    return new Date(entitlement.expirationDate);
  }, [customerInfoQuery.data]);

  const purchase = useCallback(async (plan: RevenueCatPlan) => {
    return purchaseMutation.mutateAsync(plan);
  }, [purchaseMutation]);

  const restorePurchases = useCallback(async () => {
    return restoreMutation.mutateAsync();
  }, [restoreMutation]);

  const value = useMemo(() => ({
    isInitialized,
    isPro,
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    weeklyPackage: resolvePackageByPlan(offeringsQuery.data, 'weekly'),
    monthlyPackage: resolvePackageByPlan(offeringsQuery.data, 'monthly'),
    isLoadingCustomerInfo: customerInfoQuery.isLoading,
    isLoadingOfferings: offeringsQuery.isLoading,
    purchase,
    restorePurchases,
    refreshRevenueCat,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchaseError: purchaseMutation.error,
    restoreError: restoreMutation.error,
    getProExpirationDate,
  }), [
    customerInfoQuery.data,
    customerInfoQuery.isLoading,
    getProExpirationDate,
    isInitialized,
    isPro,
    offeringsQuery.data,
    offeringsQuery.isLoading,
    purchase,
    purchaseMutation.error,
    purchaseMutation.isPending,
    refreshRevenueCat,
    restoreMutation.error,
    restoreMutation.isPending,
    restorePurchases,
  ]);

  return value;
});
