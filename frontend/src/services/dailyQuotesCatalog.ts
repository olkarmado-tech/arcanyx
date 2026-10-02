import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DailyQuoteEntry } from "../data/dailyQuotes";
import { apiFetch } from "./api";

const CACHE_KEY = "@mystix_daily_quotes_catalog_v1";

type DailyQuotesResponse = {
  items: DailyQuoteEntry[];
};

function validQuotes(value: unknown): DailyQuoteEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is DailyQuoteEntry => {
    if (!item || typeof item !== "object") return false;
    const quote = item as Partial<DailyQuoteEntry>;
    return Boolean(
      typeof quote.text === "string" &&
        quote.text.trim() &&
        typeof quote.author === "string" &&
        quote.author.trim(),
    );
  });
}

export async function readCachedDailyQuotes(): Promise<DailyQuoteEntry[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const items = validQuotes(JSON.parse(raw));
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

export async function fetchDailyQuotes(): Promise<DailyQuoteEntry[]> {
  const response = await apiFetch<DailyQuotesResponse>(
    `/api/daily-quotes?_=${Date.now()}`,
    {
      timeoutMs: 12000,
      retries: 1,
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    },
  );
  const items = validQuotes(response.items);
  if (items.length === 0) {
    throw new Error("Каталог цитат пуст");
  }
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(items)).catch(() => {});
  return items;
}
