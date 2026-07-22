import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../../types';

interface ChatState {
  messages: ChatMessage[];
  typingUsers: Record<string, string[]>;
  loadingActivityIds: string[];
  errorsByActivity: Record<string, string | undefined>;
  sendingMessageIds: string[];
  sendErrorsByActivity: Record<string, string | undefined>;
  // Tracks which messageIds have a reaction API call in-flight
  reactingMessageIds: string[];
  // Per-message reaction errors: messageId → error string
  reactErrorsByMessage: Record<string, string | undefined>;
  // Tracks which messageIds have an edit API call in-flight
  editingMessageIds: string[];
  // Per-message edit errors: messageId → error string
  editErrorsByMessage: Record<string, string | undefined>;
  // Tracks messageIds where delivered PATCH is in-flight (fire-and-forget, no UI block)
  deliveringMessageIds: string[];
}

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    typingUsers: {},
    loadingActivityIds: [],
    errorsByActivity: {},
    sendingMessageIds: [],
    sendErrorsByActivity: {},
    reactingMessageIds: [],
    reactErrorsByMessage: {},
    editingMessageIds: [],
    editErrorsByMessage: {},
    deliveringMessageIds: [],
  } as ChatState,
  reducers: {
    fetchMessagesRequest: (state, action: PayloadAction<string>) => {
      if (!state.loadingActivityIds.includes(action.payload)) {
        state.loadingActivityIds.push(action.payload);
      }
      delete state.errorsByActivity[action.payload];
    },
    fetchMessagesSuccess: (
      state,
      action: PayloadAction<{ activityId: string; messages: ChatMessage[] }>,
    ) => {
      const { activityId, messages } = action.payload;

      // Sort the incoming server batch oldest → newest
      const sorted = [...messages].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      // Preserve any locally-edited messages so a background re-fetch doesn't
      // overwrite text the user just saved before the server confirms the edit.
      // A message is "locally edited" if it's still in editingMessageIds OR
      // if the local copy has isEdited=true but the server copy doesn't yet —
      // which happens when the PATCH response arrives after the GET response.
      const editedLocally = new Set<string>([
        ...state.editingMessageIds,
        ...state.messages
          .filter(m => m.activityId === activityId && m.isEdited)
          .map(m => m.id),
      ]);

      const merged = sorted.map(serverMsg => {
        if (editedLocally.has(serverMsg.id)) {
          // Keep the local (edited) copy instead of overwriting with stale server text
          const localMsg = state.messages.find(m => m.id === serverMsg.id);
          return localMsg ?? serverMsg;
        }
        return serverMsg;
      });

      state.messages = [
        ...state.messages.filter(m => m.activityId !== activityId),
        ...merged,
      ];
      state.loadingActivityIds = state.loadingActivityIds.filter(id => id !== activityId);
    },
    fetchMessagesFailure: (
      state,
      action: PayloadAction<{ activityId: string; message: string }>,
    ) => {
      state.loadingActivityIds = state.loadingActivityIds.filter(id => id !== action.payload.activityId);
      state.errorsByActivity[action.payload.activityId] = action.payload.message;
    },
    sendMessageRequest: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      state.sendingMessageIds.push(action.payload.id);
      delete state.sendErrorsByActivity[action.payload.activityId];
    },
    sendMessageSuccess: (
      state,
      action: PayloadAction<{ tempId: string; message: ChatMessage | null }>,
    ) => {
      const index = state.messages.findIndex(message => message.id === action.payload.tempId);
      if (index >= 0) {
        state.messages[index] = action.payload.message ?? {
          ...state.messages[index],
          delivered: true,
        };
      }
      state.sendingMessageIds = state.sendingMessageIds.filter(id => id !== action.payload.tempId);
    },
    sendMessageFailure: (
      state,
      action: PayloadAction<{ tempId: string; activityId: string; message: string }>,
    ) => {
      state.messages = state.messages.filter(message => message.id !== action.payload.tempId);
      state.sendingMessageIds = state.sendingMessageIds.filter(id => id !== action.payload.tempId);
      state.sendErrorsByActivity[action.payload.activityId] = action.payload.message;
    },
    clearSendMessageError: (state, action: PayloadAction<string>) => {
      delete state.sendErrorsByActivity[action.payload];
    },
    // ─── Local-only optimistic reaction (kept for instant UI feedback) ──────────
    addReaction: (state, action: PayloadAction<{ messageId: string; emoji: string; userId: string }>) => {
      const msg = state.messages.find(m => m.id === action.payload.messageId);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        if (!msg.reactions[action.payload.emoji]) msg.reactions[action.payload.emoji] = [];
        const users = msg.reactions[action.payload.emoji];
        const idx = users.indexOf(action.payload.userId);
        if (idx >= 0) users.splice(idx, 1);
        else users.push(action.payload.userId);
      }
    },

    // ─── API-backed reaction ─────────────────────────────────────────────────
    /**
     * Dispatched from ActivityChatScreen when the user taps a reaction emoji.
     * The optimistic update is applied immediately via addReaction; the saga
     * then calls POST /chat/{activityId}/messages/{messageId}/react and on
     * success replaces the local message with the authoritative server copy.
     */
    reactMessageRequest: (
      state,
      action: PayloadAction<{ activityId: string; messageId: string; emoji: string; userId: string }>,
    ) => {
      const { messageId } = action.payload;
      if (!state.reactingMessageIds.includes(messageId)) {
        state.reactingMessageIds.push(messageId);
      }
      delete state.reactErrorsByMessage[messageId];
    },
    reactMessageSuccess: (
      state,
      action: PayloadAction<{ messageId: string; updatedMessage: ChatMessage | null }>,
    ) => {
      const { messageId, updatedMessage } = action.payload;
      state.reactingMessageIds = state.reactingMessageIds.filter(id => id !== messageId);
      if (updatedMessage) {
        // Replace the local (optimistic) copy with the server-authoritative message
        const index = state.messages.findIndex(m => m.id === messageId);
        if (index >= 0) state.messages[index] = updatedMessage;
      }
    },
    reactMessageFailure: (
      state,
      action: PayloadAction<{ messageId: string; message: string }>,
    ) => {
      const { messageId, message } = action.payload;
      state.reactingMessageIds = state.reactingMessageIds.filter(id => id !== messageId);
      state.reactErrorsByMessage[messageId] = message;
    },
    clearReactError: (state, action: PayloadAction<string>) => {
      delete state.reactErrorsByMessage[action.payload];
    },

    // ─── API-backed message edit ─────────────────────────────────────────────
    /**
     * Dispatched when the user submits an edited message text.
     * Optimistically updates the local text immediately; the saga calls
     * PATCH /chat/{activityId}/messages/{messageId}/pin with { text }
     * and reconciles with the server response on success, or rolls back on failure.
     */
    editMessageRequest: (
      state,
      action: PayloadAction<{ activityId: string; messageId: string; text: string; originalText: string }>,
    ) => {
      const { messageId, text } = action.payload;
      if (!state.editingMessageIds.includes(messageId)) {
        state.editingMessageIds.push(messageId);
      }
      delete state.editErrorsByMessage[messageId];
      // Optimistic update — show the new text instantly
      const msg = state.messages.find(m => m.id === messageId);
      if (msg) {
        msg.text = text;
        msg.isEdited = true;
      }
    },
    editMessageSuccess: (
      state,
      action: PayloadAction<{ messageId: string; updatedMessage: ChatMessage | null; optimisticText: string }>,
    ) => {
      const { messageId, updatedMessage, optimisticText } = action.payload;
      state.editingMessageIds = state.editingMessageIds.filter(id => id !== messageId);
      const index = state.messages.findIndex(m => m.id === messageId);
      if (index < 0) return;

      if (updatedMessage) {
        // Server returned an updated message — use it as authoritative,
        // but ALWAYS force isEdited=true so fetchMessagesSuccess won't
        // overwrite this message on the next background fetch
        state.messages[index] = {
          ...updatedMessage,
          isEdited: true,
        };
      } else {
        // Server returned null / empty body — keep the optimistic text
        state.messages[index] = {
          ...state.messages[index],
          text: optimisticText,
          isEdited: true,
        };
      }
    },
    editMessageFailure: (
      state,
      action: PayloadAction<{ messageId: string; originalText: string; message: string }>,
    ) => {
      const { messageId, originalText, message } = action.payload;
      state.editingMessageIds = state.editingMessageIds.filter(id => id !== messageId);
      state.editErrorsByMessage[messageId] = message;
      // Roll back the optimistic text change
      const msg = state.messages.find(m => m.id === messageId);
      if (msg) {
        msg.text = originalText;
        msg.isEdited = false;
      }
    },
    clearEditError: (state, action: PayloadAction<string>) => {
      delete state.editErrorsByMessage[action.payload];
    },

    // ─── Delivery confirmation ───────────────────────────────────────────────
    /**
     * Dispatched automatically after sendMessageSuccess for every message the
     * current user sends. Fire-and-forget — no UI block, no error shown.
     * PATCH /chat/{activityId}/messages/{messageId}/delivered
     */
    markDeliveredRequest: (
      state,
      action: PayloadAction<{ activityId: string; messageId: string }>,
    ) => {
      const { messageId } = action.payload;
      if (!state.deliveringMessageIds.includes(messageId)) {
        state.deliveringMessageIds.push(messageId);
      }
    },
    markDeliveredSuccess: (
      state,
      action: PayloadAction<{ messageId: string }>,
    ) => {
      const { messageId } = action.payload;
      state.deliveringMessageIds = state.deliveringMessageIds.filter(id => id !== messageId);
      const msg = state.messages.find(m => m.id === messageId);
      if (msg) msg.delivered = true;
    },
    markDeliveredFailure: (
      state,
      action: PayloadAction<{ messageId: string }>,
    ) => {
      // Silently remove from in-flight list — delivery confirmation is best-effort
      state.deliveringMessageIds = state.deliveringMessageIds.filter(
        id => id !== action.payload.messageId,
      );
    },
    setTyping: (state, action: PayloadAction<{ activityId: string; users: string[] }>) => {
      state.typingUsers[action.payload.activityId] = action.payload.users;
    },
    markDelivered: (state, action: PayloadAction<string>) => {
      const msg = state.messages.find(m => m.id === action.payload);
      if (msg) msg.delivered = true;
    },
    pinMessage: (state, action: PayloadAction<string>) => {
      const msg = state.messages.find(m => m.id === action.payload);
      if (msg) msg.pinned = !msg.pinned;
    },
  },
});

export const {
  fetchMessagesRequest,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  sendMessageRequest,
  sendMessageSuccess,
  sendMessageFailure,
  clearSendMessageError,
  addReaction,
  reactMessageRequest,
  reactMessageSuccess,
  reactMessageFailure,
  clearReactError,
  editMessageRequest,
  editMessageSuccess,
  editMessageFailure,
  clearEditError,
  markDeliveredRequest,
  markDeliveredSuccess,
  markDeliveredFailure,
  setTyping,
  markDelivered,
  pinMessage,
} = chatSlice.actions;

// Messages sorted oldest → newest so the FlatList renders in correct chronological order
export const selectMessagesByActivity = (activityId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.messages
      .filter(m => m.activityId === activityId)
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

export const selectPinnedMessages = (activityId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.messages.filter(m => m.activityId === activityId && m.pinned);

export const selectTypingUsers = (activityId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.typingUsers[activityId] ?? [];

export const selectIsReacting = (messageId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.reactingMessageIds.includes(messageId);

export const selectReactError = (messageId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.reactErrorsByMessage[messageId];

export const selectIsEditing = (messageId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.editingMessageIds.includes(messageId);

export const selectEditError = (messageId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.editErrorsByMessage[messageId];

export default chatSlice.reducer;
