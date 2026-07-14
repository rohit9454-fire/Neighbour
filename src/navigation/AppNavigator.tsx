import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabParamList, HomeStackParamList, GroupsStackParamList } from '../types';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import GroupsScreen from '../screens/main/GroupsScreen';
import EventDetailScreen from '../screens/main/EventDetailScreen';
import CreateEventScreen from '../screens/main/CreateEventScreen';
import GroupDetailScreen from '../screens/main/GroupDetailScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const GroupsStack = createNativeStackNavigator<GroupsStackParamList>();

const STACK_HEADER_OPTIONS = {
  headerStyle: { backgroundColor: '#4F46E5' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' as const },
};

interface TabIconProps {
  emoji: string;
  focused: boolean;
}

function TabIcon({ emoji, focused }: TabIconProps): React.JSX.Element {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
    </View>
  );
}

function HomeStackNavigator(): React.JSX.Element {
  return (
    <HomeStack.Navigator screenOptions={STACK_HEADER_OPTIONS}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Details' }} />
      <HomeStack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create Event' }} />
    </HomeStack.Navigator>
  );
}

function GroupsStackNavigator(): React.JSX.Element {
  return (
    <GroupsStack.Navigator screenOptions={STACK_HEADER_OPTIONS}>
      <GroupsStack.Screen name="GroupsMain" component={GroupsScreen} options={{ headerShown: false }} />
      <GroupsStack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: 'Group Details' }} />
      <GroupsStack.Screen name="CreateGroup" component={CreateEventScreen} options={{ title: 'Create Group' }} />
    </GroupsStack.Navigator>
  );
}

export default function AppNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 4 },
      }}
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
