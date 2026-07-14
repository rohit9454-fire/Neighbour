import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppNotification } from '../../types';

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: '1', type: 'activity_joined', title: 'Rahul joined Morning Badminton',
    body: 'Rahul Sharma joined your activity. 5 spots remaining.',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), read: false, activityId: '1',
  },
  {
    id: '2', type: 'reminder', title: '⏰ Morning Run starts in 1 hour',
    body: 'Your activity "Morning Run" starts at 6:00 AM. Get ready!',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: false, activityId: '7',
  },
  {
    id: '3', type: 'chat', title: 'New message in Cricket Practice',
    body: 'Vikram: "Ground is booked, see you all tomorrow!"',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), read: true, activityId: '2',
  },
  {
    id: '4', type: 'community_bulletin', title: '📢 Society Maintenance Notice',
    body: 'Water supply will be interrupted on Sunday 8AM–12PM for maintenance.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), read: true,
  },
  {
    id: '5', type: 'activity_updated', title: 'Food Potluck time changed',
    body: 'Kavya updated the potluck time from 6:00 PM to 7:00 PM.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), read: true, activityId: '6',
  },
  {
    id: '6', type: 'activity_joined', title: 'Priya joined Morning Badminton',
    body: 'Priya Patel joined your activity.',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), read: true, activityId: '1',
  },
  {
    id: '7', type: 'reminder', title: '⏰ Study Group tomorrow',
    body: 'Study Group – JEE is scheduled for tomorrow at 4:00 PM.',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), read: true, activityId: '4',
  },
];

interface NotificationsState {
  notifications: AppNotification[];
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { notifications: MOCK_NOTIFICATIONS } as NotificationsState,
  reducers: {
    markAsRead: (state, action: PayloadAction<string>) => {
      const n = state.notifications.find(n => n.id === action.payload);
      if (n) n.read = true;
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => { n.read = true; });
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      state.notifications.unshift(action.payload);
    },
  },
});

export const { markAsRead, markAllAsRead, deleteNotification, addNotification } =
  notificationsSlice.actions;

export const selectUnreadCount = (state: { notifications: NotificationsState }) =>
  state.notifications.notifications.filter(n => !n.read).length;

export default notificationsSlice.reducer;
