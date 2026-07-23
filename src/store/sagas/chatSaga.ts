import {
  call, cancel, fork, put, select, take, takeEvery, takeLatest,
} from 'redux-saga/effects';
import { Task } from 'redux-saga';
import { chatService } from '../../services';
import { socketService } from '../../services/socketService';
import { ChatMessage } from '../../types';
import { RootState } from '../index';
import {
  fetchMessagesFailure,
  fetchMessagesRequest,
  fetchMessagesSuccess,
  sendMessageFailure,
  sendMessageRequest,
  sendMessageSuccess,
  addReaction,
  reactMessageRequest,
  reactMessageSuccess,
  reactMessageFailure,
  editMessageRequest,
  editMessageSuccess,
  editMessageFailure,
  markDeliveredRequest,
  markDeliveredSuccess,
  markDeliveredFailure,
  socketConnected,
  socketDisconnected,
  loadMoreMessagesRequest,
  loadMoreMessagesSuccess,
} from '../slices/chatSlice';
import { loginSuccess, logout } from '../slices/authSlice';

// ─── Socket connection management ─────────────────────────────────────────────
// Rather than an eventChannel (which requires redux-saga package internals),
// we manage the socket lifecycle directly in the saga: connect on login,
// join/leave rooms on navigation, and disconnect on logout.
// Real-time message dispatching is done from ActivityChatScreen via a
// useEffect that calls socketService.onMessage() and dispatches actions.
// This is simpler and avoids the eventChannel import issue entirely.

function* manageChatConnection(activityId: string) {
  const token: string | null = yield select(
    (state: RootState) => state.auth.token,
  );

  // Connect socket if not already connected
  if (token && !socketService.isConnected()) {
    socketService.connect(token);
  }

  // Join the activity room so the server sends this client messages
  socketService.joinActivity(activityId);

  // Hold until the screen dispatches leaveRoom or user logs out
  yield take([
    (action: { type: string; payload?: unknown }) =>
      action.type === 'chat/socketLeaveRoom' && action.payload === activityId,
    logout.type,
  ]);

  socketService.leaveActivity(activityId);
}

function* handleJoinRoom(action: { type: string; payload: string }) {
  // Fork so the saga doesn't block the takeEvery watcher
  yield fork(manageChatConnection, action.payload);
}

// ─── Socket connect / disconnect ──────────────────────────────────────────────

function* handleSocketConnect(action: ReturnType<typeof loginSuccess>) {
  if (!socketService.isConnected()) {
    socketService.connect(action.payload.token);
    yield put(socketConnected());
  }
}

function* handleSocketDisconnect() {
  socketService.disconnect();
  yield put(socketDisconnected());
}

// ─── Message fetch (initial REST load) ───────────────────────────────────────

function* handleFetchMessages(action: ReturnType<typeof fetchMessagesRequest>) {
  try {
    const messages: ChatMessage[] = yield call(
      chatService.getActivityMessages,
      action.payload,
    );
    yield put(fetchMessagesSuccess({ activityId: action.payload, messages }));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to load messages.';
    yield put(fetchMessagesFailure({ activityId: action.payload, message }));
  }
}

/**
 * Cancels any in-flight fetch when an edit starts for the same activity,
 * so a stale GET response can't overwrite optimistic edit text.
 */
function* watchFetchMessages() {
  let fetchTask: Task | null = null;

  while (true) {
    const action:
      | ReturnType<typeof fetchMessagesRequest>
      | ReturnType<typeof editMessageRequest> = yield take([
      fetchMessagesRequest.type,
      editMessageRequest.type,
    ]);

    if (action.type === editMessageRequest.type) {
      if (fetchTask) {
        yield cancel(fetchTask);
        fetchTask = null;
      }
      continue;
    }

    if (fetchTask) yield cancel(fetchTask);
    fetchTask = yield fork(
      handleFetchMessages,
      action as ReturnType<typeof fetchMessagesRequest>,
    );
  }
}

// ─── Message pagination (load older messages) ─────────────────────────────────

