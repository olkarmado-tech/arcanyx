import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
/* Reanimated shared values are mutated via `.value` by design. */
/* eslint-disable react-hooks/immutability */
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme";

export type MorphSegmentItem = {
  key: string;
  label: string;
  testID?: string;
  accessibilityLabel?: string;
  Icon?: React.ComponentType<{
    color: string;
    size?: number;
    width?: number;
    height?: number;
    strokeWidth?: number;
  }>;
};

type Rect = { x: number; y: number; width: number; height: number };

type Props = {
  items: MorphSegmentItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
  /** Bounce/rotate only for bottom tab icons. */
  animateIcons?: boolean;
  style?: StyleProp<ViewStyle>;
  trackStyle?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  underlayInset?: number;
};

const PILL_DURATION = 560;
const PILL_EASING = Easing.bezier(0.3, 0, 0.2, 1);
const ICON_DELAY = 140;
const ICON_DURATION = 460;
const ICON_EASING = Easing.bezier(0.2, 0.7, 0.25, 1);
const LIGHT_LABEL_MS = 380;
const ACTIVE_COLOR = "#21192F";
const INACTIVE_COLOR = "#BCB0D0";
const CROSSING_COLOR = "#F3EBFF";
const BASE_RADIUS = 20;
const KEY_PROGRESS = [0, 0.36, 0.78, 1];

function samplePill(
  p: number,
  fromX: number,
  fromW: number,
  fromScaleY: number,
  fromRadius: number,
  fromOpacity: number,
  bridgeLeft: number,
  bridgeW: number,
  toX: number,
  toW: number,
) {
  "worklet";
  return {
    x: interpolate(p, KEY_PROGRESS, [fromX, bridgeLeft, toX, toX]),
    w: interpolate(p, KEY_PROGRESS, [fromW, bridgeW, toW, toW]),
    scaleY: interpolate(p, KEY_PROGRESS, [fromScaleY, 0.58, 1.04, 1]),
    radius: interpolate(p, KEY_PROGRESS, [fromRadius, 50, 24, BASE_RADIUS]),
    opacity: interpolate(p, KEY_PROGRESS, [fromOpacity, 0.66, 1, 1]),
  };
}

