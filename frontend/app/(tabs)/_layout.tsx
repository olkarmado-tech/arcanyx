import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet, View, Text, Platform } from "react-native";
import { BlurView } from "expo-blur";
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

function TabBarIcon({
  Icon,
  color,
  focused,
  label,
}: IconProps & { Icon: TabIconComponent; label: string }) {
  return (
    <View style={styles.iconWrap}>
      <View style={styles.activePill}>
        {focused && <View pointerEvents="none" style={styles.activePillFill} />}
        <View style={styles.iconCircle}>
          <Icon
            color={color}
            width={focused ? 22 : 20}
            height={focused ? 22 : 20}
            size={focused ? 22 : 20}
            strokeWidth={focused ? 2 : 1.6}
          />
          <Text
            style={[
              styles.iconLabel,
              { color: focused ? theme.colors.text : theme.colors.textDim },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarDock, { bottom: Math.max(insets.bottom, 8) + 10 }]}
    >
      <View style={styles.tabBar}>
        <View pointerEvents="none" style={styles.tabBarClip}>
          <BlurView
            intensity={28}
            tint="dark"
            blurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
            blurReductionFactor={Platform.OS === "android" ? 1 : undefined}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.tabBarOverlay} />
            <View style={styles.tabBarTopEdge} />
          </BlurView>
        </View>
        <View style={styles.tabBarRow}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];
            const color = focused
              ? theme.colors.archive.accent
              : theme.colors.textDim;
            const icon = options.tabBarIcon?.({ focused, color, size: 22 });
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
                style={styles.tabBarItem}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                testID={options.tabBarButtonTestID}
                collapsable={false}
              >
                {icon}
              </PlatformPressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      // `tabBar` is a navigator prop, not a screen option — screenOptions is ignored here.
      tabBar={(props) => <FloatingTabBar {...props} />}
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarInactiveTintColor: theme.colors.textDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Сегодня",
          tabBarButtonTestID: "tab-home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              Icon={HomeTabIcon}
              color={color}
              focused={focused}
              label="Сегодня"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="gadania"
        options={{
          title: "Гадания",
          tabBarButtonTestID: "tab-gadania",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              Icon={Wand2}
              color={color}
              focused={focused}
              label="Гадания"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="meditations"
        options={{
          title: "Медитации",
          tabBarButtonTestID: "tab-meditations",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              Icon={Headphones}
              color={color}
              focused={focused}
              label="Медитации"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dreambook"
        options={{
          title: "Сонник",
          tabBarButtonTestID: "tab-dreambook",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              Icon={DreamTabIcon}
              color={color}
              focused={focused}
              label="Сонник"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: "Профиль",
          tabBarButtonTestID: "tab-profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              Icon={ProfileTabIcon}
              color={color}
              focused={focused}
              label="Профиль"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarDock: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  tabBar: {
    height: 70,
    borderRadius: 28,
    overflow: "visible",
    backgroundColor: "transparent",
    elevation: 0,
    shadowColor: "#05030D",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    boxShadow: "0px -8px 22px rgba(5, 3, 13, 0.42)",
  },
  tabBarClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(20,14,46,0.01)",
    overflow: "hidden",
    elevation: 0,
  },
  tabBarRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "visible",
  },
  tabBarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,14,46,0.55)",
  },
  tabBarTopEdge: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
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
  activePillFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.archive.rule,
    backgroundColor: "rgba(201,168,255,0.08)",
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
