import { Crown } from "lucide-react-native";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

export default function ProCrown({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[styles.badge, style]}
      accessibilityLabel="Pro"
      pointerEvents="none"
    >
      <Crown color="#F8E7C2" size={12} strokeWidth={2.2} fill="#C9A15B" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18, 12, 32, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(248, 231, 194, 0.55)",
  },
});
