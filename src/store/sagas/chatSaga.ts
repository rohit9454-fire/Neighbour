import { call, put, takeLatest } from 'redux-saga/effects';
import { chatService } from '../../services';
import { ChatMessage } from '../../types';
import {
  fetchMessagesFailure,
  fetchMessagesRequest,
  fetchMessagesSuccess,
  sendMessageFailure,
  sendMessageRequest,
  sendMessageSuccess,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send message.';
    yield put(sendMessageFailure({
      tempId: action.payload.id,
      activityId: action.payload.activityId,
      message,
    }));
  }
}

export function* chatSaga() {
  yield takeLatest(fetchMessagesRequest.type, handleFetchMessages);
  yield takeLatest(sendMessageRequest.type, handleSendMessage);
}
