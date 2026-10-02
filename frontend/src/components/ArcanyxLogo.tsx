import React from "react";
import { Image, type ImageStyle, type StyleProp } from "expo-image";

export const ARCANYX_LOGO = require("../../assets/home/logo.png");

/** Width / height of `assets/home/logo.png` after trim. */
export const ARCANYX_LOGO_ASPECT = 965 / 330;

type Props = {
  height: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export default function ArcanyxLogo({
  height,
  style,
  accessibilityLabel = "Arcanyx",
}: Props) {
  return (
    <Image
      source={ARCANYX_LOGO}
      style={[{ height, width: height * ARCANYX_LOGO_ASPECT }, style]}
      contentFit="contain"
      accessibilityLabel={accessibilityLabel}
    />
  );
}
