import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { theme } from "../../src/theme";
import CosmicBackground from "../../src/components/CosmicBackground";
import OracleScreen from "../../src/screens/OracleScreen";
import TarotScreen from "../../src/screens/TarotScreen";
import { useTarotSpreads } from "../../src/context/TarotSpreadsContext";

const ICON_CARD = require("../../assets/icons/icon-card2.png");
const ICON_ORACLE = require("../../assets/icons/icon-oracle.png");
/** Совпадает с CosmicBackground / Oracle scene floor. */
const ORACLE_TOP = "#0C0B11";

type GadanieTab = "oracle" | "tarot";

export default function GadaniaScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { refresh: refreshSpreads } = useTarotSpreads();
  const [active, setActive] = useState<GadanieTab>(() =>
    tab === "oracle" ? "oracle" : "tarot",
  );
  const [mounted, setMounted] = useState({
    oracle: tab === "oracle",
    tarot: tab !== "oracle",
  });

  useFocusEffect(
    useCallback(() => {
      void refreshSpreads();
    }, [refreshSpreads]),
  );

  useEffect(() => {
    if (tab === "tarot") setActive("tarot");
    else if (tab === "oracle") setActive("oracle");
  }, [tab]);

  useEffect(() => {
    setMounted((prev) => (prev[active] ? prev : { ...prev, [active]: true }));
  }, [active]);

  const select = (t: GadanieTab) => {
    if (t === active) return;
    Haptics.selectionAsync().catch(() => {});
    setActive(t);
    router.setParams({ tab: t });
  };

  return (
    <View
      style={[
        styles.root,
        active === "oracle" ? styles.rootOracle : styles.rootTarot,
      ]}
      testID="gadania-root"
    >
      {active === "tarot" ? <CosmicBackground variant="tarot" /> : null}
      <SafeAreaView
        edges={["top"]}
        style={[
          styles.segmentSafe,
          active === "oracle" && styles.segmentSafeOracle,
        ]}
      >
        <View style={styles.segmentPill}>
          <Pressable
            onPress={() => select("oracle")}
            style={({ pressed }) => [
              styles.segOption,
              pressed && { opacity: 0.92 },
            ]}
            testID="gadania-tab-oracle"
          >
            {active === "oracle" ? (
              <LinearGradient
                pointerEvents="none"
                colors={theme.gradients.softLilac}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.segFill}
              />
            ) : null}
            <Image
              source={ICON_ORACLE}
              style={styles.segIconOracle}
              tintColor={
                active === "oracle"
                  ? theme.colors.softLilacText
                  : "rgba(201,196,220,0.78)"
              }
              contentFit="contain"
            />
            <Text
              numberOfLines={1}
              style={[
                styles.segText,
                active === "oracle" && styles.segTextActive,
              ]}
            >
              Оракул
            </Text>
          </Pressable>
          <Pressable
            onPress={() => select("tarot")}
            style={({ pressed }) => [
              styles.segOption,
              pressed && { opacity: 0.92 },
            ]}
            testID="gadania-tab-tarot"
          >
            {active === "tarot" ? (
              <LinearGradient
                pointerEvents="none"
                colors={theme.gradients.softLilac}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.segFill}
              />
            ) : null}
            <Image
              source={ICON_CARD}
              style={styles.segIconTarot}
              tintColor={
                active === "tarot"
                  ? theme.colors.softLilacText
                  : "rgba(201,196,220,0.78)"
              }
              contentFit="contain"
            />
            <Text
              numberOfLines={1}
              style={[styles.segText, active === "tarot" && styles.segTextActive]}
            >
              Таро
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <View style={styles.content}>
        {mounted.oracle ? (
          <View
            style={[styles.pane, active !== "oracle" && styles.paneHidden]}
            pointerEvents={active === "oracle" ? "auto" : "none"}
          >
            <OracleScreen embedded />
          </View>
        ) : null}
        {mounted.tarot ? (
          <View
            style={[styles.pane, active !== "tarot" && styles.paneHidden]}
            pointerEvents={active === "tarot" ? "auto" : "none"}
          >
            <TarotScreen embedded />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootOracle: {
    backgroundColor: ORACLE_TOP,
  },
  rootTarot: {
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
  },
  pane: {
    flex: 1,
  },
  paneHidden: {
    display: "none",
  },
  segmentSafe: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
    alignItems: "center",
  },
  segmentSafeOracle: {
    backgroundColor: ORACLE_TOP,
  },
  segmentPill: {
    flexDirection: "row",
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(243,237,249,0.16)",
    backgroundColor: "rgba(18,16,34,0.72)",
    padding: 4,
    gap: 2,
    overflow: "hidden",
  },
  segOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    minWidth: 118,
    overflow: "hidden",
    position: "relative",
  },
  segFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
  },
  segIconOracle: {
    width: 26,
    height: 26,
    marginRight: 4,
    zIndex: 1,
  },
  segIconTarot: {
    width: 32,
    height: 32,
    marginRight: 4,
    zIndex: 1,
  },
  segText: {
    fontFamily: theme.fonts.bodySemi,
    fontSize: 13,
    letterSpacing: 0.35,
    color: "rgba(201,196,220,0.78)",
    zIndex: 1,
  },
  segTextActive: {
    color: theme.colors.softLilacText,
  },
});
