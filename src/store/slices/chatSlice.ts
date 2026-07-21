import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../../types';

interface ChatState {
  messages: ChatMessage[];
  typingUsers: Record<string, string[]>;
  loadingActivityIds: string[];
  errorsByActivity: Record<string, string | undefined>;
  sendingMessageIds: string[];
  sendErrorsByActivity: Record<string, string | undefined>;
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
      state.messages = [
        ...state.messages.filter(message => message.activityId !== activityId),
        ...messages,
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
  setTyping,
  markDelivered,
  pinMessage,
} = chatSlice.actions;

export const selectMessagesByActivity = (activityId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.messages.filter(m => m.activityId === activityId);

export const selectPinnedMessages = (activityId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.messages.filter(m => m.activityId === activityId && m.pinned);

export const selectTypingUsers = (activityId: string) =>
  (state: { chat: ChatState }) =>
    state.chat.typingUsers[activityId] ?? [];

export default chatSlice.reducer;
