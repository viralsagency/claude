import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '\u2302',
    Scansione: '\u26A1',
    Cronologia: '\u2630',
    Profilo: '\u263A',
  };
  return (
    <Text
      style={{
        fontSize: 20,
        color: focused ? colors.primary : colors.textLight,
      }}
    >
      {icons[label] ?? '?'}
    </Text>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <TabIcon label={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: 4,
            height: 56,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600' as const,
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Scansione" component={ScanScreen} />
        <Tab.Screen name="Cronologia" component={HistoryScreen} />
        <Tab.Screen name="Profilo" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
