// src/navigation/AppNavigator.js
import React, { useState, useEffect } from 'react';
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
import AnimatedSplashScreen from '../screens/Splash/AnimatedSplashScreen';
import EmailScannerModal from '../screens/Subscriptions/EmailScannerModal';

import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Shadow, Fonts, Radius } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
import { PremiumHaptics } from '../utils/haptics';

// Custom tab bar - Premium Floating Glass
function LunaTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { Colors, isDark } = useTheme();
  const { t } = useLanguage();

  const tabBarBg = isDark ? Colors.surface : '#1E293B';
  const activeCapBg = isDark ? Colors.surfaceAlt : Colors.white;
  const activeTextColor = isDark ? Colors.text : '#0F172A';
  const inactiveIconColor = isDark ? Colors.textSecondary : Colors.white;

  return (
    <View style={[
      styles.tabBar,
      { bottom: Math.max(insets.bottom, 16), backgroundColor: tabBarBg },
    ]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const handlePress = () => {
          PremiumHaptics.nav();
          navigation.navigate(route.name);
        };

        const labels = [
          t('navigation.home'),
          t('navigation.reports'),
          t('navigation.transactions'),
          t('navigation.subscriptions'),
          t('navigation.settings')
        ];
        const iconColor = focused ? activeTextColor : inactiveIconColor;

        return (
          <Pressable
            key={route.key}
            onPress={handlePress}
            style={[styles.tabBtn, focused && styles.tabBtnActive]}
          >
            {focused && (
              <View style={[styles.activeCapsule, { backgroundColor: activeCapBg }]}>
                <TabIcon name={route.name} focused={focused} color={iconColor} />
                <Text style={[styles.tabLabelActive, { color: activeTextColor }]}>{labels[index]}</Text>
              </View>
            )}
            {!focused && <TabIcon name={route.name} focused={focused} color={iconColor} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIcon({ name, focused, color }) {
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
  const { state, addSubscription, dismissAuthEmailScanPrompt } = useApp();
  const existingSubscriptionNames = (state.subscriptions || []).map((item) => item?.name).filter(Boolean);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Le splash screen se cache automatiquement après l'animation
    // Pas besoin de timer ici car AnimatedSplashScreen gère ça
  }, []);

  if (!state.loaded) return null;

  // Afficher le splash screen au premier chargement
  if (showSplash) {
    return <AnimatedSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{
        headerShown: false,
        animationEnabled: true,
        animationTypeForReplace: 'push',
        gestureEnabled: true,
      }}>
        {(!state.session && !state.guestMode) ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !state.onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
      <EmailScannerModal
        visible={!!state.emailScanPrompt}
        onClose={dismissAuthEmailScanPrompt}
        onImport={async (sub) => addSubscription(sub)}
        initialEmail={state.emailScanPrompt?.email || state.session?.user?.email || ''}
        autoPrompt
        existingSubscriptionNames={existingSubscriptionNames}
      />
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
    // backgroundColor set dynamically in LunaTabBar
    height: 68,
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
    flex: 2.2,
  },
  activeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor set dynamically in LunaTabBar
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    gap: 8,
  },
  tabLabelActive: {
    ...Fonts.sans,
    ...Fonts.semiBold,
    fontSize: 12,
    // color set dynamically in LunaTabBar
  },
});
