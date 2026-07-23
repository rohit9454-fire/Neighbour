import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../../types';

// ─── Socket actions (dispatched from the useActivityChat hook) ────────────────
// Separate from slice reducers so they are plain action creators consumed by
// both the saga (for side effects) and the slice (for state updates).
export const socketActions = {
  joinRoom:    (activityId: string)                             => ({ type: 'chat/socketJoinRoom'    as const, payload: activityId }),
  leaveRoom:   (activityId: string)                             => ({ type: 'chat/socketLeaveRoom'   as const, payload: activityId }),
  messageReceived: (message: ChatMessage)                       => ({ type: 'chat/socketMessageReceived' as const, payload: message }),
  typingUpdate: (data: { activityId: string; users: string[] }) => ({ type: 'chat/socketTypingUpdate' as const, payload: data }),
};

interface ChatState {
  messages: ChatMessage[];
  typingUsers: Record<string, string[]>;
  loadingActivityIds: string[];
  errorsByActivity: Record<string, string | undefined>;
  sendingMessageIds: string[];
  sendErrorsByActivity: Record<string, string | undefined>;
  reactingMessageIds: string[];
  reactErrorsByMessage: Record<string, string | undefined>;
  editingMessageIds: string[];
  editErrorsByMessage: Record<string, string | undefined>;
  deliveringMessageIds: string[];
  /**
   * Permanent set of messageIds the user has successfully edited locally.
   * Unlike editingMessageIds (in-flight only), this persists after the saga
   * completes so fetchMessagesSuccess never overwrites edited text with a
   * stale server response.
   */
  locallyEditedIds: string[];
  /** Whether the Socket.io connection is currently active. */
  socketConnected: boolean;
  /** Per-activity cursor for message pagination (oldest message id fetched). */
  paginationCursors: Record<string, string | null>;
  /** Whether there are more historical messages to load for each activity. */
  hasMoreMessages: Record<string, boolean>;
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
    locallyEditedIds: [],
    socketConnected: false,
    paginationCursors: {},
    hasMoreMessages: {},
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

      const sorted = [...messages].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      // Build a protection set from both in-flight edits AND permanently-edited ids.
      // locallyEditedIds is NEVER cleared by fetches, so an edit always wins
      // over a subsequent server response that still carries the old text.
      const protectedIds = new Set<string>([
        ...state.editingMessageIds,
        ...state.locallyEditedIds,
      ]);

      const merged = sorted.map(serverMsg => {
        if (protectedIds.has(serverMsg.id)) {
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
        const index = state.messages.findIndex(m => m.id === messageId);
        if (index >= 0) {
          const wasEditedLocally = state.locallyEditedIds.includes(messageId);
          state.messages[index] = {
            ...updatedMessage,
            // Preserve local edit state — server reaction response won't carry it
            ...(wasEditedLocally && {
              text: state.messages[index].text,
              isEdited: true,
            }),
          };
        }
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
      // Add to permanent protection set immediately so any concurrent fetch
      // that resolves while the PATCH is in-flight won't overwrite the text
      if (!state.locallyEditedIds.includes(messageId)) {
        state.locallyEditedIds.push(messageId);
      }
      delete state.editErrorsByMessage[messageId];
      // Optimistic update
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
      // locallyEditedIds intentionally kept — never remove it so future fetches
      // always protect this message
      const index = state.messages.findIndex(m => m.id === messageId);
      if (index < 0) return;

      if (updatedMessage) {
        // Use server copy but force isEdited=true regardless of what server returns
        state.messages[index] = { ...updatedMessage, isEdited: true };
      } else {
        // Server returned empty body — keep the optimistic text
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
      // Remove from permanent set on failure so future fetches restore server truth
      state.locallyEditedIds = state.locallyEditedIds.filter(id => id !== messageId);
      state.editErrorsByMessage[messageId] = message;
      // Roll back optimistic text
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

    // ─── Socket.io real-time events ────────────────────────────────────────────
    socketConnected: (state) => {
      state.socketConnected = true;
    },
    socketDisconnected: (state) => {
      state.socketConnected = false;
    },
    socketMessageReceived: (state, action: PayloadAction<ChatMessage>) => {
      // Append the real-time message if it doesn't already exist
      const exists = state.messages.some(m => m.id === action.payload.id);
      if (!exists) {
        state.messages.push(action.payload);
      }
    },
    socketTypingUpdate: (state, action: PayloadAction<{ activityId: string; users: string[] }>) => {
      state.typingUsers[action.payload.activityId] = action.payload.users;
    },

    // ─── Pagination ─────────────────────────────────────────────────────────────
    loadMoreMessagesRequest: (state, action: PayloadAction<string>) => {
      if (!state.loadingActivityIds.includes(action.payload)) {
        state.loadingActivityIds.push(action.payload);
      }
    },
    loadMoreMessagesSuccess: (
      state,
      action: PayloadAction<{ activityId: string; messages: ChatMessage[]; hasMore: boolean }>,
    ) => {
      const { activityId, messages, hasMore } = action.payload;
      state.loadingActivityIds = state.loadingActivityIds.filter(id => id !== activityId);
      state.hasMoreMessages[activityId] = hasMore;

      // Prepend historical messages (they're older than current messages)
      const protectedIds = new Set<string>([
        ...state.editingMessageIds,
        ...state.locallyEditedIds,
      ]);
      const safe = messages.map(serverMsg => {
        if (protectedIds.has(serverMsg.id)) {
          const localMsg = state.messages.find(m => m.id === serverMsg.id);
          return localMsg ?? serverMsg;
        }
        return serverMsg;
      });

      // Filter out duplicates and prepend
      const existing = new Set(state.messages.map(m => m.id));
      const newMsgs = safe.filter(m => !existing.has(m.id));
      state.messages = [...newMsgs, ...state.messages];

      // Update cursor to the oldest message fetched
      if (messages.length > 0) {
        state.paginationCursors[activityId] = messages[0].id;
      }
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
  socketConnected,
  socketDisconnected,
  socketMessageReceived,
  socketTypingUpdate,
  loadMoreMessagesRequest,
  loadMoreMessagesSuccess,
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

export const selectSocketConnected =
  (state: { chat: ChatState }) => state.chat.socketConnected;

export const selectHasMoreMessages = (activityId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.hasMoreMessages[activityId] ?? false;

export const selectPaginationCursor = (activityId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.paginationCursors[activityId] ?? null;

export default chatSlice.reducer;
