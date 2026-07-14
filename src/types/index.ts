// ─── Domain Models ────────────────────────────────────────────────────────────

export interface User {
  name: string;
  email: string;
}

export type EventCategory = 'Sports' | 'Culture' | 'Social' | 'Hobby' | 'Other';

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
};

export type GroupsStackParamList = {
  GroupsMain: undefined;
  GroupDetail: { group: Group };
  CreateGroup: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Groups: undefined;
  Profile: undefined;
};
