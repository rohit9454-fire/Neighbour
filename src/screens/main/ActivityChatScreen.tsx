import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ListRenderItemInfo,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { ActivitiesStackParamList, ChatMessage } from '../../types';
import {
  selectMessagesByActivity, selectPinnedMessages,
  sendMessage, addReaction,
} from '../../store/slices/chatSlice';

type Props = NativeStackScreenProps<ActivitiesStackParamList, 'ActivityChat'>;

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '👏'];

function MessageBubble({
  msg, isMe, onReact,
}: {
  msg: ChatMessage; isMe: boolean; onReact: (emoji: string) => void;
}): React.JSX.Element {
  const [showReactions, setShowReactions] = useState(false);

  if (msg.type === 'system') {
    return (
      <View style={styles.systemMsg}>
        {msg.pinned && <Text style={styles.pinnedIcon}>📌 </Text>}
        <Text style={styles.systemText}>{msg.text}</Text>
      </View>
    );
  }

  const totalReactions = Object.entries(msg.reactions ?? {}).filter(([, users]) => users.length > 0);

  return (
    <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
      {!isMe && (
        <View style={styles.msgAvatar}>
          <Text style={styles.msgAvatarText}>{msg.senderName[0]}</Text>
        </View>
      )}
      <View style={[styles.msgWrap, isMe && styles.msgWrapMe]}>
        {!isMe && <Text style={styles.msgSender}>{msg.senderName}</Text>}
        <TouchableOpacity
          style={[styles.bubble, isMe && styles.bubbleMe]}
          onLongPress={() => setShowReactions(r => !r)}
          activeOpacity={0.85}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.text}</Text>
        </TouchableOpacity>

        {/* Reactions */}
        {totalReactions.length > 0 && (
          <View style={styles.reactionsRow}>
            {totalReactions.map(([emoji, users]) => (
              <TouchableOpacity key={emoji} style={styles.reactionBadge} onPress={() => onReact(emoji)}>
                <Text style={styles.reactionText}>{emoji} {users.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Reaction Picker */}
        {showReactions && (
          <View style={[styles.reactionPicker, isMe && styles.reactionPickerMe]}>
            {QUICK_REACTIONS.map(e => (
              <TouchableOpacity key={e} onPress={() => { onReact(e); setShowReactions(false); }}>
                <Text style={styles.reactionPickerEmoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.msgMeta, isMe && styles.msgMetaMe]}>
          <Text style={styles.msgTime}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMe && (
            <Text style={styles.deliveredIcon}>
              {msg.readBy && msg.readBy.length > 0 ? '✓✓' : msg.delivered ? '✓' : '○'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function ActivityChatScreen({ route, navigation }: Props): React.JSX.Element {
  const { activityId, activityTitle } = route.params;
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const messages = useSelector(selectMessagesByActivity(activityId));
  const pinnedMessages = useSelector(selectPinnedMessages(activityId));
  const [text, setText] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim() || !user) return;
    dispatch(sendMessage({
      id: Date.now().toString(),
      activityId,
      senderId: user.email,
      senderName: user.name,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      delivered: true,
      readBy: [],
    }));
    setText('');
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (!user) return;
    dispatch(addReaction({ messageId, emoji, userId: user.email }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{activityTitle}</Text>
          <Text style={styles.headerSub}>Activity Chat</Text>
        </View>
        {pinnedMessages.length > 0 && (
          <TouchableOpacity onPress={() => setShowPinned(p => !p)}>
            <Text style={styles.pinnedBtn}>📌 {pinnedMessages.length}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pinned Banner */}
      {showPinned && pinnedMessages.length > 0 && (
        <View style={styles.pinnedBanner}>
          <Text style={styles.pinnedBannerText}>📌 {pinnedMessages[0].text}</Text>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <FlatList<ChatMessage>
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: ListRenderItemInfo<ChatMessage>) => (
            <MessageBubble
              msg={item}
              isMe={item.senderId === user?.email}
              onReact={(emoji) => handleReact(item.id, emoji)}
            />
          )}
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#4B5563"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}>
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111', gap: 12 },
  backText: { fontSize: 22, color: '#fff' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  pinnedBtn: { fontSize: 13, color: '#93C5FD' },

  pinnedBanner: { backgroundColor: '#1E3A8A', paddingHorizontal: 16, paddingVertical: 10 },
  pinnedBannerText: { fontSize: 12, color: '#93C5FD', lineHeight: 18 },

  messagesList: { padding: 16, paddingBottom: 8 },

  systemMsg: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
  pinnedIcon: { fontSize: 12 },
  systemText: { fontSize: 11, color: '#4B5563', textAlign: 'center', backgroundColor: '#111', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },

  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  msgAvatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  msgWrap: { maxWidth: '75%' },
  msgWrapMe: { alignItems: 'flex-end' },
  msgSender: { fontSize: 11, color: '#6B7280', marginBottom: 3, marginLeft: 2 },
  bubble: { backgroundColor: '#1A1A1A', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: '#1E3A8A', borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: '#E5E7EB', lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },

  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  reactionBadge: { backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#2A2A2A' },
  reactionText: { fontSize: 12, color: '#D1D5DB' },

  reactionPicker: { flexDirection: 'row', gap: 6, backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4, borderWidth: 1, borderColor: '#2A2A2A' },
  reactionPickerMe: { alignSelf: 'flex-end' },
  reactionPickerEmoji: { fontSize: 20 },

  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, marginLeft: 4 },
  msgMetaMe: { justifyContent: 'flex-end', marginRight: 4 },
  msgTime: { fontSize: 10, color: '#4B5563' },
  deliveredIcon: { fontSize: 10, color: '#60A5FA' },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#111', gap: 8 },
  attachBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  attachIcon: { fontSize: 18 },
  input: { flex: 1, backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#fff', maxHeight: 100, borderWidth: 1, borderColor: '#1F2937' },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#1F2937' },
  sendIcon: { fontSize: 18, color: '#fff', fontWeight: '700' },
});
