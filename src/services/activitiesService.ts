import apiClient from './apiClient';
import { Activity } from '../types';

export const activitiesService = {
  getActivities: async (): Promise<Activity[]> => {
    const response = await apiClient.get<Activity[]>('/activities');
    return response.data;
  },
};
