import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import ProHeroHeader from "../src/components/pro/ProHeroHeader";
import { useUser } from "../src/context/UserContext";
import {
  isRuStorePurchaseCancelled,
  purchaseRuStoreSubscription,
  type RuStorePlanId,
} from "../src/services/rustorePay";
import { theme } from "../src/theme";

const NEUTRAL = {
  background: "#1A1822",
  border: "#38333F",
  text: "#F5F0F8",
} as const;

export const planGradients = {
  month: {
    base: "#B2BCE9",
    topLeft: "#D5DCEA",
    bottomRight: "#C9B9E4",
    topRight: "#EDF0F7",
    text: "#22233D",
    border: "#B9C7FF",
  },
  half: {
    base: "#8ABCB7",
    topLeft: "#B6D4C2",
    bottomRight: "#B8B0D2",
    topRight: "#E2E2CA",
    text: "#182D2B",
    border: "#B2E0D1",
  },
  year: {
    base: "#D7A5B5",
    topLeft: "#EBD7B9",
    bottomRight: "#B59BC5",
    topRight: "#EDC1A6",
    text: "#352035",
    border: "#F0CDB6",
  },
} as const;

type PlanId = keyof typeof planGradients;

type Plan = {
  id: PlanId;
  period: string;
  monthly: string;
  monthlyApprox?: boolean;
  detail: string;
  savings?: string;
  titleBadge?: string;
  priceBadge?: string;
  checkout: string;
  renewNote: string;
};

const PLANS: Plan[] = [
  {
    id: "month",
    period: "Месяц",
    monthly: "399\u00A0₽",
    detail: "3 дня бесплатно, затем 399\u00A0₽ каждый месяц",
    checkout: "399\u00A0₽",
    renewNote:
      "3 дня бесплатно. Затем 399\u00A0₽ за месяц и далее ежемесячно.",
  },
  {
    id: "half",
    period: "6 месяцев",
    monthly: "267\u00A0₽",
    monthlyApprox: true,
    detail: "3 дня бесплатно, затем 1\u00A0599\u00A0₽ раз в 6 месяцев",
    titleBadge: "−33%",
    checkout: "1\u00A0599\u00A0₽",
    renewNote:
      "3 дня бесплатно. Затем 1\u00A0599\u00A0₽ за 6 месяцев и далее каждые полгода.",
  },
  {
    id: "year",
    period: "Год",
    monthly: "200\u00A0₽",
    monthlyApprox: true,
    detail: "3 дня бесплатно, затем 2\u00A0399\u00A0₽ раз в год",
    savings: "Экономия 2\u00A0389\u00A0₽ за год",
    titleBadge: "Максимальная выгода",
    priceBadge: "−50%",
    checkout: "2\u00A0399\u00A0₽",
    renewNote: "3 дня бесплатно. Затем 2\u00A0399\u00A0₽ за год и далее ежегодно.",
  },
];

function PlanCardWash({ planId }: { planId: PlanId }) {
  const g = planGradients[planId];
  const prefix = `plan-${planId}`;
  const [size, setSize] = useState({ w: 0, h: 0 });

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width !== size.w || height !== size.h) {
          setSize({ w: width, h: height });
        }
      }}
    >
      {size.w > 0 && size.h > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <RadialGradient
              id={`${prefix}-tl`}
              cx={size.w * 0.1}
              cy={0}
              rx={size.w * 0.4}
              ry={size.h * 0.5}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={g.topLeft} stopOpacity={1} />
              <Stop offset="1" stopColor={g.topLeft} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient
              id={`${prefix}-br`}
              cx={size.w * 0.95}
              cy={size.h * 0.9}
              rx={size.w * 0.45}
              ry={size.h * 0.55}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={g.bottomRight} stopOpacity={1} />
              <Stop offset="1" stopColor={g.bottomRight} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient
              id={`${prefix}-tr`}
              cx={size.w * 0.85}
              cy={0}
              rx={size.w * 0.35}
              ry={size.h * 0.5}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={g.topRight} stopOpacity={1} />
              <Stop offset="1" stopColor={g.topRight} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill={g.base} />
          <Rect
            x={0}
            y={0}
            width={size.w}
            height={size.h}
            fill={`url(#${prefix}-tl)`}
          />
          <Rect
            x={0}
            y={0}
            width={size.w}
            height={size.h}
            fill={`url(#${prefix}-br)`}
          />
          <Rect
            x={0}
            y={0}
            width={size.w}
            height={size.h}
            fill={`url(#${prefix}-tr)`}
          />
        </Svg>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: g.base }]} />
      )}
    </View>
  );
}

