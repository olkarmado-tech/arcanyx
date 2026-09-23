import React, { useLayoutEffect, useRef, useState } from "react";
import { Tabs } from "expo-router";
import { StyleSheet, View, Text, Platform } from "react-native";
import { BlurTargetView, BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { CommonActions, PlatformPressable } from "expo-router/react-navigation";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Headphones, Wand2 } from "lucide-react-native";
import {
  DreamTabIcon,
  HomeTabIcon,
  ProfileTabIcon,
} from "../../src/components/icons/TabIcons";
import { theme } from "../../src/theme";

type IconProps = { color: string; focused: boolean };
type TabIconComponent = React.ComponentType<Record<string, unknown>>;
type TabBarLink = Pick<BottomTabBarProps, "state" | "navigation">;

const TAB_CONFIG: Record<
  string,
  { label: string; testID: string; Icon: TabIconComponent }
> = {
  index: { label: "Сегодня", testID: "tab-home", Icon: HomeTabIcon },
  gadania: { label: "Гадания", testID: "tab-gadania", Icon: Wand2 },
  meditations: {
    label: "Медитации",
    testID: "tab-meditations",
    Icon: Headphones,
  },
  dreambook: { label: "Сонник", testID: "tab-dreambook", Icon: DreamTabIcon },
  diary: { label: "Профиль", testID: "tab-profile", Icon: ProfileTabIcon },
};

function TabBarIcon({
  Icon,
  color,
  focused,
  label,
}: IconProps & { Icon: TabIconComponent; label: string }) {
  const content = (
    <View style={styles.iconCircle}>
      <Icon
        color={color}
        width={focused ? 22 : 20}
        height={focused ? 22 : 20}
        size={focused ? 22 : 20}
        strokeWidth={focused ? 2 : 1.6}
      />
      <Text style={[styles.iconLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={styles.iconWrap}>
      {focused ? (
        <LinearGradient
          colors={theme.gradients.softLilac}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.activePill, styles.activePillFocused]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={styles.activePill}>{content}</View>
      )}
    </View>
  );
}

/**
 * Rendered by the navigator in place of a tab bar. It only forwards the
 * navigation state up so the real bar can live outside the blur target —
 * Android can't blur a view hierarchy that contains the BlurView itself.
 */
function TabBarBridge({
  state,
  navigation,
  onChange,
}: TabBarLink & { onChange: (link: TabBarLink) => void }) {
  useLayoutEffect(() => {
    onChange({ state, navigation });
  }, [state, navigation, onChange]);
  return null;
}

function FloatingTabBar({
  state,
  navigation,
  blurTarget,
}: TabBarLink & { blurTarget: React.RefObject<View | null> }) {
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarDock, { bottom: Math.max(insets.bottom, 8) + 10 }]}
    >
      <View style={styles.tabBar}>
        <BlurView
          intensity={isAndroid ? 60 : 40}
          tint="dark"
          blurMethod={isAndroid ? "dimezisBlurView" : undefined}
          blurTarget={isAndroid ? blurTarget : undefined}
          style={styles.tabBarGlass}
        >
          <View style={styles.tabBarRow}>
            {state.routes.map((route, index) => {
              const config = TAB_CONFIG[route.name];
              if (!config) return null;
              const focused = state.index === index;
              const color = focused
                ? theme.colors.softLilacText
                : "rgba(201,196,220,0.78)";
              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.dispatch({
                    ...CommonActions.navigate(route.name, route.params),
                    target: state.key,
                  });
                }
              };
              return (
                <PlatformPressable
                  key={route.key}
                  onPress={onPress}
                  // Default Android ripple paints a dark rectangle over the whole slot.
                  pressColor="transparent"
                  style={styles.tabBarItem}
                  accessibilityRole="button"
                  accessibilityState={focused ? { selected: true } : {}}
                  testID={config.testID}
                  collapsable={false}
                >
                  <TabBarIcon
                    Icon={config.Icon}
                    color={color}
                    focused={focused}
                    label={config.label}
                  />
                </PlatformPressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const blurTargetRef = useRef<View | null>(null);
  const [link, setLink] = useState<TabBarLink | null>(null);

  return (
    <View style={styles.root}>
      <BlurTargetView ref={blurTargetRef} style={styles.root}>
        <Tabs
          // `tabBar` is a navigator prop, not a screen option — screenOptions is ignored here.
          tabBar={(props) => <TabBarBridge {...props} onChange={setLink} />}
          safeAreaInsets={{ bottom: 0 }}
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarInactiveTintColor: theme.colors.textDim,
          }}
        >
          <Tabs.Screen name="index" options={{ title: "Сегодня" }} />
          <Tabs.Screen name="gadania" options={{ title: "Гадания" }} />
          <Tabs.Screen name="meditations" options={{ title: "Медитации" }} />
          <Tabs.Screen name="dreambook" options={{ title: "Сонник" }} />
          <Tabs.Screen name="diary" options={{ title: "Профиль" }} />
        </Tabs>
      </BlurTargetView>
      {link ? (
        <FloatingTabBar
          state={link.state}
          navigation={link.navigation}
          blurTarget={blurTargetRef}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabBarDock: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  tabBar: {
    height: 70,
    borderRadius: 30,
    overflow: "visible",
    backgroundColor: "transparent",
    elevation: 0,
    shadowColor: "#05030D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  tabBarGlass: {
    flex: 1,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(214,196,245,0.22)",
    overflow: "hidden",
  },
  tabBarRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      Platform.OS === "android" ? "rgba(22,18,38,0.42)" : "rgba(16,13,30,0.48)",
  },
  tabBarItem: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
    backgroundColor: "transparent",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    minWidth: 0,
    overflow: "visible",
  },
  activePill: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 5,
    overflow: "visible",
  },
  activePillFocused: {
    marginHorizontal: 6,
    borderRadius: 22,
    overflow: "hidden",
  },
  iconCircle: {
    alignSelf: "stretch",
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    overflow: "visible",
  },
  iconLabel: {
    width: "100%",
    textAlign: "center",
    fontSize: 8,
    fontFamily: theme.fonts.bodyMedium,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
