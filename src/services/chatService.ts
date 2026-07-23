import apiClient from './apiClient';
import { ChatMessage } from '../types';

type ChatMessageResponse = Partial<ChatMessage> & {
  content?: string;
  createdAt?: string;
  sender?: { id?: string; name?: string };
  edited?: boolean; // some APIs return `edited` instead of `isEdited`
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
    isEdited: message.isEdited ?? message.edited ?? false,
  };
}

/** Envelope shapes the backend may return for single-message endpoints */
type MessageEnvelope =
  | ChatMessageResponse
  | { data?: ChatMessageResponse; message?: ChatMessageResponse }
  | null;

/** Unwrap any of the envelope shapes the backend might use */
function unwrapMessage(
  raw: MessageEnvelope,
  activityId: string,
): ChatMessage | null {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  const payload: ChatMessageResponse | null =
    r.data && typeof r.data === 'object'
      ? (r.data as ChatMessageResponse)
      : r.message && typeof r.message === 'object'
        ? (r.message as ChatMessageResponse)
        : (raw as ChatMessageResponse);
  if (!payload || typeof payload !== 'object') return null;
  return toChatMessage(payload, activityId);
}

export const chatService = {
  /**
   * GET /chat/{activityId}/messages?before={cursor}&limit=30
   * Returns messages for an activity. Pass a cursor (message id) to load
   * older messages for pagination.
   */
  getActivityMessages: async (activityId: string, cursor?: string): Promise<ChatMessage[]> => {
    const params: Record<string, string> = { limit: '30' };
    if (cursor) params.before = cursor;

    const response = await apiClient.get<
      | ChatMessageResponse[]
      | { data?: ChatMessageResponse[]; messages?: ChatMessageResponse[] }
    >(`/chat/${activityId}/messages`, { params });
    const payload = Array.isArray(response.data)
      ? response.data
      : response.data.data ?? response.data.messages ?? [];
    return payload.map(m => toChatMessage(m, activityId));
  },

  /**
   * POST /chat/{activityId}/messages
   * Body: { text: string }
   * Sends a new message and returns the persisted copy.
   */
  sendActivityMessage: async (
    activityId: string,
    text: string,
  ): Promise<ChatMessage | null> => {
    const response = await apiClient.post<MessageEnvelope>(
      `/chat/${activityId}/messages`,
      { text },
    );
    return unwrapMessage(response.data, activityId);
  },

  /**
   * POST /chat/{activityId}/messages/{messageId}/react
   * Body: { emoji: string }
   * Toggles a reaction. Returns the updated message so local state can be
   * reconciled with the authoritative reaction counts from the server.
   */
  reactToMessage: async (
    activityId: string,
    messageId: string,
    emoji: string,
  ): Promise<ChatMessage | null> => {
    const response = await apiClient.post<MessageEnvelope>(
      `/chat/${activityId}/messages/${messageId}/react`,
      { emoji },
    );
    return unwrapMessage(response.data, activityId);
  },

  /**
   * PATCH /chat/{activityId}/messages/{messageId}/pin
   * Body: { text: string }
   * Edits the text of a message the current user owns.
   * Returns the updated message object.
   */
  editMessage: async (
    activityId: string,
    messageId: string,
    text: string,
  ): Promise<ChatMessage | null> => {
    const response = await apiClient.patch<MessageEnvelope>(
      `/chat/${activityId}/messages/${messageId}/pin`,
      { text },
    );
    return unwrapMessage(response.data, activityId);
  },

  /**
   * PATCH /chat/{activityId}/messages/{messageId}/delivered
   * Body: empty — called automatically after sendMessageSuccess to confirm delivery.
   * Fire-and-forget: errors are silently ignored.
   */
  markMessageDelivered: async (
    activityId: string,
    messageId: string,
  ): Promise<void> => {
    await apiClient.patch(
      `/chat/${activityId}/messages/${messageId}/delivered`,
    );
  },
};
