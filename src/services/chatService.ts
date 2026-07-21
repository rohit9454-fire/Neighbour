import apiClient from './apiClient';
import { ChatMessage } from '../types';

type ChatMessageResponse = Partial<ChatMessage> & {
  content?: string;
  createdAt?: string;
  sender?: { id?: string; name?: string };
};

function toChatMessage(message: ChatMessageResponse, activityId: string): ChatMessage {
  return {
    id: message.id ?? `${activityId}-${message.createdAt ?? Date.now()}`,
    activityId: message.activityId ?? activityId,
    senderId: message.senderId ?? message.sender?.id ?? 'unknown',
    senderName: message.senderName ?? message.sender?.name ?? 'Unknown',
    text: message.text ?? message.content ?? '',
    timestamp: message.timestamp ?? message.createdAt ?? new Date().toISOString(),
    type: message.type ?? 'text',
    reactions: message.reactions,
    readBy: message.readBy,
    delivered: message.delivered ?? true,
    pinned: message.pinned,
  };
}

export const chatService = {
  getActivityMessages: async (activityId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get<
      ChatMessageResponse[] | {
        data?: ChatMessageResponse[];
        messages?: ChatMessageResponse[];
      }
    >(`/chat/${activityId}/messages`);
    const payload = Array.isArray(response.data)
      ? response.data
      : response.data.data ?? response.data.messages ?? [];
    return payload.map(message => toChatMessage(message, activityId));
  },

  sendActivityMessage: async (
    activityId: string,
    text: string,
  ): Promise<ChatMessage | null> => {
    const response = await apiClient.post<
      ChatMessageResponse | {
        data?: ChatMessageResponse;
        message?: ChatMessageResponse;
      } | null
    >(`/chat/${activityId}/messages`, { text });
    if (!response.data) return null;
    const payload = 'data' in response.data
      ? response.data.data
      : 'message' in response.data && typeof response.data.message === 'object'
        ? response.data.message
        : response.data;
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('id' in payload || 'text' in payload || 'content' in payload)
    ) {
      return null;
    }
    return toChatMessage(payload as ChatMessageResponse, activityId);
  },
};
