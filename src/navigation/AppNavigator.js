import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import GroupsScreen from '../screens/main/GroupsScreen';
import EventDetailScreen from '../screens/main/EventDetailScreen';
import CreateEventScreen from '../screens/main/CreateEventScreen';
import GroupDetailScreen from '../screens/main/GroupDetailScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const GroupsStack = createStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4F46E5' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Details' }} />
      <HomeStack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create Event' }} />
    </HomeStack.Navigator>
  );
}

function GroupsStackNavigator() {
  return (
    <GroupsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4F46E5' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <GroupsStack.Screen name="GroupsMain" component={GroupsScreen} options={{ headerShown: false }} />
      <GroupsStack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: 'Group Details' }} />
      <GroupsStack.Screen name="CreateGroup" component={CreateEventScreen} options={{ title: 'Create Group' }} />
    </GroupsStack.Navigator>
  );
}

const TAB_ICONS = { Home: '🏠', Groups: '👥', Profile: '👤' };

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: () => <React.Fragment><React.Fragment /></React.Fragment>,
        tabBarLabel: ({ focused }) => {
          const icons = { Home: focused ? '🏠' : '🏡', Groups: focused ? '👥' : '👤', Profile: focused ? '👤' : '🙂' };
          return null;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 4 },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />, tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsStackNavigator}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />, tabBarLabel: 'Groups' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />, tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ emoji, focused }) {
  const { Text, View, StyleSheet } = require('react-native');
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
    </View>
  );
}
