import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Activity, ActivityCategory } from '../../types';

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1', title: 'Morning Badminton', category: 'Sports', emoji: '🎾',
    description: 'Friendly badminton session for all skill levels. Bring your own racket!',
    location: 'Community Sports Hall, Block A', date: 'Today', time: '6:30 AM',
    duration: '1.5 hrs', maxParticipants: 8, participants: ['Rahul', 'Priya', 'Amit'],
    host: 'Rahul Sharma', visibility: 'Public', status: 'upcoming',
    createdAt: '2024-06-20T05:00:00Z', weather: '☀️ 28°C', distance: '0.3 km',
    rules: 'Wear sports shoes. No outside food.',
  },
  {
    id: '2', title: 'Cricket Practice', category: 'Sports', emoji: '🏏',
    description: 'Weekly cricket practice session. All batsmen and bowlers welcome.',
    location: 'Ground Floor Open Area', date: 'Tomorrow', time: '7:00 AM',
    duration: '2 hrs', maxParticipants: 22, participants: ['Vikram', 'Suresh', 'Deepak', 'Ankit'],
    host: 'Vikram Singh', visibility: 'Society Only', status: 'upcoming',
    createdAt: '2024-06-19T10:00:00Z', weather: '⛅ 30°C', distance: '0.1 km',
    rules: 'Bring your own bat if possible.',
  },
  {
    id: '3', title: 'Evening Cycling', category: 'Cycling', emoji: '🚴',
    description: 'Group cycling around the society and nearby park. 10km route.',
    location: 'Society Gate', date: 'Sun, 22 Jun', time: '5:30 PM',
    duration: '1 hr', maxParticipants: 15, participants: ['Neha', 'Rohan'],
    host: 'Neha Gupta', visibility: 'Public', status: 'upcoming',
    createdAt: '2024-06-18T08:00:00Z', weather: '🌤️ 26°C', distance: '0.5 km',
    rules: 'Helmet mandatory. Follow traffic rules.',
  },
  {
    id: '4', title: 'Study Group – JEE', category: 'Study', emoji: '📚',
    description: 'Collaborative study session for JEE aspirants. Physics & Maths focus.',
    location: 'Club House Room 2', date: 'Sat, 21 Jun', time: '4:00 PM',
    duration: '3 hrs', maxParticipants: 10, participants: ['Aryan', 'Sneha', 'Karan', 'Divya', 'Mohit'],
    host: 'Aryan Mehta', visibility: 'Society Only', status: 'upcoming',
    createdAt: '2024-06-17T12:00:00Z', distance: '0.2 km',
    rules: 'Bring textbooks and notes. No phones during session.',
  },
  {
    id: '5', title: 'Dog Walking Group', category: 'Pets', emoji: '🐾',
    description: 'Morning dog walk around the park. All breeds welcome!',
    location: 'Park Entrance', date: 'Daily', time: '7:00 AM',
    duration: '45 min', maxParticipants: 20, participants: ['Meera', 'Sanjay', 'Pooja'],
    host: 'Meera Joshi', visibility: 'Public', status: 'upcoming',
    createdAt: '2024-06-16T06:00:00Z', weather: '🌅 25°C', distance: '0.4 km',
    rules: 'Keep dogs on leash. Carry waste bags.',
  },
  {
    id: '6', title: 'Food Potluck', category: 'Food', emoji: '🍲',
    description: 'Monthly potluck dinner. Bring a dish from your culture!',
    location: 'Terrace Garden', date: 'Fri, 27 Jun', time: '7:00 PM',
    duration: '2 hrs', maxParticipants: 30, participants: ['Kavya', 'Ravi', 'Sunita', 'Anil', 'Priti', 'Mohan'],
    host: 'Kavya Reddy', visibility: 'Public', status: 'upcoming',
    createdAt: '2024-06-15T14:00:00Z', distance: '0.1 km',
    rules: 'Label dishes with ingredients. Vegetarian section available.',
  },
  {
    id: '7', title: 'Morning Run', category: 'Fitness', emoji: '🏃',
    description: '5km morning run. Pace: 6-7 min/km. Beginners welcome.',
    location: 'Society Main Road', date: 'Today', time: '6:00 AM',
    duration: '45 min', maxParticipants: 25, participants: ['Dev', 'Isha', 'Raj'],
    host: 'Dev Patel', visibility: 'Public', status: 'upcoming',
    createdAt: '2024-06-20T04:00:00Z', weather: '🌤️ 24°C', distance: '0.0 km',
    rules: 'Wear reflective gear if running before sunrise.',
  },
  {
    id: '8', title: 'Carpool – IT Park', category: 'Other', emoji: '🚗',
    description: 'Daily carpool to IT Park Sector 62. Share fuel costs.',
    location: 'Gate 2 Pickup', date: 'Weekdays', time: '9:00 AM',
    duration: '30 min', maxParticipants: 4, participants: ['Nitin', 'Swati'],
    host: 'Nitin Agarwal', visibility: 'Society Only', status: 'upcoming',
    createdAt: '2024-06-14T07:00:00Z', distance: '0.1 km',
    rules: 'Be on time. Share fuel cost equally.',
  },
];

