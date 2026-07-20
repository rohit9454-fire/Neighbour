// ─── Domain Models ────────────────────────────────────────────────────────────

export interface User {
  // Core (always present)
  name: string;
  email: string;
  // From API
  id?: string;
  society?: string | null;
  sector?: string | null;
  interests?: string[];
  avatarUrl?: string | null;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EventCategory = 'Sports' | 'Culture' | 'Social' | 'Hobby' | 'Other';

export type ActivityCategory =
  | 'Sports'
  | 'Fitness'
  | 'Cycling'
  | 'Study'
  | 'Meetups'
  | 'Pets'
  | 'Food'
  | 'Other';

export type ActivityVisibility = 'Public' | 'Private' | 'Society Only';

export type ActivityStatus = 'upcoming' | 'completed' | 'cancelled';

export interface ActivityParticipant {
  activityId: string;
  userId: string;
  joinedAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

export interface ActivityHost {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Activity {
  id: string;
  title: string;
  category: ActivityCategory;
  description: string;
  location: string;
  date: string;         // ISO string from API e.g. "2026-07-20T00:00:00.000Z"
  time: string;
  duration: string;
  maxParticipants: number;
  participants: ActivityParticipant[];
  hostId: string;
  host: ActivityHost;
  image?: string;
  emoji: string;
  visibility: ActivityVisibility;
  status: ActivityStatus;
  createdAt: string;
  updatedAt?: string;
  weather?: string | null;
  rules?: string;
  distance?: number;
  society?: string | null;
}

export interface Event {
  id: string;
  emoji: string;
  title: string;
  date: string;
  location: string;
  going: number;
  category?: EventCategory;
}

export interface Group {
  id: string;
  emoji: string;
  name: string;
  members: number;
  category: EventCategory;
}

export interface ProfileStat {
  label: string;
  value: string;
}

export interface ChatMessage {
  id: string;
  activityId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: 'text' | 'system' | 'image' | 'location';
  reactions?: Record<string, string[]>;
  readBy?: string[];
  delivered?: boolean;
  pinned?: boolean;
}

export type NotificationType =
  | 'activity_joined'
  | 'reminder'
  | 'activity_updated'
  | 'chat'
  | 'community_bulletin';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  activityId?: string;
  deepLink?: string;
}

// ─── Auth Context ─────────────────────────────────────────────────────────────

export interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

// ─── Navigation Param Lists ───────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  EventDetail: { event: Event };
  CreateEvent: undefined;
  ActivityDetail: { activityId: string };
  Notifications: undefined;
};

export type ActivitiesStackParamList = {
  ActivitiesMain: undefined;
  ActivityDetail: { activityId: string };
  CreateActivity: undefined;
  MyActivities: undefined;
  ActivityChat: { activityId: string; activityTitle: string };
};

export type GroupsStackParamList = {
  GroupsMain: undefined;
  GroupDetail: { group: Group };
  CreateGroup: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Activities: undefined;
  Create: undefined;
  Chats: undefined;
  Profile: undefined;
};
