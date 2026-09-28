import type { OracleSource } from "../data/oracleAnswers";

export const FREE_DREAM_INTERPRET_LIMIT = 3;
export const FREE_MEDITATION_COUNT = 2;
export const FREE_ORACLE_SOURCE: OracleSource = "universe";
/** Assistant replies in one tarot chat, including the opening interpretation. */
export const FREE_TAROT_CHAT_ANSWERS = 2;

type HistoryLike = { type?: string };

export function countDreamInterpretations(items: HistoryLike[]): number {
  return items.filter((item) => item.type === "dream").length;
}

export function dreamInterpretationsRemaining(
  isPro: boolean,
  items: HistoryLike[],
): number {
  if (isPro) return FREE_DREAM_INTERPRET_LIMIT;
  return Math.max(0, FREE_DREAM_INTERPRET_LIMIT - countDreamInterpretations(items));
}

export function canInterpretDream(isPro: boolean, items: HistoryLike[]): boolean {
  return isPro || dreamInterpretationsRemaining(false, items) > 0;
}

export function isOracleSourceFree(isPro: boolean, source: OracleSource): boolean {
  return isPro || source === FREE_ORACLE_SOURCE;
}

type MeditationLike = { slug: string; sort?: number };

export function freeMeditationSlugSet(items: MeditationLike[]): Set<string> {
  const ordered = [...items].sort(
    (a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.slug.localeCompare(b.slug),
  );
  return new Set(ordered.slice(0, FREE_MEDITATION_COUNT).map((item) => item.slug));
}

export function isMeditationFree(slug: string, items: MeditationLike[]): boolean {
  return freeMeditationSlugSet(items).has(slug);
}
