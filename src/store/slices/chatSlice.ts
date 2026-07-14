import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../../types';

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'sys1', activityId: '1', senderId: 'system', senderName: 'System',
    text: 'Rahul created this activity', timestamp: '2024-06-20T05:00:00Z',
    type: 'system', delivered: true,
  },
  {
    id: 'm1', activityId: '1', senderId: 'rahul', senderName: 'Rahul',
    text: 'Hey everyone! Court is booked for tomorrow 🎾', timestamp: '2024-06-20T06:00:00Z',
    type: 'text', delivered: true, readBy: ['priya', 'amit'],
    reactions: { '👍': ['priya', 'amit'] },
  },
  {
    id: 'm2', activityId: '1', senderId: 'priya', senderName: 'Priya',
    text: "I'll be there! Should I bring extra shuttlecocks?", timestamp: '2024-06-20T06:05:00Z',
    type: 'text', delivered: true, readBy: ['rahul'],
  },
  {
    id: 'm3', activityId: '1', senderId: 'rahul', senderName: 'Rahul',
    text: 'Yes please! Bring 2-3 if you have them 🙏', timestamp: '2024-06-20T06:07:00Z',
    type: 'text', delivered: true, readBy: ['priya'],
  },
  {
    id: 'sys2', activityId: '1', senderId: 'system', senderName: 'System',
    text: 'Amit joined the activity', timestamp: '2024-06-20T07:00:00Z',
    type: 'system', delivered: true,
  },
  {
    id: 'm4', activityId: '1', senderId: 'amit', senderName: 'Amit',
    text: 'Excited! See you all at 6:30 AM 💪', timestamp: '2024-06-20T07:01:00Z',
    type: 'text', delivered: true, readBy: ['rahul'],
    reactions: { '🔥': ['rahul', 'priya'] },
  },
  {
    id: 'pin1', activityId: '1', senderId: 'rahul', senderName: 'Rahul',
    text: '📌 Court Reserved – Hall B, Ground Floor. Entry from Gate 3.',
    timestamp: '2024-06-20T08:00:00Z', type: 'system', delivered: true, pinned: true,
  },
  // Activity 2 messages
  {
    id: 'sys3', activityId: '2', senderId: 'system', senderName: 'System',
    text: 'Vikram created this activity', timestamp: '2024-06-19T10:00:00Z',
    type: 'system', delivered: true,
  },
  {
    id: 'm5', activityId: '2', senderId: 'vikram', senderName: 'Vikram',
    text: 'Ground is booked, see you all tomorrow! 🏏', timestamp: '2024-06-19T10:05:00Z',
    type: 'text', delivered: true, readBy: ['suresh', 'deepak'],
  },
];

interface ChatState {
  messages: ChatMessage[];
  typingUsers: Record<string, string[]>;
}

const chatSlice = createSlice({
  name: 'chat',
  initialState: { messages: MOCK_MESSAGES, typingUsers: {} } as ChatState,
  reducers: {
    sendMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
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

export const { sendMessage, addReaction, setTyping, markDelivered, pinMessage } = chatSlice.actions;

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
