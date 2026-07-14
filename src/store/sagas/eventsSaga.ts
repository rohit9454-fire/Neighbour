import { call, put, takeLatest } from 'redux-saga/effects';
import { addEventRequest, addEventSuccess } from '../slices/eventsSlice';
import { Event } from '../../types';

function generateId(): string {
  return Date.now().toString();
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Sports: '⚽',
  Culture: '🎭',
  Social: '🎉',
  Hobby: '🎨',
  Other: '📌',
};

function* handleAddEvent(action: ReturnType<typeof addEventRequest>) {
  const { title, date, location, category } = action.payload;
  const newEvent: Event = {
    id: (yield call(generateId)) as string,
    emoji: CATEGORY_EMOJIS[category ?? 'Other'] ?? '📌',
    title,
    date,
    location,
    going: 1,
    category,
  };
  yield put(addEventSuccess(newEvent));
}

export function* eventsSaga() {
  yield takeLatest(addEventRequest.type, handleAddEvent);
}