interface ActivitiesState {
  activities: Activity[];
  myJoined: string[];
  myCreated: string[];
  loading: boolean;
  refreshing: boolean;
  page: number;
  hasMore: boolean;
}

const initialState: ActivitiesState = {
  activities: MOCK_ACTIVITIES,
  myJoined: ['1', '7'],
  myCreated: ['3'],
  loading: false,
  refreshing: false,
  page: 1,
  hasMore: true,
};

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    joinActivity: (state, action: PayloadAction<{ activityId: string; userName: string }>) => {
      const activity = state.activities.find(a => a.id === action.payload.activityId);
      if (activity && !activity.participants.includes(action.payload.userName)) {
        activity.participants.push(action.payload.userName);
      }
      if (!state.myJoined.includes(action.payload.activityId)) {
        state.myJoined.push(action.payload.activityId);
      }
    },
    leaveActivity: (state, action: PayloadAction<{ activityId: string; userName: string }>) => {
      const activity = state.activities.find(a => a.id === action.payload.activityId);
      if (activity) {
        activity.participants = activity.participants.filter(p => p !== action.payload.userName);
      }
      state.myJoined = state.myJoined.filter(id => id !== action.payload.activityId);
    },
    addActivity: (state, action: PayloadAction<Activity>) => {
      state.activities.unshift(action.payload);
      state.myCreated.push(action.payload.id);
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    cancelActivity: (state, action: PayloadAction<string>) => {
      const activity = state.activities.find(a => a.id === action.payload);
      if (activity) activity.status = 'cancelled';
    },
    deleteActivity: (state, action: PayloadAction<string>) => {
      state.activities = state.activities.filter(a => a.id !== action.payload);
      state.myCreated = state.myCreated.filter(id => id !== action.payload);
    },
  },
});

export const {
  joinActivity, leaveActivity, addActivity, setRefreshing,
  setLoading, cancelActivity, deleteActivity,
} = activitiesSlice.actions;

// Selectors
export const selectAllActivities = (state: { activities: ActivitiesState }) =>
  state.activities.activities;

export const selectActivityById = (id: string) => (state: { activities: ActivitiesState }) =>
  state.activities.activities.find(a => a.id === id);

export const selectMyJoined = (state: { activities: ActivitiesState }) =>
  state.activities.activities.filter(a => state.activities.myJoined.includes(a.id));

export const selectMyCreated = (state: { activities: ActivitiesState }) =>
  state.activities.activities.filter(a => state.activities.myCreated.includes(a.id));

export const selectIsJoined = (activityId: string) => (state: { activities: ActivitiesState }) =>
  state.activities.myJoined.includes(activityId);

export const selectIsCreated = (activityId: string) => (state: { activities: ActivitiesState }) =>
  state.activities.myCreated.includes(activityId);

export default activitiesSlice.reducer;
