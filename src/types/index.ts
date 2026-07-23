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
  title: string;
  date: string;           // ISO 8601 e.g. "2026-07-19T18:30:00.000Z"
  location: string;
  going: number;
  // Fields that may be null from the API
  emoji?: string | null;
  category?: EventCategory;
  description?: string | null;
  hostId?: string | null;
  hostName?: string | null;
  status?: 'upcoming' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  /** true when the current user has marked themselves as going (optimistic) */
  isGoing?: boolean;
}

export type GroupCategory = 'Sports' | 'Culture' | 'Social' | 'Hobby' | 'Community' | 'Other';

export interface Group {
  id: string;
  name: string;
  category: GroupCategory;
  // emoji is null from the API — we derive a fallback in the UI
  emoji?: string | null;
  members: number;          // mapped from _count.members
  description?: string | null;
  createdAt?: string;
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
  /** Set to true by the server after the message has been edited */
  isEdited?: boolean;
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
  ActivityChat: { activityId: string; activityTitle: string };
  EditActivity: { activityId: string };
  Notifications: undefined;
};

export type ActivitiesStackParamList = {
  ActivitiesMain: undefined;
  ActivityDetail: { activityId: string };
  CreateActivity: undefined;
  EditActivity: { activityId: string };
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
  Groups: undefined;
  Chats: undefined;
  Profile: undefined;
};
