import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from '@revenuecat/purchases-capacitor';
import type {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
} from '@revenuecat/purchases-capacitor';

// RevenueCat Configuration
const REVENUECAT_API_KEY = 'appl_rBcdScKXYjPpwKNeuFECTHfACgV';
const ENTITLEMENT_ID = 'pro'; // Your entitlement identifier in RevenueCat

// Product identifiers (must match what you set up in App Store Connect & RevenueCat)
export const PRODUCT_IDS = {
  // Basic tier
  BASIC_MONTHLY: 'ally_basic_monthly',
  BASIC_YEARLY: 'ally_basic_yearly',
  // Plus tier
  PLUS_MONTHLY: 'ally_plus_monthly',
  PLUS_YEARLY: 'ally_plus_yearly',
  // Gold tier
  GOLD_MONTHLY: 'ally_gold_monthly',
  GOLD_YEARLY: 'ally_gold_yearly',
} as const;

// Subscription tier mapping
export type SubscriptionTier = 'free' | 'basic' | 'plus' | 'gold' | 'business';

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Call this once when app starts
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('RevenueCat: Skipping initialization on web platform');
    return;
  }

  if (isInitialized) {
    console.log('RevenueCat: Already initialized');
    return;
  }

  try {
    // Set log level for debugging (change to WARN or ERROR in production)
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

    // Configure with API key
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId || undefined, // Let RevenueCat generate anonymous ID if no user
    });

    isInitialized = true;
    console.log('RevenueCat: Initialized successfully');
  } catch (error) {
    console.error('RevenueCat: Failed to initialize', error);
    throw error;
  }
}

/**
 * Login user to RevenueCat (call after authentication)
 */
export async function loginUser(userId: string): Promise<CustomerInfo> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('RevenueCat is only available on native platforms');
  }

  try {
    const { customerInfo } = await Purchases.logIn({ appUserID: userId });
    console.log('RevenueCat: User logged in', userId);
    return customerInfo;
  } catch (error) {
    console.error('RevenueCat: Login failed', error);
    throw error;
  }
}

/**
 * Logout user from RevenueCat
 */
export async function logoutUser(): Promise<CustomerInfo> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('RevenueCat is only available on native platforms');
  }

  try {
    const { customerInfo } = await Purchases.logOut();
    console.log('RevenueCat: User logged out');
    return customerInfo;
  } catch (error) {
    console.error('RevenueCat: Logout failed', error);
    throw error;
  }
}

/**
 * Get current customer info and subscription status
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('RevenueCat is only available on native platforms');
  }

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('RevenueCat: Failed to get customer info', error);
    throw error;
  }
}

/**
 * Check if user has active pro entitlement
 */
export async function hasProAccess(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false; // Web users handled differently
  }

  try {
    const customerInfo = await getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error('RevenueCat: Failed to check entitlement', error);
    return false;
  }
}

/**
 * Get the user's current subscription tier based on entitlements
 */
export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  if (!Capacitor.isNativePlatform()) {
    return 'free';
  }

  try {
    const customerInfo = await getCustomerInfo();
    const proEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (!proEntitlement) {
      return 'free';
    }

    // Map product to tier based on product identifier
    const productId = proEntitlement.productIdentifier;

    if (productId.includes('gold')) {
      return 'gold';
    } else if (productId.includes('plus')) {
      return 'plus';
    } else if (productId.includes('basic')) {
      return 'basic';
    }

    return 'basic'; // Default for any pro subscription
  } catch (error) {
    console.error('RevenueCat: Failed to get subscription tier', error);
    return 'free';
  }
}

/**
 * Get available offerings/packages for purchase
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    const { offerings } = await Purchases.getOfferings();

    if (!offerings.current) {
      console.warn('RevenueCat: No current offering available');
      return null;
    }

    return offerings.current;
  } catch (error) {
    console.error('RevenueCat: Failed to get offerings', error);
    throw error;
  }
}

/**
 * Purchase a specific package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Purchases are only available on native platforms');
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    console.log('RevenueCat: Purchase successful');
    return customerInfo;
  } catch (error) {
    const purchaseError = error as PurchasesError;

    // Handle user cancellation gracefully
    if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      console.log('RevenueCat: Purchase cancelled by user');
      throw new Error('Purchase cancelled');
    }

    // Handle already purchased
    if (purchaseError.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
      console.log('RevenueCat: Product already purchased');
      // Get updated customer info
      return await getCustomerInfo();
    }

    console.error('RevenueCat: Purchase failed', error);
    throw error;
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Restore is only available on native platforms');
  }

  try {
    const { customerInfo } = await Purchases.restorePurchases();
    console.log('RevenueCat: Purchases restored');
    return customerInfo;
  } catch (error) {
    console.error('RevenueCat: Restore failed', error);
    throw error;
  }
}

/**
 * Listen for customer info updates
 */
export function addCustomerInfoUpdateListener(
  callback: (customerInfo: CustomerInfo) => void
): () => void {
  if (!Capacitor.isNativePlatform()) {
    return () => {}; // No-op for web
  }

  const listener = Purchases.addCustomerInfoUpdateListener(({ customerInfo }) => {
    callback(customerInfo);
  });

  // Return cleanup function
  return () => {
    listener.then(handle => handle.remove());
  };
}

/**
 * Check if running on native platform
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Format price for display
 */
export function formatPrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Get subscription period text
 */
export function getSubscriptionPeriod(pkg: PurchasesPackage): string {
  const identifier = pkg.identifier.toLowerCase();

  if (identifier.includes('lifetime')) return 'Lifetime';
  if (identifier.includes('yearly') || identifier.includes('annual')) return 'per year';
  if (identifier.includes('monthly')) return 'per month';
  if (identifier.includes('weekly')) return 'per week';

  return '';
}

/**
 * Show native RevenueCat paywall (if using RevenueCat Paywalls)
 * Note: Requires @revenuecat/purchases-capacitor-ui package
 */
export async function presentPaywall(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    // Import dynamically to avoid issues on web
    const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui');
    const result = await RevenueCatUI.presentPaywall();
    return result.paywallResult === 'PURCHASED' || result.paywallResult === 'RESTORED';
  } catch (error) {
    console.error('RevenueCat: Failed to present paywall', error);
    return false;
  }
}

/**
 * Show native RevenueCat paywall for a specific offering
 */
export async function presentPaywallForOffering(offeringIdentifier: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui');
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
    });
    return result.paywallResult === 'PURCHASED' || result.paywallResult === 'RESTORED';
  } catch (error) {
    console.error('RevenueCat: Failed to present paywall', error);
    return false;
  }
}

/**
 * Show Customer Center for subscription management
 * Note: Requires RevenueCat Customer Center to be configured
 */
export async function presentCustomerCenter(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // On web, redirect to settings or external management
    window.open('https://apps.apple.com/account/subscriptions', '_blank');
    return;
  }

  try {
    const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui');
    await RevenueCatUI.presentCustomerCenter();
  } catch (error) {
    console.error('RevenueCat: Failed to present customer center', error);
    // Fallback to native subscription settings
    window.open('https://apps.apple.com/account/subscriptions', '_blank');
  }
}