function* handleLoadMoreMessages(
  action: ReturnType<typeof loadMoreMessagesRequest>,
) {
  const activityId = action.payload;
  const cursor: string | null = yield select(
    (state: RootState) => state.chat.paginationCursors[activityId] ?? null,
  );

  try {
    const messages: ChatMessage[] = yield call(
      chatService.getActivityMessages,
      activityId,
      cursor ?? undefined,
    );
    const PAGE_SIZE = 30;
    yield put(
      loadMoreMessagesSuccess({
        activityId,
        messages,
        hasMore: messages.length >= PAGE_SIZE,
      }),
    );
  } catch {
    // Non-critical — silently surface as "no more messages"
    yield put(
      loadMoreMessagesSuccess({ activityId, messages: [], hasMore: false }),
    );
  }
}

// ─── Send message ─────────────────────────────────────────────────────────────

function* handleSendMessage(action: ReturnType<typeof sendMessageRequest>) {
  try {
    if (socketService.isConnected()) {
      // Socket path: server echoes the persisted message back via 'message:new',
      // which the screen's useEffect will dispatch as socketMessageReceived.
      socketService.sendMessage(
        action.payload.activityId,
        action.payload.text,
      );
      yield put(
        sendMessageSuccess({ tempId: action.payload.id, message: null }),
      );
    } else {
      // REST fallback when socket is not connected
      const message: ChatMessage | null = yield call(
        chatService.sendActivityMessage,
        action.payload.activityId,
        action.payload.text,
      );
      yield put(sendMessageSuccess({ tempId: action.payload.id, message }));

      const persistedId = message?.id ?? action.payload.id;
      yield put(
        markDeliveredRequest({
          activityId: action.payload.activityId,
          messageId: persistedId,
        }),
      );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to send message.';
    yield put(
      sendMessageFailure({
        tempId: action.payload.id,
        activityId: action.payload.activityId,
        message,
      }),
    );
  }
}

// ─── Delivery confirmation ─────────────────────────────────────────────────────

function* handleMarkDelivered(action: ReturnType<typeof markDeliveredRequest>) {
  const { activityId, messageId } = action.payload;
  try {
    yield call(chatService.markMessageDelivered, activityId, messageId);
    yield put(markDeliveredSuccess({ messageId }));
  } catch {
    yield put(markDeliveredFailure({ messageId }));
  }
}

// ─── Reactions ────────────────────────────────────────────────────────────────

function* handleReactMessage(action: ReturnType<typeof reactMessageRequest>) {
  const { activityId, messageId, emoji, userId } = action.payload;
  yield put(addReaction({ messageId, emoji, userId }));
  try {
    const updatedMessage: ChatMessage | null = yield call(
      chatService.reactToMessage,
      activityId,
      messageId,
      emoji,
    );
    yield put(reactMessageSuccess({ messageId, updatedMessage }));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to add reaction.';
    yield put(reactMessageFailure({ messageId, message }));
  }
}

// ─── Edit message ─────────────────────────────────────────────────────────────

function* handleEditMessage(action: ReturnType<typeof editMessageRequest>) {
  const { activityId, messageId, text } = action.payload;
  try {
    const updatedMessage: ChatMessage | null = yield call(
      chatService.editMessage,
      activityId,
      messageId,
      text,
    );
    yield put(
      editMessageSuccess({ messageId, updatedMessage, optimisticText: text }),
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to edit message.';
    yield put(
      editMessageFailure({
        messageId,
        originalText: action.payload.originalText,
        message,
      }),
    );
  }
}

// ─── Root chat saga ───────────────────────────────────────────────────────────

export function* chatSaga() {
  yield fork(watchFetchMessages);
  yield takeEvery('chat/socketJoinRoom',         handleJoinRoom);
  yield takeEvery(sendMessageRequest.type,       handleSendMessage);
  yield takeEvery(markDeliveredRequest.type,     handleMarkDelivered);
  yield takeEvery(reactMessageRequest.type,      handleReactMessage);
  yield takeEvery(editMessageRequest.type,       handleEditMessage);
  yield takeLatest(loadMoreMessagesRequest.type, handleLoadMoreMessages);
  yield takeLatest(loginSuccess.type,            handleSocketConnect);
  yield takeLatest(logout.type,                  handleSocketDisconnect);
}
