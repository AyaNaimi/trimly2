// src/navigation/AppNavigator.js
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
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
import LoginScreen from '../screens/Auth/LoginScreen';

import { useApp } from '../context/AppContext';
import { Colors, Shadow, Fonts, Radius, Spacing } from '../theme';
import { getNextBilling } from '../utils/dateUtils';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

import { PremiumHaptics } from '../utils/haptics';

// Custom tab bar - Premium Floating Glass
function LunaTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { activeSubscriptions } = useApp();

  const urgentCount = activeSubscriptions.filter(s => {
    const b = getNextBilling(s);
    return !b.isTrial && b.daysUntilCharge <= 2;
  }).length;

  return (
    <View style={[styles.tabBar, { bottom: Math.max(insets.bottom, 16) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const handlePress = () => {
          PremiumHaptics.nav();
          navigation.navigate(route.name);
        };

        const labels = ['Bord', 'Flux', 'Journal', 'Plans', 'Profil'];
        const iconColor = focused ? Colors.text : Colors.white;

        return (
          <Pressable
            key={route.key}
            onPress={handlePress}
            style={[styles.tabBtn, focused && styles.tabBtnActive]}
          >
            {focused && (
              <View style={styles.activeCapsule}>
                <TabIcon name={route.name} focused={focused} color={iconColor} />
                <Text style={styles.tabLabelActive}>{labels[index]}</Text>
              </View>
            )}
            {!focused && <TabIcon name={route.name} focused={focused} color={iconColor} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIcon({ name, focused, color: customColor }) {
  const color = customColor || (focused ? Colors.text : Colors.white);
  const size = 18; // Smaller icons to match the image

  const icons = {
    Home: <HouseIcon size={size} color={color} focused={focused} />,
    Reports: <BarIcon size={size} color={color} focused={focused} />,
    Transactions: <CardIcon size={size} color={color} focused={focused} />,
    Subscriptions: <BoxIcon size={size} color={color} focused={focused} />,
    Settings: <GearIcon size={size} color={color} focused={focused} />,
  };

  return icons[name] || null;
}

function HouseIcon({ size, color, focused }) {
  const sw = focused ? 2.0 : 1.2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size - 2, height: size * 0.45, borderTopWidth: sw, borderLeftWidth: sw, borderRightWidth: sw, borderColor: color, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
      <View style={{ width: size - 2, height: size * 0.35, borderWidth: sw, borderTopWidth: 0, borderColor: color, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }} />
    </View>
  );
}
function BarIcon({ size, color, focused }) {
  const sw = focused ? 2.5 : 1.5;
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 3 }}>
      <View style={{ width: sw, height: size * 0.4, backgroundColor: color, borderRadius: sw / 2 }} />
      <View style={{ width: sw, height: size * 0.75, backgroundColor: color, borderRadius: sw / 2 }} />
      <View style={{ width: sw, height: size * 1.0, backgroundColor: color, borderRadius: sw / 2 }} />
    </View>
  );
}
function CardIcon({ size, color, focused }) {
  const sw = focused ? 2.0 : 1.2;
  return (
    <View style={{ width: size + 2, height: size * 0.7, borderRadius: 4, borderWidth: sw, borderColor: color, justifyContent: 'center' }}>
      <View style={{ width: '100%', height: sw, backgroundColor: color, position: 'absolute', top: 3 }} />
      <View style={{ width: 4, height: 3, borderRadius: 1, backgroundColor: color, marginLeft: 3, marginTop: 4 }} />
    </View>
  );
}
function BoxIcon({ size, color, focused }) {
  const sw = focused ? 2.0 : 1.2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size - 4, height: size - 4, borderWidth: sw, borderColor: color, borderRadius: 3 }} />
      <View style={{ position: 'absolute', width: size - 6, height: sw, backgroundColor: color }} />
    </View>
  );
}
function GearIcon({ size, color, focused }) {
  const sw = focused ? 2.0 : 1.2;
  const r = size * 0.4;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: r, height: r, borderRadius: r / 2, borderWidth: sw, borderColor: color }} />
      {[0, 60, 120, 180, 240, 300].map(a => (
        <View key={a} style={{ position: 'absolute', width: sw, height: size * 0.15, backgroundColor: color, borderRadius: sw / 2, top: 1, transform: [{ rotate: `${a}deg` }, { translateY: -1 }] }} />
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
      <Stack.Navigator screenOptions={{ 
        headerShown: false, 
        animationEnabled: true,
        animationTypeForReplace: 'push',
        gestureEnabled: true,
      }}>
        {!state.session ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !state.onboardingComplete ? (
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
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.select({ ios: 34, android: 24 }),
    borderRadius: 32,
    ...Shadow.premium,
    backgroundColor: Colors.white,
    borderWidth: 0,
    backgroundColor: Colors.text, // Darker Slate / Black from the image
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    flex: 2.2, // Give space for the capsule
  },
  activeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9', // Subtle light gray for contrast
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    gap: 8,
  },
  tabLabelActive: {
    ...Fonts.sans,
    fontSize: 12,
    color: Colors.text,
    ...Fonts.bold,
  },
  tabBadge: {
    position: 'absolute',
    top: 10,
    right: '25%',
    backgroundColor: Colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  tabBadgeText: {
    color: Colors.white,
    fontSize: 8,
    ...Fonts.black,
  },
});

