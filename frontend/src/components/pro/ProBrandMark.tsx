import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import ArcanyxLogo from "../ArcanyxLogo";
import { theme } from "../../theme";

type Props = {
  style?: StyleProp<ViewStyle>;
};

export default function ProBrandMark({ style }: Props) {
  return (
    <View style={[styles.row, style]} accessibilityRole="header">
      <ArcanyxLogo height={28} />
      <Text style={styles.pro}> Pro</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pro: {
    color: "#B5A2E8",
    fontFamily: theme.fonts.headingItalic,
    fontSize: 26,
    lineHeight: 30,
  },
});
