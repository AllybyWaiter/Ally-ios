import { useState, useEffect, useCallback } from 'react';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import {
  initializeRevenueCat,
  loginUser,
  logoutUser,
  getCustomerInfo,
  hasProAccess,
  getSubscriptionTier,
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

export function useRevenueCat(): UseRevenueCatReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');

  const isNative = isNativePlatform();

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

        setCustomerInfo(info);

        // Check entitlements
        const hasPro = await hasProAccess();
        setIsPro(hasPro);
        logger.log('useRevenueCat: hasPro:', hasPro);

        const tier = await getSubscriptionTier();
        setSubscriptionTier(tier);
        logger.log('useRevenueCat: tier:', tier);
      } catch (error) {
        logger.error('Failed to sync user with RevenueCat:', error);
        // Still try to get customer info even if login fails
        try {
          const info = await getCustomerInfo();
          setCustomerInfo(info);
          const hasPro = await hasProAccess();
          setIsPro(hasPro);
          const tier = await getSubscriptionTier();
          setSubscriptionTier(tier);
        } catch (e) {
          logger.error('Failed to get customer info:', e);
        }
      }
    };

    syncUser();
  }, [isNative, isInitialized, user?.id]);

  // Listen for customer info updates
  useEffect(() => {
    if (!isNative || !isInitialized) return;

    const unsubscribe = addCustomerInfoUpdateListener(async (info) => {
      logger.log('useRevenueCat: Customer info update received from listener');
      logger.log('useRevenueCat: Active entitlements from listener:', Object.keys(info.entitlements.active));
      setCustomerInfo(info);

      // Update entitlement status
      const hasPro = await hasProAccess();
      setIsPro(hasPro);
      logger.log('useRevenueCat: hasPro from listener:', hasPro);

      const tier = await getSubscriptionTier();
      logger.log('useRevenueCat: tier from listener:', tier);
      setSubscriptionTier(tier);
    });

    return unsubscribe;
  }, [isNative, isInitialized]);

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!isNative) return false;

    setIsLoading(true);
    try {
      const info = await purchasePackage(pkg);
      setCustomerInfo(info);

      const hasPro = await hasProAccess();
      setIsPro(hasPro);

      const tier = await getSubscriptionTier();
      setSubscriptionTier(tier);

      return hasPro;
    } catch (error) {
      if ((error as Error).message === 'Purchase cancelled') {
        return false;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isNative]);

  // Restore purchases
  const restore = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    setIsLoading(true);
    try {
      const info = await restorePurchases();
      setCustomerInfo(info);

      const hasPro = await hasProAccess();
      setIsPro(hasPro);

      const tier = await getSubscriptionTier();
      setSubscriptionTier(tier);

      return hasPro;
    } finally {
      setIsLoading(false);
    }
  }, [isNative]);

  // Show paywall
  const showPaywall = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;

    const purchased = await presentPaywall();

    // Always refresh customer info after paywall closes
    // (whether purchased, restored, or cancelled)
    try {
      const info = await getCustomerInfo();
      logger.log('useRevenueCat: showPaywall refreshing info, entitlements:', Object.keys(info.entitlements.active));
      setCustomerInfo(info);

      const hasPro = await hasProAccess();
      setIsPro(hasPro);

      const tier = await getSubscriptionTier();
      logger.log('useRevenueCat: showPaywall setting tier to:', tier);
      setSubscriptionTier(tier);
    } catch (error) {
      logger.error('Failed to refresh after paywall:', error);
    }

    return purchased;
  }, [isNative]);

  // Show customer center
  const showCustomerCenter = useCallback(async (): Promise<void> => {
    if (!isNative) return;

    await presentCustomerCenter();

    // Refresh customer info after customer center closes
    // (user may have changed subscription)
    try {
      const info = await getCustomerInfo();
      logger.log('useRevenueCat: showCustomerCenter refreshing info');
      setCustomerInfo(info);

      const hasPro = await hasProAccess();
      setIsPro(hasPro);

      const tier = await getSubscriptionTier();
      setSubscriptionTier(tier);
    } catch (error) {
      logger.error('Failed to refresh after customer center:', error);
    }
  }, [isNative]);

  // Refresh customer info
  const refreshCustomerInfo = useCallback(async (): Promise<void> => {
    if (!isNative) return;

    logger.log('useRevenueCat: refreshCustomerInfo called');
    try {
      const info = await getCustomerInfo();
      logger.log('useRevenueCat: refreshCustomerInfo got info, entitlements:', Object.keys(info.entitlements.active));
      logger.log('useRevenueCat: refreshCustomerInfo subscriptions:', Object.keys(info.activeSubscriptions || {}));
      setCustomerInfo(info);

      const hasPro = await hasProAccess();
      logger.log('useRevenueCat: refreshCustomerInfo hasPro:', hasPro);
      setIsPro(hasPro);

      const tier = await getSubscriptionTier();
      logger.log('useRevenueCat: refreshCustomerInfo setting tier to:', tier);
      setSubscriptionTier(tier);
    } catch (error) {
      logger.error('Failed to refresh customer info:', error);
    }
  }, [isNative]);

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
