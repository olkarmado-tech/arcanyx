import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";
import ProBrandMark from "./ProBrandMark";

const HERO = require("../../../assets/pro/hero.jpg");

type Props = {
  topInset: number;
  onBack: () => void;
};

/** Shared scrollable hero + brand header for Pro benefits and plans. */
export default function ProHeroHeader({ topInset, onBack }: Props) {
  return (
    <View style={styles.hero}>
      <Image
        source={HERO}
        style={[StyleSheet.absoluteFill, styles.heroImage]}
        contentFit="cover"
        contentPosition="center"
      />
      <LinearGradient
        colors={[
          "#0B0718",
          "rgba(11,7,24,0.72)",
          "rgba(11,7,24,0.12)",
          "rgba(11,7,24,0)",
          "rgba(11,7,24,0.1)",
          "#0B0718",
        ]}
        locations={[0, 0.16, 0.3, 0.48, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: topInset + 10 }]}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Назад"
          testID="pro-back"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.headerPressed,
          ]}
        >
          <ArrowLeft color="#FAF6FF" size={24} strokeWidth={1.7} />
        </Pressable>
        <ProBrandMark style={styles.brand} />
        <View style={styles.headerSpacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    height: 236,
    backgroundColor: "#0B0718",
    overflow: "hidden",
  },
  heroImage: {
    transform: [{ translateY: 36 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerPressed: {
    opacity: 0.65,
  },
  brand: {
    flex: 1,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
});
