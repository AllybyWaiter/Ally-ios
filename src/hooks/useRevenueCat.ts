import { useState, useEffect, useCallback } from 'react';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import {
  initializeRevenueCat,
  loginUser,
  getCustomerInfo,
  getTierFromProductId,
  getOfferings,
  purchasePackage,
  restorePurchases,
  addCustomerInfoUpdateListener,
  isNativePlatform,
  presentPaywall,
  presentCustomerCenter,
  SubscriptionTier,
} from '@/lib/revenuecat';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface UseRevenueCatReturn {
  // State
  isLoading: boolean;
  isInitialized: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  isPro: boolean;
  subscriptionTier: SubscriptionTier;
  isNative: boolean;

  // Actions
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  showPaywall: () => Promise<boolean>;
  showCustomerCenter: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
}

const TIER_PRIORITY: Record<SubscriptionTier, number> = {
  free: 0,
  basic: 1,
  plus: 2,
  gold: 3,
  business: 4,
};

function deriveTierFromCustomerInfo(info: CustomerInfo): SubscriptionTier {
  let highestTier: SubscriptionTier = 'free';

  const activeEntitlements = Object.values(info.entitlements?.active || {});
  for (const entitlement of activeEntitlements) {
    const productIdentifier =
      entitlement && typeof entitlement === 'object'
        ? (entitlement as { productIdentifier?: unknown }).productIdentifier
        : undefined;
    if (typeof productIdentifier !== 'string') continue;

    const tier = getTierFromProductId(productIdentifier);
    if (TIER_PRIORITY[tier] > TIER_PRIORITY[highestTier]) {
      highestTier = tier;
    }
  }

  const activeSubscriptions = Array.isArray(info.activeSubscriptions)
    ? info.activeSubscriptions.filter((subId): subId is string => typeof subId === 'string')
    : [];
  for (const subId of activeSubscriptions) {
    const tier = getTierFromProductId(subId);
    if (TIER_PRIORITY[tier] > TIER_PRIORITY[highestTier]) {
      highestTier = tier;
    }
  }

  return highestTier;
}

