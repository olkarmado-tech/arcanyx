import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import {
  DAILY_QUOTES,
  type DailyQuoteEntry,
  getDailyQuoteForCatalog,
} from "../data/dailyQuotes";
import {
  fetchDailyQuotes,
  readCachedDailyQuotes,
} from "../services/dailyQuotesCatalog";

type DailyQuotesContextValue = {
  quotes: readonly DailyQuoteEntry[];
  hydrated: boolean;
  refresh: (force?: boolean) => Promise<void>;
  getDailyQuote: (dayKey: string) => DailyQuoteEntry;
};

const DailyQuotesContext =
  createContext<DailyQuotesContextValue | undefined>(undefined);

export function DailyQuotesProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<readonly DailyQuoteEntry[]>(DAILY_QUOTES);
  const [hydrated, setHydrated] = useState(false);
  const lastFetchedAt = useRef(0);
  const inFlight = useRef<Promise<void> | null>(null);

  const applyQuotes = useCallback((items: DailyQuoteEntry[]) => {
    setQuotes(items);
  }, []);

  const refresh = useCallback(
    async (force = false) => {
      if (
        !force &&
        lastFetchedAt.current > 0 &&
        Date.now() - lastFetchedAt.current < 12_000
      ) {
        return;
      }
      if (inFlight.current) {
        await inFlight.current;
        return;
      }
      const task = (async () => {
        try {
          const fresh = await fetchDailyQuotes();
          applyQuotes(fresh);
          lastFetchedAt.current = Date.now();
        } catch {
          // Bundled/cached quotes keep the home screen available offline.
        } finally {
          setHydrated(true);
        }
      })();
      inFlight.current = task;
      try {
        await task;
      } finally {
        if (inFlight.current === task) inFlight.current = null;
      }
    },
    [applyQuotes],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await readCachedDailyQuotes();
      if (!cancelled && cached) applyQuotes(cached);
      await refresh(true);
    })();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [applyQuotes, refresh]);

  const getDailyQuote = useCallback(
    (dayKey: string) => getDailyQuoteForCatalog(dayKey, quotes),
    [quotes],
  );

  const value = useMemo(
    () => ({
      quotes,
      hydrated,
      refresh,
      getDailyQuote,
    }),
    [quotes, hydrated, refresh, getDailyQuote],
  );

  return (
    <DailyQuotesContext.Provider value={value}>
      {children}
    </DailyQuotesContext.Provider>
  );
}

export function useDailyQuotes() {
  const ctx = useContext(DailyQuotesContext);
  if (!ctx) {
    throw new Error("useDailyQuotes must be used inside DailyQuotesProvider");
  }
  return ctx;
}
