import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

const ENTITLEMENT_KEY = "@arcanyx_rustore_pro_v1";

export type RuStorePlanId = "month" | "half" | "year";

const FALLBACK_PRODUCTS: Record<RuStorePlanId, string> = {
  month: "arcanyx_pro_month",
  half: "arcanyx_pro_6m",
  year: "arcanyx_pro_year",
};

type RuStoreNative = {
  purchase?: (params: Record<string, unknown>) => Promise<unknown>;
  getPurchases?: (params?: Record<string, unknown>) => Promise<unknown>;
};

function nativePay(): RuStoreNative | null {
  const mod = NativeModules.RuStoreReactPay as RuStoreNative | undefined;
  if (!mod?.purchase || !mod.getPurchases) return null;
  return mod;
}

function extraRustore(): {
  consoleApplicationId?: string;
  products?: Partial<Record<RuStorePlanId, string>>;
} {
  const extra = Constants.expoConfig?.extra as
    | { rustore?: { consoleApplicationId?: string; products?: Partial<Record<RuStorePlanId, string>> } }
    | undefined;
  return extra?.rustore ?? {};
}

export function rustoreProductId(planId: RuStorePlanId): string {
  return extraRustore().products?.[planId] || FALLBACK_PRODUCTS[planId];
}

export function rustoreConsoleConfigured(): boolean {
  return Boolean(extraRustore().consoleApplicationId?.trim());
}

export function rustorePayAvailable(): boolean {
  return Platform.OS === "android" && nativePay() != null;
}

export async function readStoredRuStorePro(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ENTITLEMENT_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function writeStoredRuStorePro(active: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ENTITLEMENT_KEY, active ? "1" : "0");
  } catch {
    // Entitlement still applies for this session.
  }
}

function purchaseErrorText(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  return "Не удалось открыть оплату RuStore. Попробуйте ещё раз.";
}

export function isRuStorePurchaseCancelled(error: unknown): boolean {
  const text = purchaseErrorText(error);
  return /cancel/i.test(text) || /отмен/i.test(text);
}

export async function purchaseRuStoreSubscription(planId: RuStorePlanId): Promise<void> {
  if (Platform.OS !== "android") {
    throw new Error("Подписка оформляется в Android-версии из RuStore.");
  }
  if (!rustoreConsoleConfigured()) {
    throw new Error(
      "Оплата ещё не подключена. Добавьте ID приложения из RuStore Консоли и создайте подписки с пробным периодом 3 дня.",
    );
  }
  const pay = nativePay();
  if (!pay?.purchase) {
    throw new Error("Оплата RuStore доступна в сборке приложения из RuStore.");
  }
  await pay.purchase({
    productId: rustoreProductId(planId),
    preferredPurchaseType: "ONE_STEP",
    sdkTheme: "DARK",
  });
  await writeStoredRuStorePro(true);
}

const ENTITLED_STATUSES = new Set(["ACTIVE", "PAUSED"]);

function purchaseLooksEntitled(entry: unknown): boolean {
  if (!entry || typeof entry !== "object") return false;
  const record = entry as Record<string, unknown>;
  const sub =
    record.subscriptionPurchase && typeof record.subscriptionPurchase === "object"
      ? (record.subscriptionPurchase as Record<string, unknown>)
      : record;
  const status = String(sub.status ?? "").toUpperCase();
  if (!ENTITLED_STATUSES.has(status)) return false;
  const expiration = sub.expirationDate;
  if (typeof expiration === "number" && expiration > 0 && expiration < Date.now()) {
    return false;
  }
  return true;
}

/** `true`/`false` when RuStore answered; `null` when the SDK is absent or the check failed. */
export async function queryRuStoreSubscription(): Promise<boolean | null> {
  const pay = nativePay();
  if (!pay?.getPurchases || !rustoreConsoleConfigured()) return null;
  try {
    const result = await pay.getPurchases({ productType: "SUBSCRIPTION" });
    const list = Array.isArray(result)
      ? result
      : result && typeof result === "object" && Array.isArray((result as { purchases?: unknown[] }).purchases)
        ? (result as { purchases: unknown[] }).purchases
        : [];
    return list.some(purchaseLooksEntitled);
  } catch {
    return null;
  }
}