export default function MorphingSegmentTrack({
  items,
  selectedKey,
  onSelect,
  animateIcons = false,
  style,
  trackStyle,
  itemStyle,
  labelStyle,
  underlayInset = 0,
}: Props) {
  const layoutsRef = useRef<Record<string, Rect>>({});
  const [layoutsVersion, setLayoutsVersion] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [crossingLabels, setCrossingLabels] = useState(false);
  const previousKeyRef = useRef(selectedKey);
  const [settlingKey, setSettlingKey] = useState<string | null>(null);
  const colorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const hasPlacedRef = useRef(false);

  const progress = useSharedValue(1);
  const fromX = useSharedValue(0);
  const fromW = useSharedValue(0);
  const fromScaleY = useSharedValue(1);
  const fromRadius = useSharedValue(BASE_RADIUS);
  const fromOpacity = useSharedValue(1);
  const bridgeLeft = useSharedValue(0);
  const bridgeW = useSharedValue(0);
  const toX = useSharedValue(0);
  const toW = useSharedValue(0);
  const pillY = useSharedValue(0);
  const pillH = useSharedValue(0);
  const iconProgress = useSharedValue(1);
  const iconDirection = useSharedValue(1);
  const prevIconProgress = useSharedValue(1);

  const itemKeys = useMemo(() => items.map((item) => item.key), [items]);

  useEffect(() => {
    mountedRef.current = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mountedRef.current = false;
      if (colorTimerRef.current) clearTimeout(colorTimerRef.current);
      cancelAnimation(progress);
      cancelAnimation(iconProgress);
      cancelAnimation(prevIconProgress);
      sub.remove();
    };
  }, [iconProgress, prevIconProgress, progress]);

  const clearColorTimer = useCallback(() => {
    if (colorTimerRef.current) {
      clearTimeout(colorTimerRef.current);
      colorTimerRef.current = null;
    }
  }, []);

  const placeAtKey = useCallback(
    (key: string, animate: boolean) => {
      const rect = layoutsRef.current[key];
      if (!rect || rect.width <= 0) return;

      const x1 = rect.x;
      const w1 = rect.width;
      const y1 = rect.y + underlayInset;
      const h1 = Math.max(rect.height - underlayInset * 2, 1);

      if (reduceMotion || !animate || !hasPlacedRef.current) {
        cancelAnimation(progress);
        cancelAnimation(iconProgress);
        cancelAnimation(prevIconProgress);
        fromX.value = x1;
        fromW.value = w1;
        fromScaleY.value = 1;
        fromRadius.value = BASE_RADIUS;
        fromOpacity.value = 1;
        bridgeLeft.value = x1;
        bridgeW.value = w1;
        toX.value = x1;
        toW.value = w1;
        pillY.value = y1;
        pillH.value = h1;
        progress.value = 1;
        iconProgress.value = 1;
        prevIconProgress.value = 1;
        setSettlingKey(null);
        hasPlacedRef.current = true;
        clearColorTimer();
        setCrossingLabels(false);
        return;
      }

      const current = samplePill(
        progress.value,
        fromX.value,
        fromW.value,
        fromScaleY.value,
        fromRadius.value,
        fromOpacity.value,
        bridgeLeft.value,
        bridgeW.value,
        toX.value,
        toW.value,
      );

      const left = Math.min(current.x, x1);
      const widthBridge = Math.max(current.x + current.w, x1 + w1) - left;

      fromX.value = current.x;
      fromW.value = current.w;
      fromScaleY.value = current.scaleY;
      fromRadius.value = current.radius;
      fromOpacity.value = current.opacity;
      bridgeLeft.value = left;
      bridgeW.value = widthBridge;
      toX.value = x1;
      toW.value = w1;
      pillY.value = y1;
      pillH.value = h1;

      cancelAnimation(progress);
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: PILL_DURATION,
        easing: PILL_EASING,
      });

      if (animateIcons) {
        const fromIndex = itemKeys.indexOf(previousKeyRef.current);
        const toIndex = itemKeys.indexOf(key);
        iconDirection.value = toIndex >= fromIndex ? 1 : -1;
        setSettlingKey(previousKeyRef.current);

        cancelAnimation(iconProgress);
        cancelAnimation(prevIconProgress);
        prevIconProgress.value = 0;
        prevIconProgress.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
        iconProgress.value = 0;
        iconProgress.value = withDelay(
          ICON_DELAY,
          withTiming(1, {
            duration: ICON_DURATION,
            easing: ICON_EASING,
          }),
        );
      }

      clearColorTimer();
      setCrossingLabels(true);
      colorTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setCrossingLabels(false);
      }, LIGHT_LABEL_MS);

      hasPlacedRef.current = true;
    },
    [
      animateIcons,
      bridgeLeft,
      bridgeW,
      clearColorTimer,
      fromOpacity,
      fromRadius,
      fromScaleY,
      fromW,
      fromX,
      iconDirection,
      iconProgress,
      itemKeys,
      pillH,
      pillY,
      prevIconProgress,
      progress,
      reduceMotion,
      toW,
      toX,
      underlayInset,
    ],
  );

  const measureItem = useCallback((key: string, event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    const prev = layoutsRef.current[key];
    if (
      prev &&
      prev.x === x &&
      prev.y === y &&
      prev.width === width &&
      prev.height === height
    ) {
      return;
    }
    layoutsRef.current[key] = { x, y, width, height };
    setLayoutsVersion((value) => value + 1);
  }, []);

  useLayoutEffect(() => {
    const ready = items.every((item) => {
      const rect = layoutsRef.current[item.key];
      return Boolean(rect && rect.width > 0);
    });
    if (!ready) return;

    if (previousKeyRef.current !== selectedKey) {
      placeAtKey(selectedKey, true);
      previousKeyRef.current = selectedKey;
      return;
    }

    placeAtKey(selectedKey, false);
  }, [items, layoutsVersion, placeAtKey, selectedKey]);

  const underlayStyle = useAnimatedStyle(() => {
    const current = samplePill(
      progress.value,
      fromX.value,
      fromW.value,
      fromScaleY.value,
      fromRadius.value,
      fromOpacity.value,
      bridgeLeft.value,
      bridgeW.value,
      toX.value,
      toW.value,
    );
    return {
      position: "absolute" as const,
      left: current.x,
      top: pillY.value,
      width: current.w,
      height: pillH.value,
      borderRadius: current.radius,
      opacity: current.opacity,
      transform: [{ scaleY: current.scaleY }],
      overflow: "hidden" as const,
    };
  });

  const iconStyleActive = useAnimatedStyle(() => {
    if (!animateIcons) {
      return {
        transform: [{ translateY: 0 }, { rotate: "0deg" }, { scale: 1 }],
      };
    }
    const p = iconProgress.value;
    const dir = iconDirection.value;
    return {
      transform: [
        { translateY: interpolate(p, [0, 0.48, 1], [0, -5, -2]) },
        {
          rotate: `${interpolate(p, [0, 0.48, 1], [0, dir * 9, 0])}deg`,
        },
        { scale: interpolate(p, [0, 0.48, 1], [0.9, 1.12, 1]) },
      ],
    };
  });

  const iconStyleSettle = useAnimatedStyle(() => {
    if (!animateIcons) {
      return {
        transform: [{ translateY: 0 }, { rotate: "0deg" }, { scale: 1 }],
      };
    }
    const settle = prevIconProgress.value;
    return {
      transform: [
        { translateY: interpolate(settle, [0, 1], [-2, 0]) },
        { rotate: "0deg" },
        { scale: interpolate(settle, [0, 1], [1.05, 1]) },
      ],
    };
  });

  return (
    <View style={style}>
      <View style={[styles.track, trackStyle]} collapsable={false}>
        <Animated.View pointerEvents="none" style={underlayStyle}>
          <LinearGradient
            colors={theme.gradients.softLilac}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {items.map((item) => {
          const selected = item.key === selectedKey;
          const settling = settlingKey === item.key && !selected;
          const color = crossingLabels
            ? CROSSING_COLOR
            : selected
              ? ACTIVE_COLOR
              : INACTIVE_COLOR;
          const Icon = item.Icon;
          return (
            <Pressable
              key={item.key}
              onLayout={(event) => measureItem(item.key, event)}
              onPress={() => onSelect(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={item.accessibilityLabel ?? item.label}
              testID={item.testID}
              style={({ pressed }) => [
                styles.item,
                itemStyle,
                pressed && styles.itemPressed,
              ]}
              collapsable={false}
            >
              {Icon ? (
                <Animated.View
                  style={
                    selected
                      ? iconStyleActive
                      : settling
                        ? iconStyleSettle
                        : undefined
                  }
                >
                  <Icon
                    color={color}
                    size={selected ? 22 : 20}
                    width={selected ? 22 : 20}
                    height={selected ? 22 : 20}
                    strokeWidth={selected ? 2 : 1.6}
                  />
                </Animated.View>
              ) : null}
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  labelStyle,
                  { color },
                  crossingLabels && styles.labelCrossing,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  item: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  itemPressed: {
    opacity: 0.9,
  },
  label: {
    fontFamily: theme.fonts.bodySemi,
    textAlign: "center",
  },
  labelCrossing: {
    textShadowColor: "rgba(16,12,28,0.55)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
});
