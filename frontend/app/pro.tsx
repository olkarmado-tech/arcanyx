import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronRight, Crown } from "lucide-react-native";
import ProHeroHeader from "../src/components/pro/ProHeroHeader";
import { useUser } from "../src/context/UserContext";
import { theme } from "../src/theme";

const MEDITATIONS = require("../assets/pro/meditations.jpg");
const DREAMS = require("../assets/pro/dreams.jpg");
const ORACLE = require("../assets/pro/oracle.jpg");
const TAROT = require("../assets/pro/tarot.jpg");

export default function ProScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPro } = useUser();

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/diary" as never);
  };

  const openPlans = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push("/pro-plans" as never);
  };

  const openSection = (route: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(route as never);
  };

  return (
    <View style={styles.root}>
      <View style={styles.page}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 128 + Math.max(insets.bottom, 8) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ProHeroHeader topInset={insets.top} onBack={handleBack} />

          <View style={styles.intro}>
            <Text style={styles.title}>Больше способов{"\n"}услышать себя</Text>
            <Text style={styles.subtitle}>
              Все практики Arcanyx — в одной подписке.
            </Text>
          </View>

          <View style={styles.cards}>
            <Animated.View entering={FadeInDown.duration(420).delay(80)}>
              <Pressable
                onPress={() => openSection("/(tabs)/meditations")}
                accessibilityRole="button"
                accessibilityLabel="Открыть библиотеку медитаций"
                style={({ pressed }) => [
                  styles.card,
                  styles.meditationCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <Image
                  source={MEDITATIONS}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["rgba(15,9,32,0.94)", "rgba(15,9,32,0.18)"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 0.9, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.largeCardCopy}>
                  <Text style={styles.cardTitle}>
                    Медитации{"\n"}и аффирмации
                  </Text>
                  <Text style={styles.cardDescription}>
                    Находи спокойствие.{"\n"}Настраивайся на своё.
                  </Text>
                  <View style={styles.cardLink}>
                    <Text style={styles.cardLinkText}>Вся библиотека</Text>
                    <ChevronRight color="#F7F2FA" size={14} strokeWidth={1.7} />
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            <View style={styles.cardRow}>
              <Animated.View
                entering={FadeInDown.duration(420).delay(140)}
                style={styles.halfCardWrap}
              >
                <Pressable
                  onPress={() => openSection("/(tabs)/dreambook")}
                  accessibilityRole="button"
                  accessibilityLabel="Открыть толкование снов"
                  style={({ pressed }) => [
                    styles.card,
                    styles.halfCard,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <Image
                    source={DREAMS}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={["rgba(8,7,27,0)", "rgba(8,7,27,0.92)"]}
                    locations={[0.32, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.smallCardCopy}>
                    <Text style={styles.smallCardTitle}>
                      Понимай{"\n"}свои сны
                    </Text>
                    <Text style={styles.smallCardDescription}>
                      Толкования{"\n"}без ограничений
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(420).delay(200)}
                style={styles.halfCardWrap}
              >
                <Pressable
                  onPress={() => openSection("/(tabs)/gadania?tab=oracle")}
                  accessibilityRole="button"
                  accessibilityLabel="Открыть три голоса шара"
                  style={({ pressed }) => [
                    styles.card,
                    styles.halfCard,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <Image
                    source={ORACLE}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={["rgba(15,7,31,0)", "rgba(15,7,31,0.94)"]}
                    locations={[0.32, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.smallCardCopy}>
                    <Text style={styles.smallCardTitle}>3 голоса шара</Text>
                    <Text style={styles.smallCardDescription}>
                      Вселенная, Тень{"\n"}и Внутреннее я
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.duration(420).delay(260)}>
              <Pressable
                onPress={() => openSection("/(tabs)/gadania?tab=tarot")}
                accessibilityRole="button"
                accessibilityLabel="Открыть расклады Таро"
                style={({ pressed }) => [
                  styles.card,
                  styles.tarotCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <Image
                  source={TAROT}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["rgba(10,6,25,0.94)", "rgba(10,6,25,0.02)"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 0.78, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.tarotCopy}>
                  <Text style={styles.tarotTitle}>Смотри глубже с Таро</Text>
                  <Text style={styles.tarotDescription}>
                    12+ раскладов · Безлимитные{"\n"}толкования и чат с AI-тарологом
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          </View>

          <View style={styles.noteRow}>
            <View style={styles.noteLine} />
            <Text style={styles.note}>Библиотеки медитаций и раскладов пополняются</Text>
            <View style={styles.noteLine} />
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) + 20 },
          ]}
        >
          {isPro ? (
            <View style={styles.activePill}>
              <Crown color={theme.colors.gold} size={18} strokeWidth={1.8} />
              <Text style={styles.activeText}>Подписка активна</Text>
            </View>
          ) : (
            <Pressable
              onPress={openPlans}
              testID="pro-benefits-cta"
              accessibilityRole="button"
              accessibilityLabel="Оформить Pro"
              style={({ pressed }) => [
                styles.ctaWrap,
                pressed && styles.ctaPressed,
              ]}
            >
              <LinearGradient
                colors={theme.gradients.primaryCta}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Открыть все возможности</Text>
                <ChevronRight
                  color={theme.colors.primaryCtaText}
                  size={21}
                  strokeWidth={1.8}
                />
              </LinearGradient>
            </Pressable>
          )}
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
    fontSize: 45,
    lineHeight: 43,
    textAlign: "center",
    letterSpacing: -0.9,
  },
  subtitle: {
    color: "#C9C2D8",
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 7,
  },
  cards: {
    gap: 8,
    paddingHorizontal: 17,
    marginTop: 16,
  },
  card: {
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(226,206,255,0.27)",
    backgroundColor: "#171029",
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  meditationCard: {
    height: 168,
  },
  largeCardCopy: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  cardTitle: {
    color: "#FFF9F2",
    fontFamily: theme.fonts.heading,
    fontSize: 25,
    lineHeight: 23,
  },
  cardDescription: {
    color: "#D5CEDF",
    fontFamily: theme.fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
  },
  cardLink: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 14,
    marginTop: 9,
    borderRadius: 999,
    backgroundColor: "rgba(213,205,231,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardLinkText: {
    color: "#F7F2FA",
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11.5,
  },
  cardRow: {
    flexDirection: "row",
    gap: 8,
  },
  halfCardWrap: {
    flex: 1,
  },
  halfCard: {
    height: 180,
  },
  smallCardCopy: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingBottom: 13,
  },
  smallCardTitle: {
    color: "#FFF9F2",
    fontFamily: theme.fonts.heading,
    fontSize: 21,
    lineHeight: 19,
  },
  smallCardDescription: {
    color: "#C7C0D4",
    fontFamily: theme.fonts.body,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 6,
  },
  tarotCard: {
    height: 126,
  },
  tarotCopy: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 20,
  },
  tarotTitle: {
    color: "#FFF9F2",
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    lineHeight: 26,
  },
  tarotDescription: {
    color: "#C7C0D4",
    fontFamily: theme.fonts.body,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 3,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 17,
    marginTop: 15,
  },
  noteLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(221,205,244,0.2)",
  },
  note: {
    color: "#716B82",
    fontFamily: theme.fonts.body,
    fontSize: 10.5,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 11,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 24,
  },
  ctaText: {
    color: theme.colors.primaryCtaText,
    fontFamily: theme.fonts.bodySemi,
    fontSize: 17,
  },
  activePill: {
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    backgroundColor: "rgba(255,215,154,0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  activeText: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.bodySemi,
    fontSize: 15,
  },
});