export function useRevenueCat(): UseRevenueCatReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');

  const isNative = isNativePlatform();

  const applyCustomerInfoState = useCallback((info: CustomerInfo) => {
    setCustomerInfo(info);
    const tier = deriveTierFromCustomerInfo(info);
    const hasPro = tier !== 'free';
    setSubscriptionTier(tier);
    setIsPro(hasPro);
    return { tier, hasPro };
  }, []);

  // Initialize RevenueCat (only once, without user ID)
  useEffect(() => {
    if (!isNative) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      try {
        // Initialize without user ID - we'll call logIn separately
        await initializeRevenueCat();
        setIsInitialized(true);
        logger.log('useRevenueCat: SDK initialized');

        // Get offerings (doesn't require login)
        const offering = await getOfferings();
        setCurrentOffering(offering);
      } catch (error) {
        logger.error('Failed to initialize RevenueCat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [isNative]);

  // Handle user authentication with RevenueCat
  useEffect(() => {
    if (!isNative || !isInitialized) return;

    const syncUser = async () => {
      try {
        let info: CustomerInfo;

        if (user?.id) {
          // Login to RevenueCat with user ID - this merges any anonymous purchases
          logger.log('useRevenueCat: Logging in user:', user.id);
          info = await loginUser(user.id);
          logger.log('useRevenueCat: Login successful, appUserID:', info.originalAppUserId);
        } else {
          // No user, just get current info (will be anonymous)
          info = await getCustomerInfo();
        }

        const { hasPro, tier } = applyCustomerInfoState(info);
        logger.log('useRevenueCat: hasPro:', hasPro);
        logger.log('useRevenueCat: tier:', tier);
      } catch (error) {
        logger.error('Failed to sync user with RevenueCat:', error);
        // Still try to get customer info even if login fails
        try {
          const info = await getCustomerInfo();
          applyCustomerInfoState(info);
        } catch (e) {
          logger.error('Failed to get customer info:', e);
        }
      }
    };

    syncUser();
  }, [isNative, isInitialized, user?.id, applyCustomerInfoState]);

  // Listen for customer info updates
  useEffect(() => {
    if (!isNative || !isInitialized) return;

    const unsubscribe = addCustomerInfoUpdateListener(async (info) => {
      try {
        if (!info || typeof info !== 'object' || !info.entitlements?.active) {
          logger.warn('useRevenueCat: Ignoring malformed customer info update payload');
          return;
        }
        logger.log('useRevenueCat: Customer info update received from listener');
        logger.log('useRevenueCat: Active entitlements from listener:', Object.keys(info.entitlements.active));
        const { hasPro, tier } = applyCustomerInfoState(info);
        logger.log('useRevenueCat: hasPro from listener:', hasPro);
        logger.log('useRevenueCat: tier from listener:', tier);
      } catch (error) {
        logger.error('Failed to process customer info update:', error);
      }
    });

    return unsubscribe;
  }, [isNative, isInitialized, applyCustomerInfoState]);

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!isNative) return false;

    setIsLoading(true);
    try {
      const info = await purchasePackage(pkg);
      const { hasPro } = applyCustomerInfoState(info);

      return hasPro;
    } catch (error) {
      if ((error as Error).message === 'Purchase cancelled') {
        return false;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, applyCustomerInfoState]);

  // Restore purchases
  const restore = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    setIsLoading(true);
    try {
      const info = await restorePurchases();
      const { hasPro } = applyCustomerInfoState(info);

      return hasPro;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, applyCustomerInfoState]);

  // Show paywall
  const showPaywall = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    const purchased = await presentPaywall();

    // Always refresh customer info after paywall closes
    // (whether purchased, restored, or cancelled)
    try {
      const info = await getCustomerInfo();
      logger.log('useRevenueCat: showPaywall refreshing info, entitlements:', Object.keys(info.entitlements.active));
      const { tier } = applyCustomerInfoState(info);
      logger.log('useRevenueCat: showPaywall setting tier to:', tier);
    } catch (error) {
      logger.error('Failed to refresh after paywall:', error);
    }

    return purchased;
  }, [isNative, applyCustomerInfoState]);

  // Show customer center
  const showCustomerCenter = useCallback(async (): Promise<void> => {
    if (!isNative) return;

    await presentCustomerCenter();

    // Refresh customer info after customer center closes
    // (user may have changed subscription)
    try {
      const info = await getCustomerInfo();
      logger.log('useRevenueCat: showCustomerCenter refreshing info');
      applyCustomerInfoState(info);
    } catch (error) {
      logger.error('Failed to refresh after customer center:', error);
    }
  }, [isNative, applyCustomerInfoState]);

  // Refresh customer info
  const refreshCustomerInfo = useCallback(async (): Promise<void> => {
    if (!isNative) return;

    logger.log('useRevenueCat: refreshCustomerInfo called');
    try {
      const info = await getCustomerInfo();
      logger.log('useRevenueCat: refreshCustomerInfo got info, entitlements:', Object.keys(info.entitlements.active));
      logger.log('useRevenueCat: refreshCustomerInfo subscriptions:', Object.keys(info.activeSubscriptions || {}));
      const { hasPro, tier } = applyCustomerInfoState(info);
      logger.log('useRevenueCat: refreshCustomerInfo hasPro:', hasPro);
      logger.log('useRevenueCat: refreshCustomerInfo setting tier to:', tier);
    } catch (error) {
      logger.error('Failed to refresh customer info:', error);
    }
  }, [isNative, applyCustomerInfoState]);

  return {
    isLoading,
    isInitialized,
    customerInfo,
    currentOffering,
    isPro,
    subscriptionTier,
    isNative,
    purchase,
    restore,
    showPaywall,
    showCustomerCenter,
    refreshCustomerInfo,
  };
}
