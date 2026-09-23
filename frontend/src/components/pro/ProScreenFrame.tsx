import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import ProBrandMark from "./ProBrandMark";
import { theme } from "../../theme";

const PRO_BG = require("../../../assets/home/bg-popup.jpg");

type Props = {
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function ProScreenFrame({ children, footer }: Props) {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/diary" as never);
  };

  return (
    <View style={styles.root}>
      <Image
        source={PRO_BG}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
        contentFit="cover"
      />
      <LinearGradient
        colors={[
          "rgba(8,6,16,0.12)",
          "rgba(8,6,16,0.34)",
          "rgba(8,6,16,0.78)",
        ]}
        locations={[0, 0.48, 1]}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
      />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Назад"
            testID="pro-back"
          >
            <ArrowLeft color={theme.colors.text} size={21} strokeWidth={1.8} />
          </Pressable>
          <ProBrandMark style={styles.brand} />
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0C0B11",
  },
  backdrop: {
    pointerEvents: "none",
  },
  safe: {
    flex: 1,
  },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    flex: 1,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footer: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,215,154,0.22)",
    backgroundColor: "rgba(8,6,16,0.42)",
  },
});
