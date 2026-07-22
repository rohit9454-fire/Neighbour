import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  BottomTabParamList,
  HomeStackParamList,
  ActivitiesStackParamList,
  GroupsStackParamList,
  ProfileStackParamList,
} from '../types';

// Screens – Home stack
import HomeScreen from '../screens/main/HomeScreen';
import EventDetailScreen from '../screens/main/EventDetailScreen';
import CreateEventScreen from '../screens/main/CreateEventScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

// Screens – Activities stack
import ActivitiesScreen from '../screens/main/ActivitiesScreen';
import ActivityDetailScreen from '../screens/main/ActivityDetailScreen';
import CreateActivityScreen from '../screens/main/CreateActivityScreen';
import EditActivityScreen from '../screens/main/EditActivityScreen';
import MyActivitiesScreen from '../screens/main/MyActivitiesScreen';
import ActivityChatScreen from '../screens/main/ActivityChatScreen';

// Screens – Groups stack
import GroupsScreen from '../screens/main/GroupsScreen';
import GroupDetailScreen from '../screens/main/GroupDetailScreen';

// Screens – Profile
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Each tab gets its own stack instance to prevent back-stack sharing
const HomeStack        = createNativeStackNavigator<HomeStackParamList>();
const ActivitiesStack  = createNativeStackNavigator<ActivitiesStackParamList>();
const CreateStack      = createNativeStackNavigator<ActivitiesStackParamList>();
const ChatsStack       = createNativeStackNavigator<ActivitiesStackParamList>();
const GroupsStack      = createNativeStackNavigator<GroupsStackParamList>();
const ProfileStack     = createNativeStackNavigator<ProfileStackParamList>();

const STACK_OPTS = { headerShown: false };

function HomeStackNavigator(): React.JSX.Element {
  return (
    <HomeStack.Navigator screenOptions={STACK_OPTS}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="EventDetail" component={EventDetailScreen} />
      <HomeStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <HomeStack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <HomeStack.Screen name="ActivityChat" component={ActivityChatScreen} />
      <HomeStack.Screen name="EditActivity" component={EditActivityScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

function ActivitiesStackNavigator(): React.JSX.Element {
  return (
    <ActivitiesStack.Navigator screenOptions={STACK_OPTS}>
      <ActivitiesStack.Screen name="ActivitiesMain" component={ActivitiesScreen} />
      <ActivitiesStack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <ActivitiesStack.Screen name="CreateActivity" component={CreateActivityScreen} />
      <ActivitiesStack.Screen name="EditActivity" component={EditActivityScreen} />
      <ActivitiesStack.Screen name="MyActivities" component={MyActivitiesScreen} />
      <ActivitiesStack.Screen name="ActivityChat" component={ActivityChatScreen} />
    </ActivitiesStack.Navigator>
  );
}

// Create tab — opens CreateActivity as the root, with the rest accessible for
// navigation (e.g. after creating an activity the user can view its detail).
function CreateTabNavigator(): React.JSX.Element {
  return (
    <CreateStack.Navigator screenOptions={STACK_OPTS}>
      <CreateStack.Screen name="CreateActivity" component={CreateActivityScreen} />
      <CreateStack.Screen name="EditActivity" component={EditActivityScreen} />
      <CreateStack.Screen name="ActivitiesMain" component={ActivitiesScreen} />
      <CreateStack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <CreateStack.Screen name="MyActivities" component={MyActivitiesScreen} />
      <CreateStack.Screen name="ActivityChat" component={ActivityChatScreen} />
    </CreateStack.Navigator>
  );
}

// Chats tab — root is MyActivities so users can pick an activity to chat in.
function ChatsTabNavigator(): React.JSX.Element {
  return (
    <ChatsStack.Navigator screenOptions={STACK_OPTS}>
      <ChatsStack.Screen name="MyActivities" component={MyActivitiesScreen} />
      <ChatsStack.Screen name="ActivityChat" component={ActivityChatScreen} />
      <ChatsStack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <ChatsStack.Screen name="ActivitiesMain" component={ActivitiesScreen} />
      <ChatsStack.Screen name="CreateActivity" component={CreateActivityScreen} />
      <ChatsStack.Screen name="EditActivity" component={EditActivityScreen} />
    </ChatsStack.Navigator>
  );
}

function GroupsStackNavigator(): React.JSX.Element {
  return (
    <GroupsStack.Navigator screenOptions={STACK_OPTS}>
      <GroupsStack.Screen name="GroupsMain" component={GroupsScreen} />
      <GroupsStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      {/* CreateGroup screen can be added here when implemented */}
    </GroupsStack.Navigator>
  );
}

function ProfileStackNavigator(): React.JSX.Element {
  return (
    <ProfileStack.Navigator screenOptions={STACK_OPTS}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

interface TabIconProps { name: string; focused: boolean; badge?: number }

function TabIcon({ name, focused, badge }: TabIconProps): React.JSX.Element {
  return (
    <View style={tabStyles.wrap}>
      <Icon name={name} size={24} color={focused ? '#004AC6' : '#8B92B8'} />
      {badge != null && badge > 0 && (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: '#EF4444', borderRadius: 8,
    minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
});

export default function AppNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#004AC6',
        tabBarInactiveTintColor: '#8B92B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8EAFF',
          height: 64,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesStackNavigator}
        options={{
          tabBarLabel: 'Activities',
          tabBarIcon: ({ focused }) => <TabIcon name="lightning-bolt" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateTabNavigator}
        options={{
          tabBarLabel: 'Create',
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 46, height: 46, borderRadius: 23,
              backgroundColor: focused ? '#004AC6' : '#e5f0f5ff',
              justifyContent: 'center', alignItems: 'center',
              marginBottom: 35,
              shadowColor: '#2563EB', shadowOpacity: 0.4, shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 6,
            }}>
              <Icon name="plus" size={26} color={focused ? '#FFFFFF' : '#004AC6'} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsStackNavigator}
        options={{
          tabBarLabel: 'Groups',
          tabBarIcon: ({ focused }) => <TabIcon name="account-group" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsTabNavigator}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="account" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
