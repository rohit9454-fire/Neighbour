import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { chatService } from '../../services';
import { ChatMessage } from '../../types';
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
} from '../slices/chatSlice';

function* handleFetchMessages(action: ReturnType<typeof fetchMessagesRequest>) {
  try {
    const messages: ChatMessage[] = yield call(
      chatService.getActivityMessages,
      action.payload,
    );
    yield put(fetchMessagesSuccess({ activityId: action.payload, messages }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load messages.';
    yield put(fetchMessagesFailure({ activityId: action.payload, message }));
  }
}

function* handleSendMessage(action: ReturnType<typeof sendMessageRequest>) {
  try {
    const message: ChatMessage | null = yield call(
      chatService.sendActivityMessage,
      action.payload.activityId,
      action.payload.text,
    );
    yield put(sendMessageSuccess({ tempId: action.payload.id, message }));

    // After the server confirms the message, immediately call the delivered
    // endpoint. Use the server-assigned id if available, otherwise the temp id.
    const persistedId = message?.id ?? action.payload.id;
    yield put(markDeliveredRequest({
      activityId: action.payload.activityId,
      messageId: persistedId,
    }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send message.';
    yield put(sendMessageFailure({
      tempId: action.payload.id,
      activityId: action.payload.activityId,
      message,
    }));
  }
}

function* handleMarkDelivered(action: ReturnType<typeof markDeliveredRequest>) {
  const { activityId, messageId } = action.payload;
  try {
    yield call(chatService.markMessageDelivered, activityId, messageId);
    yield put(markDeliveredSuccess({ messageId }));
  } catch {
    // Fire-and-forget — silently swallow the error, update local state anyway
    yield put(markDeliveredFailure({ messageId }));
  }
}

function* handleReactMessage(action: ReturnType<typeof reactMessageRequest>) {
  const { activityId, messageId, emoji, userId } = action.payload;
  // Apply optimistic update immediately so the UI responds without waiting for the API
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
    const message = error instanceof Error ? error.message : 'Failed to add reaction.';
    // On failure the optimistic update stays visible; we report the error but
    // don't try to roll back the local state (reactions are non-critical).
    yield put(reactMessageFailure({ messageId, message }));
  }
}

function* handleEditMessage(action: ReturnType<typeof editMessageRequest>) {
  const { activityId, messageId, text } = action.payload;
  // The optimistic text was already applied by editMessageRequest reducer.
  // We carry `text` (the new value) forward so editMessageSuccess can
  // fall back to it if the server returns an empty/null body.
  try {
    const updatedMessage: ChatMessage | null = yield call(
      chatService.editMessage,
      activityId,
      messageId,
      text,
    );
    yield put(editMessageSuccess({
      messageId,
      updatedMessage,
      optimisticText: text,   // used as fallback when updatedMessage is null
    }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to edit message.';
    yield put(editMessageFailure({
      messageId,
      originalText: action.payload.originalText,
      message,
    }));
  }
}

export function* chatSaga() {
  yield takeLatest(fetchMessagesRequest.type, handleFetchMessages);
  yield takeEvery(sendMessageRequest.type, handleSendMessage);
  yield takeEvery(markDeliveredRequest.type, handleMarkDelivered);
  yield takeEvery(reactMessageRequest.type, handleReactMessage);
  yield takeEvery(editMessageRequest.type, handleEditMessage);
}