export default function ProPlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPro, grantRuStoreEntitlement } = useUser();
  const [selectedId, setSelectedId] = useState<PlanId>("year");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const selected = PLANS.find((plan) => plan.id === selectedId) ?? PLANS[2];

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/pro" as never);
  };

  const selectPlan = (id: PlanId) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedId(id);
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const checkout = async () => {
    if (paying || isPro) return;
    setPayError(null);
    setPaying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await purchaseRuStoreSubscription(selected.id as RuStorePlanId);
      await grantRuStoreEntitlement();
      router.replace("/pro" as never);
    } catch (error) {
      if (!isRuStorePurchaseCancelled(error)) {
        setPayError(
          error instanceof Error
            ? error.message
            : "Не удалось открыть оплату RuStore.",
        );
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.page}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 196 + Math.max(insets.bottom, 8) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ProHeroHeader topInset={insets.top} onBack={handleBack} />

          <View style={styles.intro}>
            <Text style={styles.title}>Выбери свой ритм</Text>
            <Text style={styles.subtitle}>
              3 дня бесплатно, затем выбранный тариф.{"\n"}
              Все возможности Pro — в любом плане.
            </Text>
          </View>

          <View style={styles.list}>
            {PLANS.map((plan) => {
              const colors = planGradients[plan.id];
              const selectedPlan = plan.id === selectedId;
              const textColor = selectedPlan ? colors.text : NEUTRAL.text;
              const priceColor = selectedPlan ? colors.text : colors.base;
              const mutedText = selectedPlan
                ? `${colors.text}B8`
                : "rgba(245,240,248,0.7)";
              const savingsColor = selectedPlan ? colors.text : colors.border;
              const badgeBg = selectedPlan
                ? `${colors.text}14`
                : "rgba(245,240,248,0.1)";

              return (
                <Pressable
                  key={plan.id}
                  onPress={() => selectPlan(plan.id)}
                  testID={`pro-plan-${plan.id}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedPlan }}
                  accessibilityLabel={`${plan.period}, ${plan.monthly} в месяц`}
                  style={({ pressed }) => [
                    styles.card,
                    selectedPlan
                      ? {
                          borderColor: colors.border,
                          backgroundColor: colors.base,
                          shadowColor: colors.border,
                          shadowOpacity: 0.45,
                          shadowRadius: 16,
                          elevation: 8,
                        }
                      : styles.cardNeutral,
                    selectedPlan && styles.cardSelected,
                    pressed && styles.cardPressed,
                  ]}
                >
                  {selectedPlan ? <PlanCardWash planId={plan.id} /> : null}
                  <View style={styles.cardBody}>
                    <View style={styles.cardCopy}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.period, { color: textColor }]}>
                          {plan.period}
                        </Text>
                        {plan.titleBadge ? (
                          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                            <Text
                              style={[styles.badgeText, { color: textColor }]}
                            >
                              {plan.titleBadge}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.priceRow}>
                        <Text style={[styles.monthly, { color: priceColor }]}>
                          {plan.monthlyApprox ? "≈\u00A0" : ""}
                          {plan.monthly}
                        </Text>
                        <Text
                          style={[styles.monthlySuffix, { color: mutedText }]}
                        >
                          {" "}/ мес.
                        </Text>
                        {plan.priceBadge ? (
                          <View
                            style={[styles.priceBadge, { backgroundColor: badgeBg }]}
                          >
                            <Text
                              style={[styles.badgeText, { color: textColor }]}
                            >
                              {plan.priceBadge}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={[styles.detail, { color: mutedText }]}>
                        {plan.detail}
                      </Text>
                      {plan.savings ? (
                        <Text style={[styles.savings, { color: savingsColor }]}>
                          {plan.savings}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.radio,
                        selectedPlan
                          ? {
                              borderColor: `${colors.text}55`,
                              backgroundColor: colors.text,
                            }
                          : styles.radioNeutral,
                      ]}
                    >
                      {selectedPlan ? <View style={styles.radioDot} /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.cancelNote}>
            Отменить продление можно в любой момент.
          </Text>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) + 20 },
          ]}
        >
          {payError ? <Text style={styles.payError}>{payError}</Text> : null}
          <Pressable
            onPress={() => void checkout()}
            disabled={paying || isPro}
            testID="pro-checkout"
            accessibilityRole="button"
            accessibilityLabel={
              isPro ? "Подписка активна" : "Начать 3 дня бесплатно"
            }
            style={({ pressed }) => [
              styles.ctaWrap,
              pressed && !paying && !isPro && styles.ctaPressed,
              (paying || isPro) && { opacity: 0.85 },
            ]}
          >
            <LinearGradient
              colors={theme.gradients.primaryCta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              {paying ? (
                <ActivityIndicator color={theme.colors.primaryCtaText} />
              ) : (
                <Text style={styles.ctaText}>
                  {isPro ? "Подписка активна" : "Начать 3 дня бесплатно"}
                </Text>
              )}
            </LinearGradient>
          </Pressable>
          <Text style={styles.renewNote}>{selected.renewNote}</Text>
          <View style={styles.links}>
            <Pressable
              onPress={() => openLink("https://arcanyx.app/terms")}
              hitSlop={8}
            >
              <Text style={styles.link}>Условия подписки</Text>
            </Pressable>
            <Text style={styles.linkDot}>·</Text>
            <Pressable
              onPress={() => openLink("https://arcanyx.app/privacy")}
              hitSlop={8}
            >
              <Text style={styles.link}>Конфиденциальность</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#080513",
  },
  page: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#0B0718",
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  intro: {
    alignItems: "center",
    marginTop: 2,
    paddingHorizontal: 18,
  },
  title: {
    color: "#FBF7F2",
    fontFamily: theme.fonts.heading,
    fontSize: 40,
    lineHeight: 42,
    textAlign: "center",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "#C9C2D8",
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 7,
  },
  list: {
    gap: 12,
    paddingHorizontal: 17,
    marginTop: 18,
  },
  card: {
    borderRadius: 24,
    borderWidth: 2,
    paddingVertical: 18,
    paddingHorizontal: 18,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
  },
  cardNeutral: {
    backgroundColor: NEUTRAL.background,
    borderColor: NEUTRAL.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  cardSelected: {
    borderWidth: 2.5,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  period: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 16,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 6,
  },
  badgeText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    marginTop: 10,
  },
  monthly: {
    fontFamily: theme.fonts.display,
    fontSize: 36,
    lineHeight: 40,
  },
  monthlySuffix: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  detail: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  savings: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioNeutral: {
    borderColor: "rgba(245,240,248,0.35)",
    backgroundColor: "transparent",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  cancelNote: {
    color: "#716B82",
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 24,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 17,
    backgroundColor: "rgba(11,7,24,0.97)",
  },
  ctaWrap: {
    borderRadius: 999,
    overflow: "hidden",
    ...theme.shadows.ctaPrimary,
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  cta: {
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  ctaText: {
    color: theme.colors.primaryCtaText,
    fontFamily: theme.fonts.bodySemi,
    fontSize: 17,
  },
  payError: {
    color: "#F4B2C0",
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  renewNote: {
    color: "#9A94AB",
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 10,
  },
  links: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  link: {
    color: "#B7B0C6",
    fontFamily: theme.fonts.body,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  linkDot: {
    color: "#716B82",
    fontFamily: theme.fonts.body,
    fontSize: 12,
  },
});
