import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { MenuBurgerIcon, SearchIcon, StarIcon, MapPinIcon } from '@/components/ui/app-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.tabIconSelected,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontFamily: Fonts.rounded,
          fontSize: 11,
          marginBottom: 8,
        },
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: 86,
          paddingTop: 8,
          paddingBottom: 6,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        sceneStyle: {
          backgroundColor: palette.background,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <SearchIcon
              size={22}
              fill={focused ? palette.tabIconSelected : palette.tabIconDefault}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused }) => (
            <StarIcon size={22} fill={focused ? palette.tabIconSelected : palette.tabIconDefault} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <MenuBurgerIcon
              size={21}
              fill={focused ? palette.tabIconSelected : palette.tabIconDefault}
            />
          ),
        }}
      />
        <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ focused }) => (
            <MapPinIcon
              size={21}
              fill={focused ? palette.tabIconSelected : palette.tabIconDefault}
            />
          ),
        }}
      />
    </Tabs>
  );
}
