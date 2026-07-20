import apiClient from './apiClient';
import { Activity } from '../types';

export interface CreateActivityPayload {
  title: string;
  category: Activity['category'];
  description: string;
  location: string;
  date: string;
  time: string;
  duration: string;
  maxParticipants: number;
  image?: string;
  emoji: string;
  visibility: Activity['visibility'];
  rules?: string;
  distance?: number;
}

export type UpdateActivityPayload = Partial<CreateActivityPayload>;

type ActivityResponse = Activity | { data: Activity };
type JoinActivityResponse = ActivityResponse | { activity: Activity };

export const activitiesService = {
  getActivities: async (): Promise<Activity[]> => {
    const response = await apiClient.get<{ data: Activity[] }>('/activities');
    return response.data.data;
  },

  createActivity: async (payload: CreateActivityPayload): Promise<Activity> => {
    const response = await apiClient.post<ActivityResponse>('/activities', payload);
    return 'data' in response.data ? response.data.data : response.data;
  },

  updateActivity: async (
    activityId: string,
    payload: UpdateActivityPayload,
  ): Promise<Activity> => {
    const response = await apiClient.patch<ActivityResponse>(
      `/activities/${activityId}`,
      payload,
    );
    return 'data' in response.data ? response.data.data : response.data;
  },

  joinActivity: async (activityId: string): Promise<Activity> => {
    const response = await apiClient.post<JoinActivityResponse>(
      `/activities/${activityId}/join`,
    );
    if ('activity' in response.data) return response.data.activity;
    return 'data' in response.data ? response.data.data : response.data;
  },

  deleteActivity: async (activityId: string): Promise<void> => {
    await apiClient.delete(`/activities/${activityId}`);
  },
};
