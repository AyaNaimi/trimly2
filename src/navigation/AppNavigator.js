// src/navigation/AppNavigator.js
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/Home/HomeScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import TransactionsScreen from '../screens/Transactions/TransactionsScreen';
import SubscriptionsScreen from '../screens/Subscriptions/SubscriptionsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';

import { useApp } from '../context/AppContext';
import { Colors, Shadow } from '../theme';
import { getNextBilling } from '../utils/dateUtils';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

import * as Haptics from 'expo-haptics';
import { PremiumHaptics } from '../utils/haptics';

// Custom tab bar matching Luna exactly
function LunaTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { activeSubscriptions } = useApp();

  // Count urgent subs (≤2 days)
  const urgentCount = activeSubscriptions.filter(s => {
    const b = getNextBilling(s);
    return !b.isTrial && b.daysUntilCharge <= 2;
  }).length;

  const tabs = [
    { key: 'Home', icon: '⌂', label: 'Accueil' },
    { key: 'Reports', icon: '📊', label: 'Rapports' },
    { key: 'Transactions', icon: '💳', label: 'Transactions' },
    { key: 'Subscriptions', icon: '🔄', label: 'Abonnements', badge: urgentCount },
    { key: 'Settings', icon: '⚙', label: 'Réglages' },
  ];

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = tabs.find(t => t.key === route.name) || tabs[index];

        const handlePress = () => {
          PremiumHaptics.nav(); // New Lock-in fancy feel
          navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            onPress={handlePress}
            style={styles.tabBtn}
          >
            {tab.badge > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.badge}</Text>
              </View>
            )}
            <TabIcon name={route.name} focused={focused} />
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {focused && <View style={styles.tabIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIcon({ name, focused }) {
  const color = focused ? Colors.purple : Colors.textSecondary;
  const size = 22;

  const icons = {
    Home: (
      <HouseIcon size={size} color={color} focused={focused} />
    ),
    Reports: (
      <BarIcon size={size} color={color} />
    ),
    Transactions: (
      <CardIcon size={size} color={color} />
    ),
    Subscriptions: (
      <BoxIcon size={size} color={color} />
    ),
    Settings: (
      <GearIcon size={size} color={color} />
    ),
  };

  return icons[name] || null;
}

// SVG-like icons using View/Text combinations
function HouseIcon({ size, color, focused }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size - 2, color }}>⌂</Text>
    </View>
  );
}
function BarIcon({ size, color }) {
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
      {[0.4, 0.7, 1.0].map((h, i) => (
        <View key={i} style={{ width: 4, height: size * h, backgroundColor: color, borderRadius: 2 }} />
      ))}
    </View>
  );
}
function CardIcon({ size, color }) {
  return (
    <View style={{ width: size, height: size * 0.75, borderRadius: 3, borderWidth: 1.8, borderColor: color, overflow: 'hidden', justifyContent: 'center' }}>
      <View style={{ height: 4, backgroundColor: color, marginTop: 2 }} />
    </View>
  );
}
function BoxIcon({ size, color }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size - 2, height: size - 2, borderWidth: 1.8, borderColor: color, borderRadius: 4, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}
function GearIcon({ size, color }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.55, height: size * 0.55, borderRadius: size * 0.275, borderWidth: 1.8, borderColor: color }} />
      {[0, 45, 90, 135].map(a => (
        <View key={a} style={{ position: 'absolute', width: 3, height: size * 0.25, backgroundColor: color, borderRadius: 2, top: 0, left: '50%', transform: [{ rotate: `${a}deg` }, { translateY: -2 }] }} />
      ))}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <LunaTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Subscriptions" component={SubscriptionsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { state } = useApp();

  if (!state.loaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
        {!state.onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffffEE', // Chic subtle transparency
    borderRadius: 32,
    marginHorizontal: 16,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24, // Floating from the bottom
    ...Shadow.medium,
    borderWidth: 1.5,
    borderColor: Colors.border, // Visible border
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 24,
    position: 'relative',
  },
  tabBtnActive: {
    backgroundColor: 'transparent', // No background for active button to keep it minimal
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: Colors.purple,
    fontWeight: '500',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.purple,
  },
  tabBadge: {
    position: 'absolute',
    top: 4,
    right: 12,
    backgroundColor: Colors.red,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
