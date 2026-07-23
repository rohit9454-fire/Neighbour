import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  TextInput, KeyboardAvoidingView, Platform, ListRenderItemInfo,
  ActivityIndicator, RefreshControl, Modal, Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { ActivitiesStackParamList, ChatMessage } from '../../types';
import {
  clearSendMessageError,
  clearEditError,
  editMessageRequest,
  fetchMessagesRequest,
  reactMessageRequest,
  selectMessagesByActivity,
  selectPinnedMessages,
  selectHasMoreMessages,
  selectSocketConnected,
  sendMessageRequest,
  loadMoreMessagesRequest,
  socketTypingUpdate,
  socketMessageReceived,
} from '../../store/slices/chatSlice';
import { socketActions } from '../../store/slices/chatSlice';
import { socketService } from '../../services/socketService';
import { C } from '../../theme';

type Props = NativeStackScreenProps<ActivitiesStackParamList, 'ActivityChat'>;

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '👏'];

// ─── Message context menu ──────────────────────────────────────────────────────

interface ContextMenuProps {
  visible: boolean;
  isMe: boolean;
  onReact: (emoji: string) => void;
  onEdit: () => void;
  onDismiss: () => void;
}

function MessageContextMenu({ visible, isMe, onReact, onEdit, onDismiss }: ContextMenuProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <Pressable style={menu.backdrop} onPress={onDismiss}>
        <View style={menu.sheet}>
          {/* Quick reactions row */}
          <View style={menu.reactionsRow}>
            {QUICK_REACTIONS.map(e => (
              <TouchableOpacity
                key={e}
                style={menu.emojiBtn}
                onPress={() => { onReact(e); onDismiss(); }}>
                <Text style={menu.emoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={menu.divider} />

          {/* Only the message owner can edit */}
          {isMe && (
            <TouchableOpacity style={menu.action} onPress={() => { onEdit(); onDismiss(); }}>
              <Icon name="pencil-outline" size={20} color={C.textSecondary} style={menu.actionIcon} />
              <Text style={menu.actionText}>Edit Message</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={menu.action} onPress={onDismiss}>
            <Icon name="close" size={20} color={C.textMuted} style={menu.actionIcon} />
            <Text style={[menu.actionText, { color: C.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────

interface BubbleProps {
  msg: ChatMessage;
  isMe: boolean;
  isBeingEdited: boolean;
  onLongPress: () => void;
  onReact: (emoji: string) => void;
}

function MessageBubble({ msg, isMe, isBeingEdited, onLongPress, onReact }: BubbleProps): React.JSX.Element {
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
          <Text style={styles.msgAvatarText}>{msg.senderName?.[0] ?? '?'}</Text>
        </View>
      )}
      <View style={[styles.msgWrap, isMe && styles.msgWrapMe]}>
        {!isMe && <Text style={styles.msgSender}>{msg.senderName}</Text>}

        <TouchableOpacity
          style={[
            styles.bubble,
            isMe && styles.bubbleMe,
            isBeingEdited && styles.bubbleEditing,
          ]}
          onLongPress={onLongPress}
          activeOpacity={0.85}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.text}</Text>
          {msg.isEdited && (
            <Text style={[styles.editedLabel, isMe && styles.editedLabelMe]}>edited</Text>
          )}
        </TouchableOpacity>

        {totalReactions.length > 0 && (
          <View style={styles.reactionsRow}>
            {totalReactions.map(([emoji, users]) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionBadge}
                onPress={() => onReact(emoji)}>
                <Text style={styles.reactionText}>{emoji} {users.length}</Text>
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

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function ActivityChatScreen({ route, navigation }: Props): React.JSX.Element {
  const { activityId, activityTitle } = route.params;
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const messages = useSelector(selectMessagesByActivity(activityId));
  const pinnedMessages = useSelector(selectPinnedMessages(activityId));
  const hasMore = useSelector(selectHasMoreMessages(activityId));
  const isSocketConnected = useSelector(selectSocketConnected);
  const isLoading = useSelector((state: RootState) =>
    state.chat.loadingActivityIds.includes(activityId),
  );
  const loadError = useSelector(
    (state: RootState) => state.chat.errorsByActivity[activityId],
  );
  const isSending = useSelector((state: RootState) =>
    state.chat.sendingMessageIds.some(mid =>
      state.chat.messages.some(m => m.id === mid && m.activityId === activityId),
    ),
  );
  const sendError = useSelector(
    (state: RootState) => state.chat.sendErrorsByActivity[activityId],
  );
  const editingMessageIds = useSelector(
    (state: RootState) => state.chat.editingMessageIds,
  );
  const typingUsers = useSelector(
    (state: RootState) => state.chat.typingUsers[activityId] ?? [],
  );

  const [text, setText] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const listRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editOriginalText, setEditOriginalText] = useState('');
  const editOriginalRef = useRef<string>('');
  const lastSubmittedEditIdRef = useRef<string | null>(null);

  // ── Context menu state ──────────────────────────────────────────────────────
  const [menuTarget, setMenuTarget] = useState<ChatMessage | null>(null);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Join socket room and fetch initial messages on mount
  useEffect(() => {
    dispatch(socketActions.joinRoom(activityId));
    dispatch(fetchMessagesRequest(activityId));

    // Register real-time listeners directly in the screen.
    // This avoids the redux-saga eventChannel import issue and is simpler
    // since the screen owns the lifecycle of these subscriptions.
    const unsubMessage = socketService.onMessage(activityId, (message) => {
      dispatch(socketMessageReceived(message));
    });

    const unsubTyping = socketService.onTyping(activityId, (data) => {
      dispatch(socketTypingUpdate(data));
    });

    return () => {
      unsubMessage();
      unsubTyping();
      dispatch(socketActions.leaveRoom(activityId));
      dispatch(socketTypingUpdate({ activityId, users: [] }));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // Show send error
  useEffect(() => {
    if (!sendError) return;
    Alert.alert('Could not send message', sendError, [
      { text: 'OK', onPress: () => dispatch(clearSendMessageError(activityId)) },
    ]);
  }, [activityId, dispatch, sendError]);

  // Watch for edit errors
  const editErrors = useSelector(
    (state: RootState) => state.chat.editErrorsByMessage,
  );
  useEffect(() => {
    const targetId = lastSubmittedEditIdRef.current;
    if (!targetId) return;
    const err = editErrors[targetId];
    if (!err) return;
    Alert.alert('Could not edit message', err, [
      {
        text: 'OK', onPress: () => {
          dispatch(clearEditError(targetId));
          lastSubmittedEditIdRef.current = null;
        },
      },
    ]);
  }, [editErrors, dispatch]);

  // ── Typing indicator ────────────────────────────────────────────────────────

  const handleTextChange = (value: string) => {
    setText(value);

    // Emit typing start
    if (value.length > 0) {
      socketService.sendTyping(activityId, true);

      // Auto-stop typing after 2s of inactivity
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socketService.sendTyping(activityId, false);
      }, 2000);
    } else {
      socketService.sendTyping(activityId, false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
  };

  // ── Send / Edit submit ──────────────────────────────────────────────────────

  const handleSend = () => {
    if (!text.trim() || !user) return;
    // Stop typing indicator
    socketService.sendTyping(activityId, false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    dispatch(sendMessageRequest({
      id: Date.now().toString(),
      activityId,
      senderId: user.id ?? user.email,
      senderName: user.name,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      delivered: false,
      readBy: [],
    }));
    setText('');
  };

  const handleEditSubmit = () => {
    if (!editingId || !editDraft.trim()) return;
    lastSubmittedEditIdRef.current = editingId;
    dispatch(editMessageRequest({
      activityId,
      messageId: editingId,
      text: editDraft.trim(),
      originalText: editOriginalRef.current,
    }));
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft('');
    setEditOriginalText('');
    editOriginalRef.current = '';
  };

  // ── Context menu handlers ───────────────────────────────────────────────────

  const openMenu = (msg: ChatMessage) => setMenuTarget(msg);
  const closeMenu = () => setMenuTarget(null);

  const handleReact = (messageId: string, emoji: string) => {
    if (!user) return;
    dispatch(reactMessageRequest({
      activityId,
      messageId,
      emoji,
      userId: user.id ?? user.email,
    }));
  };

  const startEdit = (msg: ChatMessage) => {
    editOriginalRef.current = msg.text;
    setEditOriginalText(msg.text);
    setEditDraft(msg.text);
    setEditingId(msg.id);
  };

  // ── Pagination ──────────────────────────────────────────────────────────────

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      dispatch(loadMoreMessagesRequest(activityId));
    }
  };

  // ── Rendering ───────────────────────────────────────────────────────────────

  const isEditMode = editingId !== null;

  // Typing indicator text
  const typingText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing…`
    : typingUsers.length > 1
      ? `${typingUsers.slice(0, 2).join(', ')} are typing…`
      : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{activityTitle}</Text>
          <View style={styles.headerSubRow}>
            <View style={[styles.socketDot, { backgroundColor: isSocketConnected ? C.success : C.textMuted }]} />
            <Text style={styles.headerSub}>
              {isSocketConnected ? 'Live' : 'Activity Chat'}
            </Text>
          </View>
        </View>
        {pinnedMessages.length > 0 && (
          <TouchableOpacity onPress={() => setShowPinned(p => !p)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="pin" size={14} color={C.btnInactive} />
              <Text style={styles.pinnedBtn}>{pinnedMessages.length}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Pinned banner */}
      {showPinned && pinnedMessages.length > 0 && (
        <View style={styles.pinnedBanner}>
          <Icon name="pin" size={14} color={C.btnActive} style={{ marginRight: 6 }} />
          <Text style={styles.pinnedBannerText}>{pinnedMessages[0].text}</Text>
        </View>
      )}

      {/* Edit mode banner */}
      {isEditMode && (
        <View style={styles.editBanner}>
          <Icon name="pencil" size={14} color={C.btnActive} style={{ marginRight: 6 }} />
          <Text style={styles.editBannerText} numberOfLines={1}>
            Editing: {editOriginalText}
          </Text>
          <TouchableOpacity onPress={cancelEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close" size={16} color={C.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <FlatList<ChatMessage>
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.15}
          ListHeaderComponent={
            hasMore ? (
              <View style={styles.loadMoreHeader}>
                {isLoading
                  ? <ActivityIndicator size="small" color={C.btnActive} />
                  : <TouchableOpacity onPress={handleLoadMore}>
                      <Text style={styles.loadMoreText}>Load older messages</Text>
                    </TouchableOpacity>
                }
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading && messages.length > 0}
              onRefresh={() => dispatch(fetchMessagesRequest(activityId))}
              tintColor={C.btnActive}
            />
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={C.btnActive} />
                <Text style={styles.emptyText}>Loading messages…</Text>
              </View>
            ) : loadError ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{loadError}</Text>
                <TouchableOpacity onPress={() => dispatch(fetchMessagesRequest(activityId))}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No messages yet. Start the conversation.</Text>
              </View>
            )
          }
          renderItem={({ item }: ListRenderItemInfo<ChatMessage>) => {
            const isMe = item.senderId === (user?.id ?? user?.email);
            return (
              <MessageBubble
                msg={item}
                isMe={isMe}
                isBeingEdited={item.id === editingId}
                onLongPress={() => openMenu(item)}
                onReact={(emoji) => handleReact(item.id, emoji)}
              />
            );
          }}
        />

        {/* Typing indicator */}
        {typingText && (
          <View style={styles.typingBar}>
            <Text style={styles.typingText}>{typingText}</Text>
          </View>
        )}

        {/* Input / Edit bar */}
        <View style={styles.inputBar}>
          {isEditMode ? (
            <>
              <TextInput
                style={[styles.input, styles.inputEdit]}
                value={editDraft}
                onChangeText={setEditDraft}
                multiline
                maxLength={500}
                autoFocus
                placeholderTextColor={C.textMuted}
                placeholder="Edit your message..."
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!editDraft.trim() || editingMessageIds.includes(editingId ?? '')) &&
                    styles.sendBtnDisabled,
                ]}
                onPress={handleEditSubmit}
                disabled={
                  !editDraft.trim() || editingMessageIds.includes(editingId ?? '')
                }>
                {editingMessageIds.includes(editingId ?? '') ? (
                  <ActivityIndicator size="small" color={C.textWhite} />
                ) : (
                  <Icon name="check" size={18} color={editDraft.trim() ? C.textWhite : C.textMuted} />
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.attachBtn}>
                <Icon name="paperclip" size={20} color={C.textSecondary} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={C.textMuted}
                value={text}
                onChangeText={handleTextChange}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!text.trim() || isSending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!text.trim() || isSending}>
                {isSending ? (
                  <ActivityIndicator size="small" color={C.textWhite} />
                ) : (
                  <Icon name="send" size={18} color={text.trim() ? C.textWhite : C.textMuted} />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Long-press context menu */}
      {menuTarget && (
        <MessageContextMenu
          visible={!!menuTarget}
          isMe={menuTarget.senderId === (user?.id ?? user?.email)}
          onReact={(emoji) => handleReact(menuTarget.id, emoji)}
          onEdit={() => startEdit(menuTarget)}
          onDismiss={closeMenu}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const menu = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.bgMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 24 },
  divider: { height: 1, backgroundColor: C.divider, marginVertical: 8 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  actionIcon: { marginRight: 14 },
  actionText: { fontSize: 15, color: C.textPrimary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
    gap: 12, backgroundColor: C.bgCard,
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  headerSub: { fontSize: 11, color: C.textMuted },
  socketDot: { width: 6, height: 6, borderRadius: 3 },
  pinnedBtn: { fontSize: 13, color: C.btnInactive },

  pinnedBanner: {
    backgroundColor: C.bgMuted, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
    flexDirection: 'row', alignItems: 'center',
  },
  pinnedBannerText: { fontSize: 12, color: C.btnActive, lineHeight: 18 },

  // Edit mode banner
  editBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  editBannerText: { flex: 1, fontSize: 12, color: C.btnActive, lineHeight: 18 },

  messagesList: { padding: 16, paddingBottom: 8 },
  emptyState: { alignItems: 'center', gap: 10, paddingTop: 56, paddingHorizontal: 24 },
  emptyText: { color: C.textMuted, fontSize: 14, textAlign: 'center' },
  retryText: { color: C.btnActive, fontSize: 14, fontWeight: '700' },

  systemMsg: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginVertical: 8,
  },
  pinnedIcon: { fontSize: 12 },
  systemText: {
    fontSize: 11, color: C.textMuted, textAlign: 'center',
    backgroundColor: C.bgMuted, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 5,
  },

  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.btnInactive,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  msgAvatarText: { fontSize: 12, fontWeight: '700', color: C.textWhite },
  msgWrap: { maxWidth: '75%' },
  msgWrapMe: { alignItems: 'flex-end' },
  msgSender: { fontSize: 11, color: C.textMuted, marginBottom: 3, marginLeft: 2 },

  bubble: {
    backgroundColor: C.bgCard, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: C.border,
  },
  bubbleMe: {
    backgroundColor: C.btnActive, borderWidth: 0,
    borderBottomLeftRadius: 18, borderBottomRightRadius: 4,
  },
  bubbleEditing: {
    borderColor: C.btnActive, borderWidth: 2,
  },
  bubbleText: { fontSize: 14, color: C.textPrimary, lineHeight: 20 },
  bubbleTextMe: { color: C.textWhite },
  editedLabel: {
    fontSize: 10, color: C.textMuted, marginTop: 3, fontStyle: 'italic',
  },
  editedLabelMe: { color: 'rgba(255,255,255,0.6)' },

  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  reactionBadge: {
    backgroundColor: C.bgCard, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: C.border,
  },
  reactionText: { fontSize: 12, color: C.textSecondary },

  msgMeta: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, marginTop: 3, marginLeft: 4,
  },
  msgMetaMe: { justifyContent: 'flex-end', marginRight: 4 },
  msgTime: { fontSize: 10, color: C.textMuted },
  deliveredIcon: { fontSize: 10, color: C.btnInactive },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.border,
    gap: 8, backgroundColor: C.bgCard,
  },
  attachBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.bgMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  input: {
    flex: 1, backgroundColor: C.bgInput, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: C.textPrimary, maxHeight: 100,
    borderWidth: 1, borderColor: C.border,
  },
  inputEdit: {
    borderColor: C.btnActive, borderWidth: 1.5,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.btnInactive,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.bgMuted },

  typingBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: C.bgCard,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  typingText: { fontSize: 11, color: C.textMuted, fontStyle: 'italic' },

  loadMoreHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadMoreText: {
    fontSize: 13,
    color: C.btnActive,
    fontWeight: '600',
  },
});
