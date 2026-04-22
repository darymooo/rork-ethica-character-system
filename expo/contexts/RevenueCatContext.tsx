import createContextHook from '@nkzw/create-context-hook';
import type { CustomerInfo, PurchasesEntitlementInfos, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

type PurchasesModule = typeof import('react-native-purchases');
type PurchasesType = PurchasesModule['default'];

type RevenueCatPlan = 'weekly' | 'monthly';

let purchasesInstance: PurchasesType | null = null;
let purchasesConfigured = false;

const ENTITLEMENT_ID = 'Ethica Pro';
const CUSTOMER_INFO_QUERY_KEY = ['revenuecat-customer-info'] as const;
const OFFERINGS_QUERY_KEY = ['revenuecat-offerings'] as const;

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

function serializeRevenueCatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as Record<string, unknown>;
    return {
      code: candidate.code,
      message: candidate.message,
      readableErrorCode: candidate.readableErrorCode,
      userCancelled: candidate.userCancelled,
      underlyingErrorMessage: candidate.underlyingErrorMessage,
    };
  }

  return { value: error };
}

function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    const trimmedMessage = error.message.trim();
    return trimmedMessage.length > 0 ? trimmedMessage : null;
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as Record<string, unknown>;
    if (typeof candidate.message === 'string') {
      const trimmedMessage = candidate.message.trim();
      return trimmedMessage.length > 0 ? trimmedMessage : null;
    }
  }

  return null;
}

function getUserFacingRevenueCatError(error: unknown, fallback: string): Error {
  const isCancelled = typeof error === 'object' && error !== null && (error as { userCancelled?: boolean }).userCancelled === true;
  const message = getErrorMessage(error)?.toLowerCase() ?? '';

  if (isCancelled) {
    return new Error('Purchase cancelled');
  }

  if (message.includes('network') || message.includes('offline') || message.includes('internet')) {
    return new Error('Please check your connection and try again.');
  }

  if (message.includes('not available') || message.includes('configuration') || message.includes('offer')) {
    return new Error('Subscriptions are temporarily unavailable. Please try again shortly.');
  }

  return new Error(fallback);
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
    console.error('RevenueCat module unavailable:', serializeRevenueCatError(error));
    return null;
  }
}

function getActiveEntitlements(customerInfo: CustomerInfo | null | undefined): PurchasesEntitlementInfos | null {
  const entitlements = customerInfo?.entitlements?.active;
  if (!entitlements || typeof entitlements !== 'object') {
    return null;
  }

  return entitlements;
}

function hasProEntitlement(customerInfo: CustomerInfo | null | undefined): boolean {
  const activeEntitlements = getActiveEntitlements(customerInfo);
  if (!activeEntitlements) {
    return false;
  }

  return activeEntitlements[ENTITLEMENT_ID] !== undefined;
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
    console.error('Failed to configure RevenueCat:', serializeRevenueCatError(error));
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
      console.log('RevenueCat customer info listener fired', {
        activeEntitlements: Object.keys(getActiveEntitlements(customerInfo) ?? {}),
      });
      queryClient.setQueryData(CUSTOMER_INFO_QUERY_KEY, customerInfo);
    };

    purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

    return () => {
      purchases.removeCustomerInfoUpdateListener(handleCustomerInfoUpdate);
    };
  }, [isInitialized, queryClient]);

  const customerInfoQuery = useQuery({
    queryKey: CUSTOMER_INFO_QUERY_KEY,
    queryFn: async (): Promise<CustomerInfo | null> => {
      const purchases = getPurchases();
      if (!purchases) {
        return null;
      }

      try {
        const customerInfo = await purchases.getCustomerInfo();
        console.log('RevenueCat customer info fetched', {
          activeEntitlements: Object.keys(getActiveEntitlements(customerInfo) ?? {}),
          originalAppUserId: customerInfo.originalAppUserId,
        });
        return customerInfo;
      } catch (error) {
        console.error('Error fetching customer info:', serializeRevenueCatError(error));
        return null;
      }
    },
    enabled: isInitialized,
    refetchInterval: 60000,
  });

  const offeringsQuery = useQuery({
    queryKey: OFFERINGS_QUERY_KEY,
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
        console.error('Error fetching offerings:', serializeRevenueCatError(error));
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

    const currentProStatus = hasProEntitlement(customerInfo);

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
        throw new Error('Subscriptions are not available right now.');
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
        const purchaseResult = await purchases.purchasePackage(pkg);
        console.log('RevenueCat purchase succeeded', {
          activeEntitlements: Object.keys(getActiveEntitlements(purchaseResult.customerInfo) ?? {}),
        });
        return purchaseResult.customerInfo;
      } catch (error: unknown) {
        console.error('RevenueCat purchase failed', serializeRevenueCatError(error));
        throw getUserFacingRevenueCatError(error, 'We could not complete the purchase. Please try again.');
      }
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(CUSTOMER_INFO_QUERY_KEY, customerInfo);
      void queryClient.invalidateQueries({ queryKey: OFFERINGS_QUERY_KEY });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const purchases = getPurchases();
      if (!purchases) {
        throw new Error('Restore is not available right now.');
      }

      try {
        const customerInfo = await purchases.restorePurchases();
        console.log('RevenueCat restore completed', {
          activeEntitlements: Object.keys(getActiveEntitlements(customerInfo) ?? {}),
        });
        return customerInfo;
      } catch (error: unknown) {
        console.error('Error restoring purchases:', serializeRevenueCatError(error));
        throw getUserFacingRevenueCatError(error, 'We could not restore purchases right now. Please try again.');
      }
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(CUSTOMER_INFO_QUERY_KEY, customerInfo);
      void queryClient.invalidateQueries({ queryKey: OFFERINGS_QUERY_KEY });
    },
  });

  const isPro = useMemo((): boolean => {
    return hasProEntitlement(customerInfoQuery.data);
  }, [customerInfoQuery.data]);

  const getProExpirationDate = useCallback((): Date | null => {
    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) {
      return null;
    }

    const entitlement = getActiveEntitlements(customerInfo)?.[ENTITLEMENT_ID];
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
