import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "../../theme";

type Props = {
  style?: StyleProp<ViewStyle>;
};

export default function ProBrandMark({ style }: Props) {
  return (
    <View style={[styles.row, style]} accessibilityRole="header">
      <Text style={styles.word}>Arcanyx </Text>
      <Text style={styles.pro}>Pro</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  word: {
    color: "#FFFFFF",
    fontFamily: theme.fonts.heading,
    fontSize: 26,
    lineHeight: 30,
  },
  pro: {
    color: "#B5A2E8",
    fontFamily: theme.fonts.headingItalic,
    fontSize: 26,
    lineHeight: 30,
  },
});
