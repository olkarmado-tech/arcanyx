import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "../theme";

function TypingIndicator() {
  const progress = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let alive = true;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        preferenceChanged = true;
        if (alive) setReduceMotion(enabled);
      },
    );
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (alive && !preferenceChanged) setReduceMotion(enabled);
      })
      .catch(() => {});
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    progress.setValue(0);
    if (reduceMotion) return;
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [progress, reduceMotion]);

  return (
    <View
      style={styles.dots}
      accessible
      accessibilityLabel="Arcanyx готовит ответ"
      accessibilityState={{ busy: true }}
    >
      {[0, 1, 2].map((index) => {
        const offset = (index * 120) / 900;
        const inputRange =
          index === 0
            ? [0, 0.15, 0.3, 0.45, 0.6, 1]
            : [
                0,
                offset,
                offset + 0.15,
                offset + 0.3,
                offset + 0.45,
                offset + 0.6,
                1,
              ];
        const wave =
          index === 0
            ? [0, 0.6, 1, 0.6, 0, 0]
            : [0, 0, 0.6, 1, 0.6, 0, 0];

        return (
          <Animated.View
            key={index}
            accessible={false}
            style={[
              styles.dot,
              {
                opacity: reduceMotion
                  ? 0.8
                  : progress.interpolate({
                      inputRange,
                      outputRange: wave.map((value) => 0.4 + value * 0.6),
                      extrapolate: "clamp",
                    }),
                transform: [
                  {
                    translateY: reduceMotion
                      ? 0
                      : progress.interpolate({
                          inputRange,
                          outputRange: wave.map((value) => -4 * value),
                          extrapolate: "clamp",
                        }),
                  },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

type Props = {
  isLoading: boolean;
  text: string;
};

export default function TarotChatReply({ isLoading, text }: Props) {
  const hasText = text.trim().length > 0;
  if (!hasText && !isLoading) return null;

  return (
    <View style={styles.reply}>
      <Text style={styles.label}>Arcanyx</Text>
      {hasText ? (
        <Text selectable style={styles.answer}>
          {text}
        </Text>
      ) : (
        <TypingIndicator />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  reply: {
    alignSelf: "stretch",
    paddingVertical: 16,
    gap: 14,
  },
  label: {
    color: theme.colors.lilac,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 20,
  },
  answer: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    lineHeight: 26,
  },
  dots: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 66,
    height: 42,
    gap: 7,
    borderRadius: 16,
    borderBottomLeftRadius: 5,
    backgroundColor: theme.colors.surfaceMuted,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.lilac,
  },
});
