import Constants, { ExecutionEnvironment } from "expo-constants";

type NotificationsImpl = {
  installNotificationHandler: () => void;
  setDailyQuoteNotificationsEnabled: (enabled: boolean) => Promise<void>;
};

/**
 * Expo Go throws as soon as the expo-notifications package is evaluated.
 * Keep that import in a separate module and do not load it here.
 */
function notificationsAllowed(): boolean {
  if (Constants.appOwnership === "expo") return false;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return false;
  return (
    Constants.executionEnvironment === ExecutionEnvironment.Bare ||
    Constants.executionEnvironment === ExecutionEnvironment.Standalone
  );
}

function loadImpl(): NotificationsImpl | null {
  if (!notificationsAllowed()) return null;
  try {
    return require("./dailyQuoteNotificationsImpl") as NotificationsImpl;
  } catch {
    return null;
  }
}

export function installNotificationHandler(): void {
  loadImpl()?.installNotificationHandler();
}

export async function setDailyQuoteNotificationsEnabled(enabled: boolean): Promise<void> {
  const impl = loadImpl();
  if (!impl) return;
  await impl.setDailyQuoteNotificationsEnabled(enabled);
}
