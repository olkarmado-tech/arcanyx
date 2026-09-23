import React, { useState } from "react";
import { Platform, View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { BlurView, type BlurTint } from "expo-blur";
import { theme } from "../theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: BlurTint;
  borderColor?: string;
  glow?: "gold" | "purple" | "none";
  surfaceColor?: string;
  overlayColor?: string;
  /**
   * Default clips children to the rounded glass rect. When true, blur sits in an
   * absolute layer with overflow hidden while children render in a sibling with
   * overflow visible (native BlurView otherwise clips decorations like soft glows).
   */
  allowOverflow?: boolean;
};

export default function GlassCard({
  children,
  style,
  intensity = 28,
  tint = "dark",
  borderColor,
  glow = "none",
  surfaceColor,
  overlayColor,
  allowOverflow = false,
}: Props) {
  const glowStyle =
    glow === "gold"
      ? styles.glowGold
      : glow === "purple"
        ? styles.glowPurple
        : null;

  const borderCol = borderColor ?? theme.colors.border;
  const surfCol = surfaceColor ?? theme.colors.surfaceGlass;
  const overCol = overlayColor ?? "rgba(26,24,36,0.74)";
  const [backdropSize, setBackdropSize] = useState({ width: 0, height: 0 });
  const clipRadius = radiusFrom(style) ?? theme.radius.lg;
  // Android paints an opaque black plate behind any elevated view. Translucent
  // inputs then show that plate as a dark rectangle, so keep the wash flat.
  // The clip still needs overflow:hidden plus a background, or square corners
  // of fills and images draw outside the rounded border.
  const androidFlat = Platform.OS === "android" ? styles.androidFlat : null;
  const androidClip =
    Platform.OS === "android"
      ? { overflow: "hidden" as const, borderRadius: clipRadius, backgroundColor: surfCol }
      : null;

  if (allowOverflow) {
    const measured = backdropSize.width > 0 && backdropSize.height > 0;
    const frostOnNative = Platform.OS !== "web";
    return (
      <View style={[styles.wrapper, glowStyle, androidFlat, style]} pointerEvents="box-none">
        <View
          style={[
            styles.overflowShell,
            { borderColor: borderCol, borderRadius: clipRadius },
            frostOnNative && Platform.OS !== "android" ? styles.overflowShellNativeFrost : null,
          ]}
          pointerEvents="box-none"
        >
          {/* iOS BlurView in a content-sized overlay paints a dark strip — tint the
              hero instead, so the nebula shows through as matte glass. */}
          <View
            style={[
              styles.overflowBackdropClip,
              { borderRadius: clipRadius, backgroundColor: surfCol },
              measured
                ? { width: backdropSize.width, height: backdropSize.height }
                : styles.overflowBackdropFallback,
            ]}
            pointerEvents="none"
          >
            {frostOnNative ? (
              <View style={[styles.overflowBlurFill, { backgroundColor: surfCol }]} />
            ) : (
              <BlurView
                intensity={intensity}
                tint={tint}
                style={[styles.overflowBlurFill, { backgroundColor: surfCol }]}
              />
            )}
            <View style={[styles.bgOverlay, { backgroundColor: overCol }]} pointerEvents="none" />
          </View>
          <View
            style={styles.overflowForeground}
            pointerEvents="box-none"
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setBackdropSize((prev) =>
                prev.width === width && prev.height === height
                  ? prev
                  : { width, height },
              );
            }}
          >
            {children}
          </View>
        </View>
      </View>
    );
  }

  // Android BlurView paints a dark rectangle inside the rounded border.
  // A flat wash keeps the card one tone, matching the iOS glass.
  if (Platform.OS === "android") {
    return (
      <View
        style={[styles.wrapper, glowStyle, androidFlat, style, androidClip]}
        pointerEvents="box-none"
      >
        <View
          pointerEvents="box-none"
          style={[
            styles.inner,
            {
              borderColor: borderCol,
              backgroundColor: surfCol,
              borderRadius: clipRadius,
              overflow: "hidden",
            },
          ]}
        >
          <View style={[styles.bgOverlay, { backgroundColor: overCol }]} pointerEvents="none" />
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, glowStyle, androidFlat, style]} pointerEvents="box-none">
      <BlurView
        intensity={intensity}
        tint={tint}
        pointerEvents="box-none"
        style={[
          styles.inner,
          {
            borderColor: borderCol,
            borderRadius: clipRadius,
            // Fill on UIVisualEffectView kills iOS frost; keep the wash in the overlay.
            backgroundColor: "transparent",
          },
        ]}
      >
        <View style={[styles.bgOverlay, { backgroundColor: overCol }]} pointerEvents="none" />
        {children}
      </BlurView>
    </View>
  );
}

function radiusFrom(style: StyleProp<ViewStyle>): number | undefined {
  const flat = StyleSheet.flatten(style);
  return typeof flat?.borderRadius === "number" ? flat.borderRadius : undefined;
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: theme.radius.lg,
    overflow: "visible",
    ...theme.shadows.card,
  },
  androidFlat: {
    elevation: 0,
    shadowOpacity: 0,
  },
  inner: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: theme.colors.surfaceGlass,
  },
  /** Shell when children may extend past the rounded rect (glows, particles). */
  overflowShell: {
    position: "relative",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "visible",
  },
  overflowShellNativeFrost: {
    backgroundColor: "rgba(20, 18, 28, 0.42)",
  },
  overflowBackdropClip: {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  overflowBackdropFallback: {
    right: 0,
    bottom: 0,
  },
  overflowBlurFill: {
    ...StyleSheet.absoluteFill,
  },
  overflowForeground: {
    overflow: "visible",
  },
  bgOverlay: {
    ...StyleSheet.absoluteFill,
  },
  glowGold: {
    ...theme.shadows.glowGold,
  },
  glowPurple: {
    ...theme.shadows.glowPurple,
  },
});
